# Nest Services Kafka Guide

## Overview
The nest_services package currently does not have Kafka producers or consumers in its runtime flow.

## Current state
- Startup entrypoint: `src/main.ts`
- Current focus: users, schedules, documents, auth, and supporting infrastructure
- No Kafka transport or kafkajs client is configured today

## What this means
- There are no active Kafka topics owned by this service at the moment
- No Kafka environment variables are required for the current runtime
- If Kafka is added later, this file should be expanded with the actual topics, payloads, and consumer groups

## Suggested future placement
If Kafka becomes part of this service later, the most likely responsibilities would be:
- emitting user lifecycle events
- publishing schedule changes
- consuming document or workflow notifications from other services

## Notes
- Keeping a Kafka README here avoids confusion for contributors who expect every backend service to have an event contract.
