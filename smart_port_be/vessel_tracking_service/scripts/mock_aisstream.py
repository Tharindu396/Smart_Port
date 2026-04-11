#!/usr/bin/env python3
"""Mock AISStream websocket server for local development.

Install:
    pip install websockets

Run:
    python scripts/mock_aisstream.py --host 127.0.0.1 --port 8765 --interval 2

Then set in .env:
    AIS_URL=ws://127.0.0.1:8765/v0/stream
    AIS_API_KEY=dummy-key
"""

from __future__ import annotations

import argparse
import asyncio
import json
import random
import signal
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import websockets
from websockets.legacy.server import WebSocketServerProtocol, serve

DEFAULT_BOUNDING_BOX = (-90.0, -180.0, 90.0, 180.0)
DEFAULT_NAMES = [
    "NEPTUNE",
    "AURORA",
    "SEABREEZE",
    "PACIFIC STAR",
    "OCEAN WAVE",
    "ATLANTIC SKY",
    "NORTH LIGHT",
    "MARINER",
    "HARBOR WIND",
    "CORAL BAY",
]


@dataclass
class VesselState:
    mmsi: int
    name: str
    latitude: float
    longitude: float
    sog: float
    cog: float
    heading: float

    def update(self, bbox: Tuple[float, float, float, float]) -> None:
        min_lat, min_lon, max_lat, max_lon = bbox
        drift = random.uniform(-0.02, 0.02)
        self.latitude = max(min(self.latitude + drift, max_lat), min_lat)
        self.longitude = max(min(self.longitude + random.uniform(-0.03, 0.03), max_lon), min_lon)
        self.sog = max(0.1, min(self.sog + random.uniform(-0.4, 0.4), 22.0))
        self.cog = (self.cog + random.uniform(-7.5, 7.5)) % 360.0
        self.heading = (self.cog + random.uniform(-2.0, 2.0)) % 360.0

    def to_aisstream_message(self) -> Dict[str, Any]:
        return {
            "MessageType": "PositionReport",
            "ValidAIS": True,
            "MetaData": {
                "ShipName": self.name,
                "MMSI": str(self.mmsi),
            },
            "Message": {
                "PositionReport": {
                    "UserID": self.mmsi,
                    "Latitude": self.latitude,
                    "Longitude": self.longitude,
                    "Sog": round(self.sog, 2),
                    "Cog": round(self.cog, 2),
                    "TrueHeading": round(self.heading, 2),
                    "TimeStamp": int(time.time()),
                }
            },
        }


class MockAISStreamServer:
    def __init__(self, interval: float, vessel_count: int, bbox: Tuple[float, float, float, float]) -> None:
        self.interval = interval
        self.vessel_count = vessel_count
        self.bbox = bbox
        self.vessels = self._build_vessels(vessel_count, bbox)
        self.connected_clients: set[WebSocketServerProtocol] = set()

    def _build_vessels(
        self,
        vessel_count: int,
        bbox: Tuple[float, float, float, float],
    ) -> List[VesselState]:
        min_lat, min_lon, max_lat, max_lon = bbox
        vessels: List[VesselState] = []
        for index in range(vessel_count):
            mmsi = 200000000 + index
            name = DEFAULT_NAMES[index % len(DEFAULT_NAMES)]
            latitude = random.uniform(min_lat, max_lat)
            longitude = random.uniform(min_lon, max_lon)
            sog = random.uniform(0.5, 18.0)
            cog = random.uniform(0.0, 360.0)
            heading = (cog + random.uniform(-5.0, 5.0)) % 360.0
            vessels.append(
                VesselState(
                    mmsi=mmsi,
                    name=name,
                    latitude=latitude,
                    longitude=longitude,
                    sog=sog,
                    cog=cog,
                    heading=heading,
                )
            )
        return vessels

    async def handler(self, websocket: WebSocketServerProtocol, path: str) -> None:
        if path != "/v0/stream":
            await websocket.close(code=1008, reason="invalid path")
            return

        self.connected_clients.add(websocket)
        try:
            subscription_raw = await asyncio.wait_for(websocket.recv(), timeout=30)
            try:
                subscription = json.loads(subscription_raw)
            except json.JSONDecodeError:
                subscription = {}

            bbox = self._extract_bbox(subscription) or self.bbox
            await self._send_loop(websocket, bbox)
        except asyncio.TimeoutError:
            await websocket.close(code=1008, reason="subscription timeout")
        except websockets.ConnectionClosed:
            return
        finally:
            self.connected_clients.discard(websocket)

    def _extract_bbox(self, subscription: Dict[str, Any]) -> Optional[Tuple[float, float, float, float]]:
        bounding_boxes = subscription.get("BoundingBoxes")
        if not bounding_boxes:
            return None

        try:
            first_box = bounding_boxes[0]
            min_corner = first_box[0]
            max_corner = first_box[1]
            return (
                float(min_corner[0]),
                float(min_corner[1]),
                float(max_corner[0]),
                float(max_corner[1]),
            )
        except (TypeError, ValueError, IndexError):
            return None

    async def _send_loop(self, websocket: WebSocketServerProtocol, bbox: Tuple[float, float, float, float]) -> None:
        while True:
            for vessel in self.vessels:
                vessel.update(bbox)
                await websocket.send(json.dumps(vessel.to_aisstream_message()))
                await asyncio.sleep(self.interval)


def parse_bbox(value: str) -> Tuple[float, float, float, float]:
    parts = [part.strip() for part in value.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("bbox must be minLat,minLon,maxLat,maxLon")

    try:
        min_lat, min_lon, max_lat, max_lon = (float(part) for part in parts)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("bbox values must be numbers") from exc

    if min_lat >= max_lat or min_lon >= max_lon:
        raise argparse.ArgumentTypeError("bbox must satisfy minLat < maxLat and minLon < maxLon")

    return min_lat, min_lon, max_lat, max_lon


async def main() -> None:
    parser = argparse.ArgumentParser(description="Mock AISStream websocket server")
    parser.add_argument("--host", default="127.0.0.1", help="bind host")
    parser.add_argument("--port", type=int, default=8765, help="bind port")
    parser.add_argument("--interval", type=float, default=2.0, help="seconds between vessel updates")
    parser.add_argument("--vessels", type=int, default=5, help="number of synthetic vessels")
    parser.add_argument(
        "--bbox",
        default="-90,-180,90,180",
        type=parse_bbox,
        help="bounding box as minLat,minLon,maxLat,maxLon",
    )
    args = parser.parse_args()

    server = MockAISStreamServer(interval=args.interval, vessel_count=args.vessels, bbox=args.bbox)

    async with serve(server.handler, args.host, args.port, ping_interval=20, ping_timeout=20):
        print(f"Mock AISStream listening on ws://{args.host}:{args.port}/v0/stream")
        print("Set AIS_URL=ws://127.0.0.1:8765/v0/stream and AIS_API_KEY=dummy-key in .env")

        stop_event = asyncio.Event()

        def _stop(*_: Any) -> None:
            stop_event.set()

        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, _stop)
            except NotImplementedError:
                pass

        await stop_event.wait()


if __name__ == "__main__":
    asyncio.run(main())
