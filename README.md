# ⚓ SmartPort: Cloud-Native Port Management System
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=next.js)](https://nextjs.org/)
[![Stack: NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs)](https://nestjs.com/)
[![Stack: Go](https://img.shields.io/badge/High--Performance-Go-00ADD8?logo=go)](https://go.dev/)
[![Infrastructure: Docker](https://img.shields.io/badge/Infrastructure-Docker%20Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

**SmartPort** is an enterprise-grade, highly available maritime logistics platform. It digitizes the vessel lifecycle from real-time AIS tracking to automated berth scheduling and document clearance using a modern, event-driven microservices architecture.

---

## 🏗️ System Architecture
The system utilizes a **Polyglot Microservices** model to ensure high concurrency and strict data integrity across all maritime operations.

### Tech Stack
* **Frontend:** `Next.js` (React) + `Leaflet.js` for real-time GIS mapping.
* **High-Performance Services:** `Go (Golang)` for AIS telemetry ingestion and scheduling algorithms.
* **Business Logic Services:** `NestJS` (TypeScript) for logistics, billing, and manifest management.
* **Persistence Layer:**
    * **PostgreSQL:** System of record for ACID-compliant billing and user data.
    * **Redis:** In-memory cache for live vessel coordinates and JWT sessions.
* **Event Streaming:** `Apache Kafka` for asynchronous inter-service communication.

---

## 🚀 Quick Start - Run Everything with Docker Compose

### Prerequisites
* **Docker:** v20.10 or higher ([Install](https://docs.docker.com/get-docker/))
* **Docker Compose:** v2.0 or higher (usually bundled with Docker Desktop)
* At least **4GB free RAM** (8GB recommended)
* **10GB free disk space**

### 1. Start the Complete Stack

```bash
# Navigate to project root
cd Smart_Port

# Start all services in the background
docker compose up -d

# Wait for services to initialize (30-60 seconds)
sleep 30

# Check status of all services
docker compose ps
```

**Expected Output:** All services should show `healthy` or `running` status.

### 2. Access Services

Once `docker compose ps` shows all services healthy:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Vessel Tracking API** | http://localhost:8001/api |
| **Berthing API** | http://localhost:8002/api |
| **Invoice API** | http://localhost:3001/api |
| **Logistics API** | http://localhost:3002/api |
| **Notifications API** | http://localhost:3004/api |

**Open http://localhost:3000 in your browser to access the SmartPort dashboard.**

### 3. Initialize Vessel Data (Important!)

Before you can see vessels on the map, you need to:

**Step A: Create shipping agents in the database**

```bash
# Connect to PostgreSQL
docker exec -it smartport-postgres psql -U postgres -d smartport

# Create shipping agents (paste into psql prompt):
INSERT INTO users (email, password_hash, role, created_at) 
VALUES 
  ('agent1@shipco.com', 'dummy_hash', 'shipping_agent', NOW()),
  ('agent2@shipco.com', 'dummy_hash', 'shipping_agent', NOW()),
  ('agent3@shipco.com', 'dummy_hash', 'shipping_agent', NOW());

# Verify creation
SELECT id, email, role FROM users WHERE role = 'shipping_agent';

# Exit psql
\q
```

**Step B: Seed vessels and assign to agents**

```bash
# Trigger the vessel seeding endpoint
curl -X POST http://localhost:8001/api/vessels/refresh

# You should see a 200 response
# Vessels are now seeded and assigned to random agents
```

**Step C: Verify vessels exist**

```bash
# Check that vessels were created
curl http://localhost:8001/api/vessels | jq '.[] | {id, name, shipping_agent_email}'
```

### 4. Stop the Stack

```bash
# Stop all containers (data persists)
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers, AND wipe all data
docker compose down -v
```

---

## 📋 Service Architecture

### Backend Services

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| **Vessel Tracking** | Go | 8001 | Real-time vessel location tracking via Kafka events |
| **Berthing Service** | Go | 8002 | Berth allocation scheduling and slot management |
| **Invoice Service** | NestJS | 3001 | Invoice generation, billing, and payment tracking |
| **Logistics Service** | NestJS | 3002 | Cargo tracking, manifest management, logistics coordination |
| **Nest Services** | NestJS | 3003 | Generic utility services and helpers |
| **Notification Service** | NestJS | 3004 | Email notifications, alerts, and real-time notifications |

### Infrastructure Services

| Component | Tech | Port | Purpose |
|-----------|------|------|---------|
| **PostgreSQL** | 15-alpine | 5432 | Primary database (vessels, visits, invoices, users) |
| **Kafka** | 7.5.0 | 9092 | Event message broker |
| **Zookeeper** | 7.5.0 | 2181 | Kafka cluster coordination |
| **Redis** | 7-alpine | 6379 | Caching and session storage |
| **Frontend** | Next.js | 3000 | Web dashboard and UI |

---

## 🔄 Event-Driven Architecture

Services communicate via Kafka topics:

| Topic | Producer | Consumer(s) | Event |
|-------|----------|-------------|-------|
| `vessel.arrived` | Vessel Tracking | Logistics | Vessel arrival at port |
| `vessel.departed` | Vessel Tracking | Invoice, Notification | Vessel departure (triggers billing) |
| `vessel.overstayed` | Vessel Tracking | Invoice, Notification | Vessel exceeded berth time |
| `allocation.confirmed` | Berthing | Invoice, Notification | Berth slot confirmed |
| `allocation.failed` | Berthing | Notification | Berth allocation failed |
| `invoice.created` | Invoice | Notification | Invoice generated |
| `payment.confirmed` | Invoice | Notification | Payment received |

---

## 🔧 Environment Variables & Configuration

Each service reads configuration from Docker Compose environment variables. To customize:

1. Edit `docker-compose.yml`
2. Modify the `environment:` section under the service
3. Restart the service:
   ```bash
   docker compose up -d <service-name>
   ```

### Database Configuration
```yaml
DB_HOST: postgres              # PostgreSQL hostname
DB_PORT: 5432                  # PostgreSQL port
DB_USER: postgres              # PostgreSQL username
DB_PASSWORD: 123456            # PostgreSQL password ⚠️ change in production
DB_NAME: smartport             # Database name
```

### Kafka Configuration
```yaml
KAFKA_BROKERS: kafka:29092     # Kafka broker (internal Docker network)
KAFKA_GROUP_ID: <service>-group # Consumer group (service-specific)
```

### Other Service Settings
```yaml
PORT: <service-port>           # HTTP server port
NODE_ENV: development          # Node.js environment
FRONTEND_URL: http://localhost:3000
```

---

## 🐛 Troubleshooting

### Services won't start or keep restarting

```bash
# 1. Check logs for the failing service
docker compose logs vessel-tracking-service

# 2. Restart just that service
docker compose restart vessel-tracking-service

# 3. Rebuild and restart
docker compose build vessel-tracking-service && docker compose up -d vessel-tracking-service

# 4. Check if ports are already in use
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # Mac/Linux
```

### "error loading .env file" in logs

This is **not an error** - it's expected in Docker containers. Services gracefully fall back to Docker environment variables (which is correct).

### Kafka broker unreachable or topics not found

Kafka needs time to initialize:

```bash
# Wait a bit longer and check health
sleep 30
docker compose ps smartport-kafka

# Should show "healthy". If not, check logs:
docker compose logs smartport-kafka | tail -30
```

### "No shipping agents available" on `/api/vessels/refresh`

You haven't created shipping agents yet. Follow **Step 3A** above to create agents in the database first.

### Database connection refused

PostgreSQL may still be starting. Services have retry logic, but you can manually check:

```bash
docker exec -it smartport-postgres pg_isready
# Should output: accepting connections
```

### "Address already in use" error

A port is already bound. Free the port or change it in `docker-compose.yml`:

```bash
# Find what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process or change the port in docker-compose.yml
```

---

## 📊 Database Tables & Schema

Key tables automatically created:

```sql
-- Vessels and their assignments
vessels (id, mmsi, name, shipping_agent_email, ...)

-- Berth/Dock information
berths (id, berth_code, berth_name, capacity, ...)

-- Visit history
visits (id, vessel_id, visit_date, checkout_date, ...)

-- Invoices and billing
invoices (id, visit_id, amount, status, ...)

-- User accounts
users (id, email, password_hash, role, ...)
```

### Inspect Database Manually

```bash
# Connect to PostgreSQL
docker exec -it smartport-postgres psql -U postgres -d smartport

# List all tables
\dt

# View vessels
SELECT mmsi, name, shipping_agent_email FROM vessels LIMIT 5;

# View users and their roles
SELECT email, role FROM users;

# Exit
\q
```

---

## 🔍 Debugging & Development

### View Live Logs

```bash
# All services
docker compose logs -f

# Specific service (follow logs)
docker compose logs -f vessel-tracking-service

# Last 50 lines of a service
docker compose logs --tail=50 invoice-service

# Logs since last 10 minutes
docker compose logs --since 10m notification-service
```

### Execute Commands Inside Containers

```bash
# PostgreSQL CLI
docker exec -it smartport-postgres psql -U postgres -d smartport

# Bash shell in a service
docker exec -it smartport-frontend sh
docker exec -it vessel-tracking-service sh

# Run a command
docker exec smartport-frontend npm --version
```

### Check Service Health

```bash
# Full status
docker compose ps

# Health check details
docker inspect smartport-postgres | grep -A 5 "Health"
```

### Restart Individual Services

```bash
# Restart one service
docker compose restart invoice-service

# Restart all services
docker compose restart

# Hard restart (stop + remove + start)
docker compose down && docker compose up -d
```

---

## 📁 Project Structure

```
Smart_Port/
├── docker-compose.yml              # Master Docker Compose configuration
├── README.md                        # This file
├── QUICK_REFERENCE.md              # Quick command reference
│
├── smart_port_be/                  # Backend services
│   ├── vessel_tracking_service/    # Go microservice (Port 8001)
│   │   ├── Dockerfile
│   │   ├── config/
│   │   ├── handlers/
│   │   ├── infrastructure/
│   │   └── routes/
│   │
│   ├── berthing_service/           # Go microservice (Port 8002)
│   ├── invoice_service/            # NestJS microservice (Port 3001)
│   ├── logistics_service/          # NestJS microservice (Port 3002)
│   ├── nest_services/              # NestJS microservice (Port 3003)
│   └── notification_service/       # NestJS microservice (Port 3004)
│
├── smart_port_fe/                  # Next.js frontend (Port 3000)
│   ├── Dockerfile
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── vessels/
│   │   ├── berth/
│   │   ├── invoice/
│   │   └── components/
│   └── lib/
│
└── terraform/                      # Infrastructure-as-Code (optional)
```

---

## ⚠️ Important Notes for Production

This Docker Compose setup is **for development only**. Before deploying to production:

1. **Secrets Management:**
   - Don't hardcode database passwords (use Docker secrets or HashiCorp Vault)
   - Rotate AIS API keys regularly
   - Use environment-specific .env files

2. **Security:**
   - Enable TLS/SSL for all services
   - Configure CORS properly (not `*`)
   - Add API rate limiting
   - Enable authentication/authorization on all APIs

3. **Persistence:**
   - Configure persistent volumes for PostgreSQL data
   - Backup strategy for critical databases
   - Archive old invoice records

4. **Scaling:**
   - Switch to Kubernetes for better orchestration
   - Use managed PostgreSQL (AWS RDS, Azure Database)
   - Use managed Kafka (AWS MSK, Confluent Cloud)
   - Add load balancers in front of services

5. **Monitoring:**
   - Add Prometheus for metrics collection
   - Use ELK stack or similar for centralized logging
   - Set up alerting for service failures
   - Monitor Kafka lag and consumer health

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs/)
- [Go Documentation](https://golang.org/doc/)

---

## 📞 Support

For issues or questions:

1. Check the **Troubleshooting** section above
2. View service logs: `docker compose logs <service-name>`
3. Check Docker Compose status: `docker compose ps`
4. Verify database connectivity: `docker exec -it smartport-postgres pg_isready`

---

**Last Updated:** April 2026  
**License:** MIT
