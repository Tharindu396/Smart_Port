# Vessel Tracking Service

This service ingests AIS telemetry over UDP and TCP, stores the latest vessel state in Redis, and streams live updates to WebSocket clients.

## Prerequisites

- Go 1.26 or newer
- Redis reachable from the machine running the service
- If you are running Redis locally on Windows, use `127.0.0.1:6379` instead of `localhost:6379`
- Optional: [Air](https://github.com/cosmtrek/air) for live reload during development

## Environment variables

Create a `.env` file in this directory. A ready-to-edit template is available in [`.env.example`](.env.example).

Required values:

- `REDIS_ADDR`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `AIS_UDP_ADDR` `optional, defaults to :9000`
- `AIS_TCP_ADDR` `optional, defaults to :9001`
- `AIS_FEED_ENABLED` `optional, defaults to false`
- `AIS_FEED_TYPE` `optional, defaults to api (supports: api, socket, file)`
- `AIS_FEED_URL` `required if AIS_FEED_ENABLED=true; URL or host:port`
- `AIS_FEED_AUTH_KEY` `optional API key for authentication`
- `AIS_FEED_POLL_INTERVAL` `optional polling interval in seconds, defaults to 30`
- `PORT` `optional, defaults to 8080`

### AIS Data Sources

The service supports three ways to ingest real-time AIS data:

1. **UDP/TCP listeners** (built-in, always active)
   - Receive AIS JSON on UDP port 9000 or TCP port 9001
   - Best for local or on-premise sources

2. **External AIS API feed** (opt-in, set `AIS_FEED_ENABLED=true` and `AIS_FEED_TYPE=api`)
   - Pull vessel data from a public or commercial AIS API
   - Set `AIS_FEED_URL` to the API endpoint and `AIS_FEED_AUTH_KEY` if needed
   - Examples: OpenSeaMap, MarineTraffic, or internal AIS provider

3. **Socket stream feed** (opt-in, set `AIS_FEED_ENABLED=true` and `AIS_FEED_TYPE=socket`)
   - Connect to a remote AIS stream server (TCP)
   - Set `AIS_FEED_URL` to `host:port`

4. **AISStream WebSocket feed** (opt-in, set `AISSTREAM_ENABLED=true`)
   - Connect to [aisstream.io](https://aisstream.io/) for global real-time AIS data
   - Set `AISSTREAM_API_KEY` to your AISStream API key
   - Optional: `AISSTREAM_MMSI` to filter by specific vessel (e.g., `"210408000"`)
   - The service automatically reconnects if connection drops
   - Speed is converted from knots to m/s (multiply by 0.514444)

## Run locally

1. Open a terminal in this folder.
2. Copy [`.env.example`](.env.example) to `.env` and fill in the Redis values.
3. Download dependencies if needed:

```bash
go mod download
```

4. Start the service:

```bash
go run main.go
```

5. Verify the health endpoint:

```bash
curl http://localhost:8080/health
```

## Development with Air

If you have Air installed, run:

```bash
air
```

The current Air config builds `tmp/main.exe` on Windows and runs the binary automatically.

## Build a binary

```bash
go build -o vessel-tracking-service.exe
```

On Linux or macOS, you can omit the `.exe` suffix.

## Swagger documentation

The OpenAPI spec for the current API is in [swagger.yaml](swagger.yaml).

Open it in any Swagger-compatible viewer, or paste the file contents into the [Swagger Editor](https://editor.swagger.io/).

## API

### `GET /health`

Returns a basic health response:

```json
{
  "status": "ok"
}
```

### `GET /vessels/:mmsi`

Returns the latest cached state for a vessel from Redis.

### `GET /ws/vessels`

Upgrades to a WebSocket connection and streams each vessel update as JSON.

### AIS ingest payload

Send newline-delimited JSON to either the UDP or TCP ingest port.

```json
{
  "mmsi": "123456789",
  "name": "Vessel Name",
  "lat": 1.2345,
  "lng": 103.9876,
  "speed": 12.3,
  "heading": 87.5,
  "status": "under_way",
  "timestamp": 1712145600
}
```

If `timestamp` is omitted, the service uses the current Unix timestamp.
