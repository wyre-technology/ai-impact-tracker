"""Client listing endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import get_current_engineer_oid
from apps.api.db import get_session
from apps.api.models.schema import Client
from apps.api.schemas import ClientOut

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
async def list_clients(
    _engineer_oid: str = Depends(get_current_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> list[Client]:
    """List all clients."""
    result = await db.execute(select(Client).order_by(Client.name))
    return list(result.scalars().all())


@router.get("/{slug}", response_model=ClientOut)
async def get_client_by_slug(
    slug: str,
    _engineer_oid: str = Depends(get_current_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> Client:
    """Get a single client by slug."""
    result = await db.execute(select(Client).where(Client.slug == slug))
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=404, detail=f"Client '{slug}' not found")
    return client
