# Vessel Tracking Service Kafka Guide

## Overview
The vessel tracking service is the live vessel state store. It publishes vessel lifecycle events, consumes invoice payment confirmations, and runs automatic status transitions for docked vessels.

## Runtime wiring
- Startup entrypoint: `main.go`
- Producer: `config/kafka.go` + `infrastructure/kafka_producer.go`
- Consumer: `infrastructure/kafka_consumer.go`
- Background jobs: `handlers/vessel_seed_scheduler.go`

## Topics produced
- `vessel.departed`
  - Emitted when a vessel changes status to `departed`
  - JSON payload contains vessel ID, timestamp, latitude, and longitude

- `vessel.overstayed`
  - Emitted when a vessel changes status to `overstayed`
  - JSON payload contains vessel ID, timestamp, checkout time, and overstay hours

## Topics consumed
- `invoice.paid`
  - Consumed after the invoice service confirms payment
  - Updates the vessel record to `docked`

## Automatic docked transition
After a vessel has been docked for 5 minutes, the scheduler randomly changes it to either `departed` or `overstayed`.

Defaults:
- `DOCKED_STATUS_DELAY_MINUTES=5`
- `DOCKED_STATUS_CHECK_MINUTES=1`

The scheduler updates the DB row, then emits the matching Kafka event so downstream services stay in sync.

## Business flow
1. Invoice service emits `invoice.paid`.
2. Vessel tracking consumes it and marks the vessel `docked`.
3. The docked scheduler watches for vessels that have stayed docked long enough.
4. After the delay, it randomly selects `departed` or `overstayed`.
5. The status is updated in Postgres.
6. The matching Kafka event is emitted for invoice and notification workflows.

## Environment variables
- `PORT`
- `KAFKA_BROKERS`
- `DOCKED_STATUS_DELAY_MINUTES`
- `DOCKED_STATUS_CHECK_MINUTES`
- `REDIS_ADDR`
- `REDIS_PASSWORD`
- `REDIS_DB`

## Notes
- The vessel update handler also emits `vessel.departed` and `vessel.overstayed` when those statuses are set manually through the HTTP API.
- The scheduler is intended for testing and simulation; increase the delay for production-like runs.
