# Smart Port - Multi-Service Launcher

This project includes scripts to easily start, stop, and manage all backend and frontend services for the Smart Port system.

## Quick Start

### Windows (PowerShell)
```powershell
# Allow script execution (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Start all services
.\run-all-services.ps1

# View help
.\run-all-services.ps1 -help
```

### macOS/Linux (Bash)
```bash
# Make script executable
chmod +x run-all-services.sh

# Start all services
./run-all-services.sh

# View help
./run-all-services.sh --help
```

### Docker (All Platforms)
```bash
# Start all services with Docker Compose
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Stop and remove volumes
docker-compose down -v
```

## Services

| Service | Type | Port | Status |
|---------|------|------|--------|
| **Frontend** | Next.js | 3000 | Web UI |
| **Vessel Tracking** | Go | 8001 | AIS data tracking |
| **Berthing** | Go | 8002 | Berth allocation & management |
| **Invoice** | NestJS | 3001 | Invoice generation & Kafka consumer |
| **Logistics** | NestJS | 3002 | Logistics management |
| **Nest Services** | NestJS | 3003 | Generic NestJS services |
| **Notification** | NestJS | 3004 | Notifications & Kafka consumer |

## Script Usage

### PowerShell (Windows)

#### Start all services
```powershell
.\run-all-services.ps1
```

#### Start specific services
```powershell
.\run-all-services.ps1 -services frontend,invoice,berthing
```

#### Stop all services
```powershell
.\run-all-services.ps1 -action stop
```

#### Restart all services
```powershell
.\run-all-services.ps1 -action restart
```

#### Check service status
```powershell
.\run-all-services.ps1 -action status
```

#### Skip dependency installation
```powershell
.\run-all-services.ps1 -skipDeps
```

#### View help
```powershell
.\run-all-services.ps1 -help
```

### Bash (macOS/Linux)

#### Start all services
```bash
./run-all-services.sh
```

#### Stop all services
```bash
./run-all-services.sh stop
```

#### Restart all services
```bash
./run-all-services.sh restart
```

#### Check service status
```bash
./run-all-services.sh status
```

#### View help
```bash
./run-all-services.sh --help
```

## Prerequisites

### All Platforms
- **Node.js** 18+ (https://nodejs.org)
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 13+ (database server)
- **Redis** 7+ (cache)
- **Kafka** 3.0+ (message queue)

### Additional
- **Go** 1.26+ (for Go services) - optional but recommended
- **Docker** & **Docker Compose** (for containerized deployment) - optional

## Environment Setup

### 1. Install Dependencies

```bash
# Windows
choco install nodejs postgresql redis

# macOS
brew install node postgresql redis

# Linux (Ubuntu/Debian)
sudo apt-get install nodejs npm postgresql redis-server
```

### 2. Database Setup

Create the database:
```sql
CREATE DATABASE smartport;
```

Or use the provided initialization script in `smart_port_be/berthing_service/scripts/dbInitialize.txt`

### 3. Environment Variables

Create `.env` files in each service directory:

#### smart_port_be/vessel_tracking_service/.env
```env
PORT=8001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=smartport
DB_SSLMODE=disable
REDIS_ADDR=localhost:6379
KAFKA_BROKERS=localhost:9092
AIS_URL=wss://stream.aisstream.io/v0/stream
AIS_API_KEY=your-api-key
FRONTEND_URL=http://localhost:3000
```

#### smart_port_be/berthing_service/.env
```env
PORT=8002
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=smartport
DB_SSLMODE=disable
KAFKA_BROKERS=localhost:9092
FRONTEND_URL=http://localhost:3000
```

#### smart_port_be/invoice_service/.env
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgres://postgres:123456@localhost:5432/smartport
KAFKA_BROKERS=localhost:9092
```

#### smart_port_be/logistics_service/.env
```env
PORT=3002
NODE_ENV=development
DATABASE_URL=postgres://postgres:123456@localhost:5432/smartport
```

#### smart_port_be/nest_services/.env
```env
PORT=3003
NODE_ENV=development
DATABASE_URL=postgres://postgres:123456@localhost:5432/smartport
```

#### smart_port_be/notification_service/.env
```env
PORT=3004
NODE_ENV=development
KAFKA_BROKERS=localhost:9092
```

## Logs

Service logs are saved to the `logs/` directory:

```
logs/
├── frontend.log
├── vessel-tracking.log
├── berthing.log
├── invoice.log
├── logistics.log
├── nest-services.log
└── notification.log
```

View logs:
```bash
# PowerShell
Get-Content logs/vessel-tracking.log -Wait

# Bash
tail -f logs/vessel-tracking.log
```

## Docker Compose Usage

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f invoice-service

# Follow new logs
docker-compose logs -f --tail 100
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Access Containers
```bash
# Access a service shell
docker exec -it smartport-invoice /bin/sh

# Check Kafka topics
docker exec smartport-kafka kafka-topics --list --bootstrap-server localhost:9092

# Read Kafka messages
docker exec smartport-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic vessel.departed \
  --from-beginning
```

## Troubleshooting

### Service won't start

1. **Check ports are available**
   ```powershell
   # PowerShell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

   # Bash
   lsof -i :3000
   ```

2. **Check logs**
   ```bash
   # PowerShell
   Get-Content logs/vessel-tracking.log -Last 50

   # Bash
   tail -50 logs/vessel-tracking.log
   ```

3. **Verify database connection**
   ```bash
   # Test PostgreSQL
   psql -h localhost -U postgres -d smartport

   # Test Redis
   redis-cli ping
   ```

### Database connection failed

1. Start PostgreSQL
   ```bash
   # Windows
   net start postgresql-x64-15

   # macOS
   brew services start postgresql

   # Linux
   sudo service postgresql start
   ```

2. Check connection string in `.env`

3. Ensure database exists:
   ```sql
   CREATE DATABASE smartport;
   ```

### Kafka connection failed

1. Start Kafka (or use Docker)
   ```bash
   docker-compose up -d kafka zookeeper
   ```

2. Verify Kafka is running
   ```bash
   docker exec smartport-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
   ```

3. Check `KAFKA_BROKERS` in `.env` (default: `localhost:9092`)

### Node dependency issues

1. Clear node_modules and reinstall
   ```bash
   rm -r smart_port_be/invoice_service/node_modules
   cd smart_port_be/invoice_service
   npm install
   ```

2. Clear npm cache
   ```bash
   npm cache clean --force
   npm install
   ```

### Port already in use

Change the port in the service's `.env` file and re-run the script.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Port 3000)                    │
│                      Next.js React App                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────┐
         │                                                      │
    ┌────▼────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
    │ Vessel  │  │ Berthing │  │Invoice  │  │ Logistics   │  │
    │Tracking │  │ Service  │  │Service  │  │ Service     │  │
    │(8001)   │  │ (8002)   │  │(3001)   │  │ (3002)      │  │
    └────┬────┘  └──┬───────┘  └────┬────┘  └──────┬───────┘  │
         │          │               │              │          │
         └─────────────────┬────────────────────────┘          │
                           │                                   │
                    ┌──────▼──────┐                            │
                    │  PostgreSQL  │                            │
                    │   (5432)     │                            │
                    └──────────────┘                            │
                                                               │
    ┌──────────────────────────────────────────────────────┐  │
    │                      Kafka                           │  │
    │  - vessel.departed    - berth-reservations         │  │
    │  - vessel.overstayed  - payment.updates            │  │
    └──────────────────────────────────────────────────────┘  │
         │                                                     │
         ├──────────────┐                                      │
         │              │                                      │
    ┌────▼──────┐  ┌────▼────────┐                            │
    │ Redis     │  │Notification │                            │
    │ (6379)    │  │Service(3004) │                            │
    └───────────┘  └──────────────┘                            │
         │                                                     │
         └──────────────────────────────────────────────────────┘
```

## Performance Tuning

### For Development
- Use `npm run start:dev` for hot-reload
- Monitor logs for errors
- Keep number of services to minimum needed

### For Production
- Use `npm run build && npm run start:prod`
- Set `NODE_ENV=production`
- Use Docker Compose with resource limits
- Monitor service health and logs

## Monitoring

### Check Service Health

```bash
# Test API endpoints
curl http://localhost:8001/health
curl http://localhost:3001/health
curl http://localhost:3000/api/health
```

### Monitor Resource Usage

```bash
# Docker
docker stats

# System
top        # or Task Manager on Windows
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Go Documentation](https://golang.org/doc/)

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `.env` file configuration
3. Verify all prerequisites are installed
4. Check service documentation in each service directory
