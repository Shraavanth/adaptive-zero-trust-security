import json
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.capture.capture_service import capture_service

router = APIRouter(prefix="/api/events", tags=["Real-Time Streaming"])

async def packet_event_generator() -> AsyncGenerator[str, None]:
    """
    Subscribes to CaptureService and streams captured packets and security alerts
    directly to the frontend via Server-Sent Events (SSE).
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=200)
    loop = asyncio.get_event_loop()

    def on_packet(pkt):
        try:
            loop.call_soon_threadsafe(queue.put_nowait, pkt)
        except Exception:
            pass  # Drop if queue saturated to maintain SOC UI performance

    capture_service.subscribe(on_packet)
    try:
        # Initial keep-alive ping
        yield f"data: {json.dumps({'type': 'CONNECTED', 'status': 'STREAMING'})}\n\n"

        while True:
            try:
                pkt = await asyncio.wait_for(queue.get(), timeout=2.0)
                payload = json.dumps({"type": "PACKET", "data": pkt}, default=str)
                yield f"data: {payload}\n\n"
            except asyncio.TimeoutError:
                # Periodic heartbeat to keep SSE connection alive
                yield f": ping\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        capture_service.unsubscribe(on_packet)

@router.get("/stream")
async def stream_live_events():
    return StreamingResponse(
        packet_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
