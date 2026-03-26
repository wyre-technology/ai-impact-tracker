"""Engineer listing endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import get_current_engineer_oid, get_optional_engineer_oid
from apps.api.db import get_session
from apps.api.models.schema import Engineer
from apps.api.schemas import EngineerOut

router = APIRouter(prefix="/api/v1/engineers", tags=["engineers"])


@router.get("", response_model=list[EngineerOut])
async def list_engineers(
    _engineer_oid: str | None = Depends(get_optional_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> list[Engineer]:
    """List all engineers."""
    result = await db.execute(select(Engineer).order_by(Engineer.name))
    return list(result.scalars().all())


@router.get("/{engineer_id}", response_model=EngineerOut)
async def get_engineer(
    engineer_id: uuid.UUID,
    _engineer_oid: str | None = Depends(get_optional_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> Engineer:
    """Get a single engineer by ID."""
    result = await db.execute(select(Engineer).where(Engineer.id == engineer_id))
    engineer = result.scalar_one_or_none()
    if engineer is None:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return engineer
