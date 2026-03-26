"""WYRE AI Impact Tracker — FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.config import settings
from apps.api.db import init_db
from apps.api.routers import admin, clients, engineers, metrics, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure tables exist (dev convenience). Shutdown: no-op."""
    await init_db()
    yield


app = FastAPI(
    title="WYRE AI Impact Tracker",
    description="Capture, quantify, and communicate AI-assisted engineering impact.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(sessions.router)
app.include_router(metrics.router)
app.include_router(clients.router)
app.include_router(engineers.router)
app.include_router(admin.router)


@app.get("/healthz", tags=["health"])
async def healthz() -> dict:
    """Health check — unauthenticated."""
    return {"status": "ok"}
