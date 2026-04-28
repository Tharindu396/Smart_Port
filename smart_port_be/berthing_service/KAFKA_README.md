# Berthing Service Kafka Guide

## Overview
The berthing service is the port allocation engine. It listens for vessel arrival and payment updates, manages berth reservations in Neo4j, and exposes a Kafka producer for reservation confirmation events.

## Runtime wiring
- Startup entrypoint: `cmd/main.go`
- Kafka broker source: `config.LoadConfig().KafkaBrokers`
- Consumer group: `berthing-group`
- Main dependencies: Neo4j for slot allocation, Kafka for event-driven orchestration

## Topics

### Consumed
- `vessel.arrivals`
  - Produced by logistics service when a berth request is created
  - Payload: JSON containing `visitId`, `vesselId`, `vesselName`, `agentId`, and `dimensions`
  - Used to run berth allocation

- `payment.updates`
  - Produced by invoice or payment workflow
  - Key: vessel ID
  - Value: `SUCCESS` or `FAILURE`
  - Used to confirm or cancel berth reservations

### Produced
- `berth-reservations`
  - Emitted by `EmitBerthReserved()` in `internal/infrastructure/kafka_producer.go`
  - Key: vessel ID
  - Value: `RESERVED`
  - This is a thin signal for downstream services

## Business flow
1. Logistics creates a berth request and emits `vessel.arrivals`.
2. Berthing consumes the event and finds contiguous empty slots in Neo4j.
3. Matching slots are reserved with a temporary payment lock.
4. Payment updates arrive on `payment.updates`.
5. `SUCCESS` finalizes the berth assignment.
6. `FAILURE` releases the reserved slots.

## HTTP endpoints that interact with Kafka-driven state
- `POST /api/v1/allocate-berth`
- `GET /api/v1/berths/slots`
- `GET /api/v1/allocations/history`
- `POST /api/v1/payments/confirm`
- `POST /api/v1/payments/cancel`

## Environment variables
- `SERVER_PORT`
- `KAFKA_BROKERS`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`

## Notes
- The producer currently emits a plain `RESERVED` string, not JSON.
- The Kafka consumer is the main orchestration path; the service keeps the berth state consistent in Neo4j.
