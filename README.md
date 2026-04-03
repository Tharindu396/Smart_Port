# ⚓ SmartPort: Cloud-Native Port Management System
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=next.js)](https://nextjs.org/)
[![Stack: NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs)](https://nestjs.com/)
[![Stack: Go](https://img.shields.io/badge/High--Performance-Go-00ADD8?logo=go)](https://go.dev/)
[![Infrastructure: Kubernetes](https://img.shields.io/badge/Infrastructure-Kubernetes-326CE5?logo=kubernetes)](https://kubernetes.io/)

**SmartPort** is an enterprise grade, highly available maritime logistics platform. It digitizes the vessel lifecycle from real-time AIS tracking to automated berth scheduling and document clearance using a modern, event-driven microservices architecture.

---

## 🏗️ System Architecture
The system utilizes a **Polyglot Microservices** model to ensure high concurrency and strict data integrity.



### Tech Stack
* **Frontend:** `Next.js` (React) + `Leaflet.js` for real-time GIS mapping.
* **High-Performance Services:** `Go (Golang)` for AIS telemetry ingestion and scheduling algorithms.
* **Business Logic Services:** `NestJS` (TypeScript) for logistics, billing, and manifest management.
* **Persistence Layer:**
    * **PostgreSQL:** System of record for ACID-compliant billing and user data.
    * **Neo4j:** Graph database for spatial relationships and yard optimization.
    * **Redis:** In-memory cache for live vessel coordinates and JWT sessions.
* **Event Streaming:** `Apache Kafka` (CQRS Sync) & `RabbitMQ` (Async Pub/Sub).

---

## 🚀 Getting Started

### Prerequisites
* Docker & Docker Desktop
* Node.js (v18+)
* Go (v1.21+)

### 1. Installation & Setup
```bash
# Clone the repository

cd smartport

# Spin up infrastructure (DBs, Brokers, Caching)
