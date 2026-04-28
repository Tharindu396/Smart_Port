# Notification Service Kafka Guide

## Overview
The notification service is the user-facing event consumer. It listens for allocation, payment, penalty, and overstay events, then sends emails and stores notification records.

## Runtime wiring
- Startup entrypoint: `src/main.ts`
- Kafka microservice transport: `Transport.KAFKA`
- Consumer group: `notification-service` by default
- Kafka client ID: `notification-service` by default

## Topics consumed
- `allocation.confirmed`
  - Sends berth reservation confirmation emails
  - Stores an info-level notification

- `invoice.paid`
  - Sends payment confirmation emails
  - Stores an info-level notification

- `invoice.cancelled`
  - Sends payment failure emails
  - Stores a warning notification

- `vessel.overstayed`
  - Sends overstay warning emails
  - Stores a critical notification

- `invoice.penalty_applied`
  - Sends penalty trigger emails
  - Stores a warning notification

## Business flow
1. Another service publishes a business event to Kafka.
2. Notification service receives the event in `EventsConsumer`.
3. It renders an email template based on the topic.
4. It sends the email to the shipping company contact.
5. It stores an in-app notification for the dashboard.

## Environment variables
- `PORT`
- `KAFKA_BROKERS`
- `KAFKA_BROKER_URL`
- `KAFKA_CLIENT_ID`
- `KAFKA_GROUP_ID`
- `CORS_ORIGIN`

## Notes
- This service does not publish Kafka events today; it is a pure consumer.
- The email templates live under `src/template` and are selected by topic name.
