# Vessel Tracking Service - Kafka Integration Guide

## Overview
The Vessel Tracking Service now includes Kafka producer integration to emit real-time vessel events that other microservices can consume.

## New Components

### 1. **infrastructure/kafka_producer.go**
Kafka producer implementation with support for two event types:

#### Events
- **vessel.departed**: Emitted when a vessel changes status to "departed"
  - Key: vessel MMSI
  - Value: JSON with vessel ID, timestamp, latitude, longitude

- **vessel.overstayed**: Emitted when a vessel changes status to "overstayed"
  - Key: vessel MMSI
  - Value: JSON with vessel ID, timestamp, checkout time, overstay hours

### 2. **config/kafka.go**
Configuration management for Kafka initialization:
- Initializes producer with brokers from environment variables
- Provides singleton instance via `GetKafkaProducer()`
- Handles graceful shutdown

### 3. **handlers/vessel_handlers.go** (Updated)
Enhanced with Kafka event publishing:
- `SetKafkaProducer()`: Injects Kafka producer instance
- `UpdateVessel()`: Now publishes events when vessel status changes

### 4. **main.go** (Updated)
- Initializes Kafka producer on startup
- Registers Kafka producer with handlers
- Ensures graceful shutdown on exit

### 5. **invoice.paid consumer** (New)
- Consumes `invoice.paid` from the invoice service
- Updates the matching vessel row to `docked`
- Uses the `vessel_id` field from the payment confirmation payload

### 6. **docked transition scheduler** (New)
- Runs every 1 minute by default
- Finds vessels that have been `docked` for at least 5 minutes
- Randomly changes each one to `departed` or `overstayed`
- Emits the matching Kafka event after the DB update

## Configuration

### Environment Variables
Add to your `.env` file:

```env
# Kafka Configuration
# Comma-separated list of Kafka brokers
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
# Or for local development:
# KAFKA_BROKERS=127.0.0.1:9092
```

### Default Values
- If `KAFKA_BROKERS` is not set, defaults to `127.0.0.1:9092`

## Go Dependency
Added to `go.mod`:
```
github.com/segmentio/kafka-go v0.4.47
```

## Usage Examples

### Vessel Departure
When updating a vessel with status "departed":

```bash
PUT /vessels/{mmsi}
{
  "mmsi": "206728000",
  "name": "MV Aurora",
  "status": "departed",
  "latitude": 6.5,
  "longitude": 81.2,
  "speed": 12.5,
  "heading": 180.0,
  "timestamp": 1640000000
}
```

This triggers publication to `vessel.departed` topic.

### Vessel Overstay
When updating a vessel with status "overstayed":

```bash
PUT /vessels/{mmsi}
{
  "mmsi": "206728000",
  "name": "MV Aurora",
  "status": "overstayed",
  "latitude": 6.5,
  "longitude": 81.2,
  "speed": 0.0,
  "heading": 0.0,
  "timestamp": 1640000000
}
```

This triggers publication to `vessel.overstayed` topic.

### Invoice Payment Confirmation
When the invoice service emits `invoice.paid` for a vessel arrival, the vessel tracking service consumes the event and updates the vessel status to `docked`.

```json
{
  "invoice_id": "inv_123",
  "vessel_id": "210408000",
  "paid_at": "2026-04-28T10:15:00Z"
}
```

## Integration with Other Services

### Invoice Service
- Consumes `vessel.departed` and `vessel.overstayed` events
- Located in: `invoice_service/src/kafka/kafka.consumer.ts`
- Uses these events to:
  - Calculate late fees (overstay penalties)
  - Update invoice status based on vessel departure

### Vessel Tracking Service
- Consumes `invoice.paid` from the invoice service
- Updates the vessel record status to `docked`
- Keeps the operational vessel table aligned with billing confirmation

### Automatic Docked Transition
After a vessel has been docked for 5 minutes, the scheduler randomly changes it to either `departed` or `overstayed` and publishes the corresponding event.

You can tune this with environment variables:

```env
DOCKED_STATUS_DELAY_MINUTES=5
DOCKED_STATUS_CHECK_MINUTES=1
```

### Topics Mapping
| Event | Topic | Producer | Consumer |
|-------|-------|----------|----------|
| Vessel Departs | vessel.departed | vessel_tracking_service | invoice_service |
| Vessel Overstays | vessel.overstayed | vessel_tracking_service | invoice_service |
| Berth Reserved | berth-reservations | berthing_service | invoice_service |
| Payment Updates | payment.updates | berthing_service | invoice_service |
| Invoice Paid | invoice.paid | invoice_service | vessel_tracking_service |

## Event Schemas

### VesselDepartedEvent
```json
{
  "vessel_id": "206728000",
  "timestamp": 1640000000,
  "latitude": 6.5,
  "longitude": 81.2
}
```

### VesselOverstayedEvent
```json
{
  "vessel_id": "206728000",
  "timestamp": 1640000000,
  "checkout_time": 1639990000,
  "overstay_hours": 2.78
}
```

## Testing

### Local Setup with Docker Compose
```bash
# Start Kafka
docker-compose up -d

# The service will automatically connect and publish events
```

### Monitoring Events
```bash
# List topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Read events from vessel.departed
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic vessel.departed \
  --from-beginning

# Read events from vessel.overstayed
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic vessel.overstayed \
  --from-beginning
```

## Error Handling
- Connection errors are logged but don't crash the service
- Failed event publications are logged and return HTTP 500 status
- Kafka producer gracefully closes on service shutdown
- Broker connection failures are logged with broker list for debugging

## Future Enhancements
- Add event retry logic with exponential backoff
- Implement event batching for better throughput
- Add metrics collection (events published count, latency)
- Support for consumer groups if bidirectional communication needed
