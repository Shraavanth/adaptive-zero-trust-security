import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import init_db, SessionLocal
from app.honeypot.honeypot_service import seed_default_honeypots
from app.capture.capture_service import capture_service

# Routers
from app.api.routers import (
    health,
    capture,
    packets,
    flows,
    threats,
    investigations,
    trust,
    policies,
    response,
    honeypot,
    self_healing,
    audit,
    topology,
    testing,
    reports,
    settings as settings_router,
    events_ws
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing database schema...")
    init_db()

    db = SessionLocal()
    try:
        settings_router.load_persisted_settings(db)
        seed_default_honeypots(db)
    finally:
        db.close()

    logger.info(f"{settings.APP_NAME} started successfully.")
    yield

    # Shutdown sequence
    logger.info("Shutting down capture services...")
    capture_service.stop_capture()

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.TAGLINE,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all Routers
app.include_router(health.router)
app.include_router(capture.router)
app.include_router(packets.router)
app.include_router(flows.router)
app.include_router(threats.router)
app.include_router(investigations.router)
app.include_router(trust.router)
app.include_router(policies.router)
app.include_router(response.router)
app.include_router(honeypot.router)
app.include_router(self_healing.router)
app.include_router(audit.router)
app.include_router(topology.router)
app.include_router(testing.router)
app.include_router(reports.router)
app.include_router(settings_router.router)
app.include_router(events_ws.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
