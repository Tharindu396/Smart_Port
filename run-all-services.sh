#!/bin/bash

# Smart Port - Run All Services Script (Unix/Mac)
# This script starts all backend and frontend services for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_DIR="$PROJECT_ROOT/logs"
PIDS_FILE="$PROJECT_ROOT/.service-pids"

# Service configurations
declare -A SERVICES
SERVICES[frontend]="Frontend (Next.js)|smart_port_fe|node|npm run dev|3000"
SERVICES[vessel-tracking]="Vessel Tracking Service|smart_port_be/vessel_tracking_service|go|go run main.go|8001"
SERVICES[berthing]="Berthing Service|smart_port_be/berthing_service|go|go run ./cmd/main.go|8002"
SERVICES[invoice]="Invoice Service|smart_port_be/invoice_service|node|npm run start:dev|3001"
SERVICES[logistics]="Logistics Service|smart_port_be/logistics_service|node|npm run start:dev|3002"
SERVICES[nest-services]="Nest Services|smart_port_be/nest_services|node|npm run start:dev|3003"
SERVICES[notification]="Notification Service|smart_port_be/notification_service|node|npm run start:dev|3004"

# Functions
log_info() {
    echo -e "${BLUE}[$TIMESTAMP] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$TIMESTAMP] [SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[$TIMESTAMP] [ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$TIMESTAMP] [WARNING]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        log_error "Install from: https://nodejs.org"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi
    
    log_success "✓ Node.js $(node --version)"
    log_success "✓ npm $(npm --version)"
    
    if ! command -v go &> /dev/null; then
        log_warning "Go not found. Go services won't run."
    else
        log_success "✓ Go $(go version)"
    fi
}

install_dependencies() {
    local service=$1
    local path=$2
    local type=$3
    
    local full_path="$PROJECT_ROOT/$path"
    
    if [ ! -d "$full_path" ]; then
        log_error "Service directory not found: $full_path"
        return 1
    fi
    
    if [ "$type" = "node" ]; then
        if [ ! -d "$full_path/node_modules" ]; then
            log_info "Installing dependencies for $service..."
            pushd "$full_path" > /dev/null
            npm install --silent
            popd > /dev/null
            log_success "✓ Dependencies installed for $service"
        fi
    fi
    
    return 0
}

start_service() {
    local service=$1
    local name=$2
    local path=$3
    local type=$4
    local command=$5
    local port=$6
    
    local full_path="$PROJECT_ROOT/$path"
    local log_file="$LOG_DIR/$service.log"
    
    if [ ! -d "$full_path" ]; then
        log_error "ERROR: Service path not found: $full_path"
        return 1
    fi
    
    log_info "Starting $name on port $port..."
    
    mkdir -p "$LOG_DIR"
    
    # Start service in background
    (
        cd "$full_path"
        eval "$command" >> "$log_file" 2>&1
    ) &
    
    local pid=$!
    echo "$service:$pid" >> "$PIDS_FILE"
    
    sleep 1
    
    if ! kill -0 $pid 2>/dev/null; then
        log_error "Failed to start $name"
        return 1
    fi
    
    log_success "✓ $name started (PID: $pid)"
    log_info "  Logs: $log_file"
    
    return 0
}

stop_all_services() {
    log_info "Stopping all services..."
    
    if [ ! -f "$PIDS_FILE" ]; then
        log_warning "No services to stop"
        return 0
    fi
    
    while IFS=':' read -r service pid; do
        if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
            log_info "Stopping $service (PID: $pid)..."
            kill -TERM $pid 2>/dev/null || true
            wait $pid 2>/dev/null || true
            log_success "✓ $service stopped"
        fi
    done < "$PIDS_FILE"
    
    rm -f "$PIDS_FILE"
    log_success "All services stopped"
}

show_status() {
    log_info "Service Status:"
    echo ""
    
    for service in "${!SERVICES[@]}"; do
        IFS='|' read -r name path type command port <<< "${SERVICES[$service]}"
        
        if [ -f "$PIDS_FILE" ]; then
            pid=$(grep "^$service:" "$PIDS_FILE" | cut -d':' -f2)
            if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
                echo -e "  ${GREEN}✓ Running${NC} (Port: $port) - $name"
            else
                echo -e "  ${RED}✗ Stopped${NC} - $name"
            fi
        else
            echo -e "  ${RED}✗ Stopped${NC} - $name"
        fi
    done
    
    echo ""
}

show_help() {
    cat << EOF
Smart Port - Run All Services Script

USAGE:
    ./run-all-services.sh [options]

OPTIONS:
    start               Start all services (default)
    stop                Stop all services
    restart             Restart all services
    status              Show service status
    -h, --help          Show this help message

EXAMPLES:
    ./run-all-services.sh              # Start all services
    ./run-all-services.sh stop        # Stop all services
    ./run-all-services.sh restart     # Restart all services
    ./run-all-services.sh status      # Show service status

SERVICES:
EOF
    for service in "${!SERVICES[@]}"; do
        IFS='|' read -r name path type command port <<< "${SERVICES[$service]}"
        printf "    %-20s %s (Port: %s)\n" "$service" "$name" "$port"
    done
    
    cat << EOF

LOGS:
    Logs are saved to: $LOG_DIR/<service>.log

KEYBOARD SHORTCUTS:
    Press Ctrl+C to stop the script
    Services will be stopped gracefully

TROUBLESHOOTING:
    1. Ensure PostgreSQL and Kafka are running
    2. Check .env files in each service directory
    3. Review logs in the logs/ directory
    4. Verify ports are not already in use

EOF
}

# Main execution
action="${1:-start}"

case "$action" in
    start)
        log_info "Smart Port - Multi-Service Launcher"
        log_info "Project Root: $PROJECT_ROOT"
        
        check_prerequisites
        
        log_info "Installing dependencies..."
        for service in "${!SERVICES[@]}"; do
            IFS='|' read -r name path type command port <<< "${SERVICES[$service]}"
            install_dependencies "$service" "$path" "$type"
        done
        
        echo ""
        log_info "Starting services..."
        echo ""
        
        rm -f "$PIDS_FILE"
        
        for service in "${!SERVICES[@]}"; do
            IFS='|' read -r name path type command port <<< "${SERVICES[$service]}"
            start_service "$service" "$name" "$path" "$type" "$command" "$port"
            sleep 1
        done
        
        echo ""
        log_success "All services started! Press Ctrl+C to stop."
        echo ""
        show_status
        
        # Trap Ctrl+C
        trap stop_all_services INT TERM EXIT
        
        # Wait for services
        wait
        ;;
    stop)
        stop_all_services
        ;;
    restart)
        stop_all_services
        sleep 2
        exec "$0" start
        ;;
    status)
        show_status
        ;;
    -h|--help)
        show_help
        ;;
    *)
        log_error "Unknown action: $action"
        echo ""
        show_help
        exit 1
        ;;
esac
