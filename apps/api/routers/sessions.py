"""Session ingestion and listing endpoints."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import get_current_engineer_oid
from apps.api.db import get_session
from apps.api.models.schema import Client, Engineer, Session
from apps.api.schemas import SessionCreate, SessionList, SessionOut

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("", status_code=201, response_model=SessionOut)
async def create_session(
    payload: SessionCreate,
    _engineer_oid: str = Depends(get_current_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> Session:
    """Ingest a new session from the Claude Code stop hook."""
    # Resolve engineer by entra_oid
    result = await db.execute(
        select(Engineer).where(Engineer.entra_oid == payload.engineer_entra_oid)
    )
    engineer = result.scalar_one_or_none()
    if engineer is None:
        raise HTTPException(
            status_code=404,
            detail=f"Engineer with entra_oid '{payload.engineer_entra_oid}' not found",
        )

    # Resolve client by slug (optional)
    client_id: uuid.UUID | None = None
    if payload.client_slug:
        result = await db.execute(
            select(Client).where(Client.slug == payload.client_slug)
        )
        client = result.scalar_one_or_none()
        if client is None:
            raise HTTPException(
                status_code=404,
                detail=f"Client with slug '{payload.client_slug}' not found",
            )
        client_id = client.id

    session = Session(
        engineer_id=engineer.id,
        client_id=client_id,
        project=payload.project,
        task_summary=payload.task_summary,
        task_type=payload.task_type.value,
        duration_minutes=payload.duration_minutes,
        tool_calls=payload.tool_calls,
        files_created=payload.files_created,
        files_modified=payload.files_modified,
        lines_added=payload.lines_added,
        lines_removed=payload.lines_removed,
        estimated_manual_hours=payload.estimated_manual_hours,
        hourly_rate=engineer.default_hourly_rate,
        notes=payload.notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=SessionList)
async def list_sessions(
    _engineer_oid: str = Depends(get_current_engineer_oid),
    db: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client_id: uuid.UUID | None = Query(None),
    engineer_id: uuid.UUID | None = Query(None),
    task_type: str | None = Query(None),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
) -> dict:
    """List sessions with pagination and filters."""
    query = select(Session)
    count_query = select(func.count(Session.id))

    # Apply filters
    if client_id:
        query = query.where(Session.client_id == client_id)
        count_query = count_query.where(Session.client_id == client_id)
    if engineer_id:
        query = query.where(Session.engineer_id == engineer_id)
        count_query = count_query.where(Session.engineer_id == engineer_id)
    if task_type:
        query = query.where(Session.task_type == task_type)
        count_query = count_query.where(Session.task_type == task_type)
    if start:
        query = query.where(Session.created_at >= start)
        count_query = count_query.where(Session.created_at >= start)
    if end:
        query = query.where(Session.created_at <= end)
        count_query = count_query.where(Session.created_at <= end)

    # Get total count
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = (
        query.order_by(Session.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = list(result.scalars().all())

    return {"items": items, "total": total, "page": page, "page_size": page_size}
