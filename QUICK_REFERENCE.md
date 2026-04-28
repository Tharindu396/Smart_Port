# Smart Port - Quick Reference Guide

## Quick Commands

### Windows (PowerShell)
```powershell
# Start all services
.\run-all-services.ps1

# Start specific services
.\run-all-services.ps1 -services frontend,invoice

# Stop all services
.\run-all-services.ps1 -action stop

# Check status
.\run-all-services.ps1 -action status

# View help
.\run-all-services.ps1 -help
```

### Windows (Command Prompt - Batch)
```cmd
# Start all services
run-all-services.bat

# Stop all services
run-all-services.bat stop

# Check status
run-all-services.bat status

# View help
run-all-services.bat help
```

### macOS/Linux (Bash)
```bash
# Make executable (first time only)
chmod +x run-all-services.sh

# Start all services
./run-all-services.sh

# Stop all services
./run-all-services.sh stop

# Restart all services
./run-all-services.sh restart

# Check status
./run-all-services.sh status

# View help
./run-all-services.sh --help
```

### Docker Compose (All Platforms)
```bash
# Start all services with Docker
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart invoice-service

# Rebuild all images
docker-compose build --no-cache && docker-compose up -d
```

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Vessel Tracking API | http://localhost:8001 | AIS vessel tracking |
| Berthing API | http://localhost:8002 | Berth management |
| Invoice API | http://localhost:3001 | Invoice service |
| Logistics API | http://localhost:3002 | Logistics service |
| Nest Services | http://localhost:3003 | Generic services |
| Notification API | http://localhost:3004 | Notifications |

## Database

### Create Database
```sql
CREATE DATABASE smartport;
```

### Connection String
```
postgres://postgres:123456@localhost:5432/smartport
```

### Initialize Schema
Run SQL scripts from each service directory (if provided)

## Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `vessel.departed` | Vessel Tracking | Invoice, Notifications | Vessel left berth |
| `vessel.overstayed` | Vessel Tracking | Invoice, Notifications | Vessel exceeded time |
| `berth-reservations` | Berthing | Invoice | Berth reserved |
| `payment.updates` | Berthing | Invoice | Payment confirmed/failed |

## Port Quick Reference

| Service | Port | Type |
|---------|------|------|
| Frontend | 3000 | Next.js |
| Invoice | 3001 | NestJS |
| Logistics | 3002 | NestJS |
| Nest Services | 3003 | NestJS |
| Notification | 3004 | NestJS |
| Vessel Tracking | 8001 | Go |
| Berthing | 8002 | Go |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Message Queue |
| Zookeeper | 2181 | Coordinator |

## Environment Setup (One-Time)

### Windows
```powershell
# Install prerequisites
choco install nodejs postgresql redis

# Create database
psql -U postgres -c "CREATE DATABASE smartport;"
```

### macOS
```bash
# Install prerequisites
brew install node postgresql redis

# Start services
brew services start postgresql
brew services start redis

# Create database
createdb -U postgres smartport
```

### Linux (Ubuntu/Debian)
```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Create database
sudo -u postgres createdb smartport
```

## Logs Location

```
logs/
├── frontend.log          # Next.js frontend logs
├── vessel-tracking.log   # Vessel tracking service logs
├── berthing.log          # Berthing service logs
├── invoice.log           # Invoice service logs
├── logistics.log         # Logistics service logs
├── nest-services.log     # Nest services logs
└── notification.log      # Notification service logs
```

### View Logs
```bash
# PowerShell
Get-Content logs/frontend.log -Wait

# Bash
tail -f logs/frontend.log

# Docker
docker-compose logs -f frontend
```

## Troubleshooting

### Service won't start
1. Check if port is already in use: `lsof -i :3000` or `netstat -ano | findstr :3000`
2. Check logs in `logs/` directory
3. Verify `.env` files are configured
4. Ensure dependencies are installed

### Database connection failed
1. Check PostgreSQL is running: `psql -U postgres`
2. Verify database exists: `\l` in psql
3. Check connection string in `.env`

### Kafka connection failed
1. Start Kafka: `docker-compose up -d kafka zookeeper`
2. Check broker is reachable: `kafka-broker-api-versions --bootstrap-server localhost:9092`
3. Verify `KAFKA_BROKERS` in `.env`

### Port already in use
1. Find process using port: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
2. Kill process: `kill -9 <PID>` or close the window
3. Change port in `.env` and restart

### Node modules issues
1. Delete `node_modules`: `rm -rf smart_port_be/*/node_modules`
2. Clear npm cache: `npm cache clean --force`
3. Reinstall: `npm install` in each service directory

## Development Workflow

### 1. First Time Setup
```bash
# Clone repository
git clone <repo-url>
cd Smart_Port

# Create databases
createdb smartport

# Configure .env files (see RUN_SERVICES.md)

# Start services
./run-all-services.ps1    # Windows PowerShell
./run-all-services.sh     # macOS/Linux
docker-compose up -d      # Or use Docker
```

### 2. Daily Workflow
```bash
# Start services
./run-all-services.ps1

# Make code changes in your IDE

# Services auto-reload with `npm run start:dev`

# Check logs if needed
Get-Content logs/frontend.log -Wait

# Stop when done (Ctrl+C)
```

### 3. Testing Changes
```bash
# Test API endpoint
curl http://localhost:3001/api/invoices

# View Kafka topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Monitor logs
docker-compose logs -f invoice-service
```

## API Health Checks

```bash
# Test all services
curl http://localhost:3000     # Frontend
curl http://localhost:3001/health  # Invoice
curl http://localhost:3002/health  # Logistics
curl http://localhost:8001/health  # Vessel Tracking
curl http://localhost:8002/health  # Berthing
```

## Docker Commands

```bash
# View all running containers
docker ps

# View logs for a service
docker logs <container-id>

# Access service shell
docker exec -it <container-id> /bin/sh

# Stop a service
docker stop <container-id>

# Restart a service
docker restart <container-id>

# Remove containers and volumes
docker-compose down -v
```

## Performance Tips

1. **Use `npm run start:dev`** for hot-reload during development
2. **Monitor system resources**: `top` or Task Manager
3. **Check Docker stats**: `docker stats`
4. **Keep logs clean**: Archive old logs regularly
5. **Use specific service startup** instead of all services if not needed

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process or change port in `.env` |
| Database connection failed | Start PostgreSQL, check connection string |
| Node modules missing | Run `npm install` in service directory |
| npm version too old | Update with `npm install -g npm@latest` |
| Go not installed | Install from https://golang.org |
| Kafka not responding | Start with `docker-compose up -d kafka` |
| Frontend won't load | Check if Next.js dev server is running on 3000 |
| API calls fail | Check service is running, verify correct port |

## Resources

- **Documentation**: See [RUN_SERVICES.md](RUN_SERVICES.md) for detailed information
- **Service-specific**: Check README.md in each service directory
- **Architecture**: See architecture diagram in [RUN_SERVICES.md](RUN_SERVICES.md)
- **Logs**: Review logs in `logs/` directory for errors

## Support

For help:
1. Check this guide
2. Review logs in `logs/` directory
3. Read service-specific README files
4. Check `.env` configuration
5. Verify prerequisites are installed
