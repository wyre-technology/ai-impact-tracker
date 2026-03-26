"""Admin-only endpoints for session backfill, CRUD, settings, and CSV export."""

import csv
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import get_current_engineer_oid
from apps.api.db import get_session
from apps.api.models.schema import Client, Engineer, GlobalSettings, Session
from apps.api.schemas import (
    AdminSessionCreate,
    AdminSessionUpdate,
    ClientCreate,
    ClientOut,
    ClientUpdate,
    EngineerCreate,
    EngineerOut,
    EngineerUpdate,
    ExportRequest,
    GlobalSettingsOut,
    GlobalSettingsUpdate,
    SessionOut,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ── Admin dependency ─────────────────────────────────────────────────


async def require_admin(
    engineer_oid: str = Depends(get_current_engineer_oid),
    db: AsyncSession = Depends(get_session),
) -> Engineer:
    """Verify the current user is an admin. Returns the Engineer object."""
    result = await db.execute(
        select(Engineer).where(Engineer.entra_oid == engineer_oid)
    )
    engineer = result.scalar_one_or_none()
    if engineer is None:
        raise HTTPException(status_code=404, detail="Engineer not found")
    if not engineer.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return engineer


# ── Sessions ─────────────────────────────────────────────────────────


@router.post("/sessions", status_code=201, response_model=SessionOut)
async def admin_create_session(
    payload: AdminSessionCreate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Session:
    """Manual session entry (for backfilling historical data)."""
    # Verify engineer exists
    eng = await db.get(Engineer, payload.engineer_id)
    if eng is None:
        raise HTTPException(status_code=404, detail="Engineer not found")

    # Verify client exists if provided
    if payload.client_id:
        client = await db.get(Client, payload.client_id)
        if client is None:
            raise HTTPException(status_code=404, detail="Client not found")

    session = Session(
        engineer_id=payload.engineer_id,
        client_id=payload.client_id,
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
        hourly_rate=payload.hourly_rate or eng.default_hourly_rate,
        notes=payload.notes,
    )
    # Allow backdating
    if payload.created_at:
        session.created_at = payload.created_at

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.put("/sessions/{session_id}", response_model=SessionOut)
async def admin_update_session(
    session_id: uuid.UUID,
    payload: AdminSessionUpdate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Session:
    """Edit/correct a session."""
    session = await db.get(Session, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "task_type" in update_data and update_data["task_type"] is not None:
        update_data["task_type"] = update_data["task_type"].value

    for field, value in update_data.items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def admin_delete_session(
    session_id: uuid.UUID,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> None:
    """Delete a session."""
    session = await db.get(Session, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()


# ── Engineers ────────────────────────────────────────────────────────


@router.post("/engineers", status_code=201, response_model=EngineerOut)
async def admin_create_engineer(
    payload: EngineerCreate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Engineer:
    """Add an engineer."""
    engineer = Engineer(
        entra_oid=payload.entra_oid,
        name=payload.name,
        email=payload.email,
        default_hourly_rate=payload.default_hourly_rate,
        is_admin=payload.is_admin,
    )
    db.add(engineer)
    await db.commit()
    await db.refresh(engineer)
    return engineer


@router.put("/engineers/{engineer_id}", response_model=EngineerOut)
async def admin_update_engineer(
    engineer_id: uuid.UUID,
    payload: EngineerUpdate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Engineer:
    """Update engineer (name, rate, active status)."""
    engineer = await db.get(Engineer, engineer_id)
    if engineer is None:
        raise HTTPException(status_code=404, detail="Engineer not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(engineer, field, value)

    await db.commit()
    await db.refresh(engineer)
    return engineer


# ── Clients ──────────────────────────────────────────────────────────


@router.post("/clients", status_code=201, response_model=ClientOut)
async def admin_create_client(
    payload: ClientCreate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Client:
    """Add a client."""
    client = Client(
        name=payload.name,
        slug=payload.slug,
        monthly_mrr=payload.monthly_mrr,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.put("/clients/{client_id}", response_model=ClientOut)
async def admin_update_client(
    client_id: uuid.UUID,
    payload: ClientUpdate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Client:
    """Update client (name, MRR, active status)."""
    client = await db.get(Client, client_id)
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)
    return client


# ── Global Settings ──────────────────────────────────────────────────


@router.get("/settings", response_model=GlobalSettingsOut)
async def get_settings(
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Get global settings."""
    result = await db.execute(
        select(GlobalSettings).where(GlobalSettings.key == "default_hourly_rate")
    )
    row = result.scalar_one_or_none()
    rate = float(row.value) if row else 225.00
    return {"default_hourly_rate": rate}


@router.put("/settings", response_model=GlobalSettingsOut)
async def update_settings(
    payload: GlobalSettingsUpdate,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Update global settings."""
    result = await db.execute(
        select(GlobalSettings).where(GlobalSettings.key == "default_hourly_rate")
    )
    row = result.scalar_one_or_none()
    if row:
        row.value = str(payload.default_hourly_rate)
    else:
        db.add(GlobalSettings(key="default_hourly_rate", value=str(payload.default_hourly_rate)))

    await db.commit()
    return {"default_hourly_rate": payload.default_hourly_rate}


# ── CSV Export ───────────────────────────────────────────────────────


@router.post("/export")
async def export_sessions_csv(
    payload: ExportRequest,
    _admin: Engineer = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
) -> Response:
    """Export sessions as CSV with date range filter."""
    query = select(Session).order_by(Session.created_at.desc())

    if payload.start:
        query = query.where(Session.created_at >= payload.start)
    if payload.end:
        query = query.where(Session.created_at <= payload.end)
    if payload.client_id:
        query = query.where(Session.client_id == payload.client_id)
    if payload.engineer_id:
        query = query.where(Session.engineer_id == payload.engineer_id)

    result = await db.execute(query)
    sessions = list(result.scalars().all())

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "created_at", "engineer_id", "client_id", "project",
        "task_summary", "task_type", "duration_minutes",
        "files_created", "files_modified", "lines_added", "lines_removed",
        "estimated_manual_hours", "hourly_rate", "notes",
    ])
    for s in sessions:
        writer.writerow([
            str(s.id), s.created_at.isoformat(), str(s.engineer_id),
            str(s.client_id) if s.client_id else "",
            s.project, s.task_summary, s.task_type, s.duration_minutes,
            s.files_created, s.files_modified, s.lines_added, s.lines_removed,
            float(s.estimated_manual_hours), float(s.hourly_rate) if s.hourly_rate else "",
            s.notes or "",
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sessions_export.csv"},
    )
