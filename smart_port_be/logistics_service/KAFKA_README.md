# Logistics Service Kafka Guide

## Overview
The logistics service is the berth request intake and visit management service. It creates vessel visits, publishes arrival events, and listens for berth allocation results.

## Runtime wiring
- Startup entrypoint: `src/main.ts`
- Kafka transport is enabled through `app.connectMicroservice()`
- Consumer group: `logistics-consumer-server`
- Visit persistence: PostgreSQL via TypeORM

## Topics

### Produced
- `vessel.arrivals`
  - Emitted when a berth request is created
  - Payload includes `visitId`, `vesselId`, `vesselName`, `agentId`, and vessel dimensions

### Consumed
- `berthing.allocated`
  - Marks the vessel visit as `ALLOCATED`

- `berthing.failed`
  - Marks the vessel visit as `REJECTED`

## Business flow
1. A user submits a berth request with a manifest file.
2. Logistics creates a vessel visit record with `PENDING_ALLOCATION` status.
3. It emits `vessel.arrivals` for the berthing service.
4. Berthing decides whether a slot can be assigned.
5. Logistics consumes either `berthing.allocated` or `berthing.failed`.
6. The visit status is updated to `ALLOCATED` or `REJECTED` accordingly.

## HTTP endpoints involved
- `POST /vessel/request-berth`
- `GET /vessel`
- `GET /vessel/:id`
- `DELETE /vessel/:id`

## Environment variables
- `PORT`
- `FRONTEND_URL`
- `KAFKA_BROKERS`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

## Notes
- Kafka is configured through NestJS microservices transport rather than a separate consumer class.
- The emitted arrival event is the start of the berth allocation chain.
