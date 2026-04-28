# Invoice Service Kafka Guide

## Overview
The invoice service is the billing and tariff engine. It consumes berth, payment, and vessel lifecycle events, calculates charges, persists invoices, and emits billing outcomes for other services.

## Runtime wiring
- Startup entrypoint: `src/main.ts`
- Kafka consumer: `src/kafka/kafka.consumer.ts`
- Kafka producer: `src/kafka/kafka.producer.ts`
- Inbound topic list: `src/kafka/kafka.topics.ts`
- Broker config source: `kafka.brokers`, `kafka.clientId`, `kafka.groupId`

## Topics

### Consumed
- `berth-reservations`
  - Key: vessel ID
  - Value: `RESERVED`
  - Used to create an initial pending invoice

- `payment.updates`
  - Key: vessel ID
  - Value: `SUCCESS` or `FAILURE`
  - Used to mark invoices paid or cancelled

- `vessel.departed`
  - JSON payload from vessel tracking
  - Used to store departure timestamps and actual duration

- `vessel.overstayed`
  - JSON payload from vessel tracking
  - Used to apply overstay penalties

### Produced
- `invoice.created`
- `invoice.paid`
- `invoice.cancelled`
- `invoice.penalty_applied`

## Business flow
1. Berthing publishes `berth-reservations` after a berth is reserved.
2. Invoice service fetches the berth allocation history from the berthing service.
3. It calculates base berth fees, port fees, and the initial total.
4. It creates a pending invoice and line items.
5. When payment succeeds, it marks the invoice paid and emits `invoice.paid`.
6. When payment fails, it cancels the invoice and emits `invoice.cancelled`.
7. When a vessel departs, it stores actual departure timing.
8. When a vessel overstays, it applies a penalty and emits `invoice.penalty_applied`.

## External dependency
The invoice service calls the berthing service HTTP API to enrich Kafka signals:
- `GET /api/v1/allocations/history?limit=100`

## Environment variables
- `PORT`
- `KAFKA_BROKERS`
- `KAFKA_CLIENT_ID`
- `KAFKA_GROUP_ID`
- `BERTHING_SERVICE_URL`
- `TARIFF_BERTH_PER_HOUR`
- `TARIFF_PORT_FEE`
- `TARIFF_PENALTY_PER_HOUR`
- `TARIFF_YARD_PER_CONTAINER_PER_HOUR`

## Notes
- `invoice.paid` is also consumed by vessel tracking to mark vessels as docked.
- `invoice.cancelled` is consumed by notification and can be used as a payment failure signal.
