# ─── Application Load Balancer ───────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "smartport-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = { Name = "smartport-alb" }
}

# ─── Target Groups ────────────────────────────────────────────────────────────
locals {
  service_ports = {
    "vessel-tracking-service" = 8001
    "berthing-service"        = 8002
    "invoice-service"         = 3001
    "logistics-service"       = 3002
    "nest-services"           = 3003
    "notification-service"    = 3004
    "frontend"                = 3000
  }
}

resource "aws_lb_target_group" "services" {
  for_each = local.service_ports

  name        = "sp-${each.key}"
  port        = each.value
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"   # required for Fargate

  health_check {
    enabled             = true
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200-299"
  }

  tags = { Name = "smartport-tg-${each.key}" }
}

# ─── ALB Listener (HTTP → redirect to HTTPS) ──────────────────────────────────
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ─── ALB Listener HTTPS ──────────────────────────────────────────────────────
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  # Default: route to frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["frontend"].arn
  }
}

# ─── Path-based routing rules ────────────────────────────────────────────────
resource "aws_lb_listener_rule" "api_vessel" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  condition {
    path_pattern { values = ["/api/vessel/*", "/api/vessel"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["vessel-tracking-service"].arn
  }
}

resource "aws_lb_listener_rule" "api_berthing" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20

  condition {
    path_pattern { values = ["/api/berthing/*", "/api/berthing"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["berthing-service"].arn
  }
}

resource "aws_lb_listener_rule" "api_invoice" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 30

  condition {
    path_pattern { values = ["/api/invoice/*", "/api/invoice"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["invoice-service"].arn
  }
}

resource "aws_lb_listener_rule" "api_logistics" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 40

  condition {
    path_pattern { values = ["/api/logistics/*", "/api/logistics"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["logistics-service"].arn
  }
}

resource "aws_lb_listener_rule" "api_notifications" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 50

  condition {
    path_pattern { values = ["/api/notifications/*", "/api/notifications"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["notification-service"].arn
  }
}

# ─── ACM TLS Certificate ─────────────────────────────────────────────────────
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = ["*.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "smartport-cert" }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ─── Route 53 ────────────────────────────────────────────────────────────────
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
