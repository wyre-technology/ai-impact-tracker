"""Computed metric aggregation endpoints."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth import get_current_engineer_oid, get_optional_engineer_oid
from apps.api.db import get_session
from apps.api.models.schema import Client, Engineer, Session
from apps.api.schemas import (
    ClientMetrics,
    EngineerMetrics,
    MetricsSummary,
    MonthMetrics,
    TaskTypeMetrics,
)

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])


def _apply_filters(query, start, end, client_id, engineer_id):
    """Apply common date and entity filters to a query."""
    if start:
        query = query.where(Session.created_at >= start)
    if end:
        query = query.where(Session.created_at <= end)
    if client_id:
        query = query.where(Session.client_id == client_id)
    if engineer_id:
        query = query.where(Session.engineer_id == engineer_id)
    return query


@router.get("/summary", response_model=MetricsSummary)
async def metrics_summary(
    _engineer_oid: str | None = Depends(get_optional_engineer_oid),
    db: AsyncSession = Depends(get_session),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    client_id: uuid.UUID | None = Query(None),
    engineer_id: uuid.UUID | None = Query(None),
) -> MetricsSummary:
    """Aggregate metrics across all sessions."""
    # Overall aggregates
    agg_query = select(
        func.count(Session.id).label("total_sessions"),
        func.coalesce(func.sum(Session.duration_minutes), 0).label("total_minutes"),
        func.coalesce(func.sum(Session.estimated_manual_hours), 0).label(
            "total_manual_hours"
        ),
        func.coalesce(
            func.sum(Session.estimated_manual_hours * Session.hourly_rate), 0
        ).label("dollar_value"),
    )
    agg_query = _apply_filters(agg_query, start, end, client_id, engineer_id)
    row = (await db.execute(agg_query)).one()

    total_sessions = row.total_sessions
    total_ai_hours = float(row.total_minutes) / 60.0
    total_manual_hours = float(row.total_manual_hours)
    hours_saved = total_manual_hours - total_ai_hours
    dollar_value = float(row.dollar_value)
    leverage = total_manual_hours / total_ai_hours if total_ai_hours > 0 else 0.0

    # By task type
    tt_query = select(
        Session.task_type,
        func.count(Session.id).label("sessions"),
        func.sum(Session.duration_minutes).label("minutes"),
        func.sum(Session.estimated_manual_hours).label("manual_hours"),
        func.sum(Session.estimated_manual_hours * Session.hourly_rate).label(
            "dollar_value"
        ),
    ).group_by(Session.task_type)
    tt_query = _apply_filters(tt_query, start, end, client_id, engineer_id)
    tt_rows = (await db.execute(tt_query)).all()

    by_task_type = {}
    for r in tt_rows:
        ai_h = float(r.minutes or 0) / 60.0
        manual_h = float(r.manual_hours or 0)
        by_task_type[r.task_type] = TaskTypeMetrics(
            sessions=r.sessions,
            ai_hours=round(ai_h, 2),
            estimated_manual_hours=round(manual_h, 2),
            hours_saved=round(manual_h - ai_h, 2),
            dollar_value=round(float(r.dollar_value or 0), 2),
        )

    # By month
    month_expr = func.to_char(Session.created_at, "YYYY-MM")
    mo_query = (
        select(
            month_expr.label("month"),
            func.count(Session.id).label("sessions"),
            func.sum(Session.duration_minutes).label("minutes"),
            func.sum(Session.estimated_manual_hours).label("manual_hours"),
            func.sum(Session.estimated_manual_hours * Session.hourly_rate).label(
                "dollar_value"
            ),
        )
        .group_by(month_expr)
        .order_by(month_expr)
    )
    mo_query = _apply_filters(mo_query, start, end, client_id, engineer_id)
    mo_rows = (await db.execute(mo_query)).all()

    by_month = [
        MonthMetrics(
            month=r.month,
            sessions=r.sessions,
            hours_saved=round(float(r.manual_hours or 0) - float(r.minutes or 0) / 60.0, 2),
            dollar_value=round(float(r.dollar_value or 0), 2),
        )
        for r in mo_rows
    ]

    return MetricsSummary(
        total_sessions=total_sessions,
        total_ai_hours=round(total_ai_hours, 2),
        total_estimated_manual_hours=round(total_manual_hours, 2),
        hours_saved=round(hours_saved, 2),
        dollar_value=round(dollar_value, 2),
        ai_leverage_ratio=round(leverage, 2),
        by_task_type=by_task_type,
        by_month=by_month,
    )


@router.get("/clients", response_model=list[ClientMetrics])
async def metrics_by_client(
    _engineer_oid: str | None = Depends(get_optional_engineer_oid),
    db: AsyncSession = Depends(get_session),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
) -> list[ClientMetrics]:
    """Per-client metric breakdown."""
    query = (
        select(
            Session.client_id,
            func.coalesce(Client.name, "WYRE Internal").label("client_name"),
            func.count(Session.id).label("sessions"),
            func.sum(Session.duration_minutes).label("minutes"),
            func.sum(Session.estimated_manual_hours).label("manual_hours"),
            func.sum(Session.estimated_manual_hours * Session.hourly_rate).label(
                "dollar_value"
            ),
        )
        .outerjoin(Client, Session.client_id == Client.id)
        .group_by(Session.client_id, Client.name)
    )
    query = _apply_filters(query, start, end, None, None)
    rows = (await db.execute(query)).all()

    results = []
    for r in rows:
        ai_h = float(r.minutes or 0) / 60.0
        manual_h = float(r.manual_hours or 0)
        results.append(
            ClientMetrics(
                client_id=r.client_id,
                client_name=r.client_name,
                total_sessions=r.sessions,
                total_ai_hours=round(ai_h, 2),
                total_estimated_manual_hours=round(manual_h, 2),
                hours_saved=round(manual_h - ai_h, 2),
                dollar_value=round(float(r.dollar_value or 0), 2),
                ai_leverage_ratio=round(manual_h / ai_h, 2) if ai_h > 0 else 0.0,
            )
        )
    return results


@router.get("/engineers", response_model=list[EngineerMetrics])
async def metrics_by_engineer(
    _engineer_oid: str | None = Depends(get_optional_engineer_oid),
    db: AsyncSession = Depends(get_session),
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
) -> list[EngineerMetrics]:
    """Per-engineer metric breakdown."""
    query = (
        select(
            Session.engineer_id,
            Engineer.name.label("engineer_name"),
            func.count(Session.id).label("sessions"),
            func.sum(Session.duration_minutes).label("minutes"),
            func.sum(Session.estimated_manual_hours).label("manual_hours"),
            func.sum(Session.estimated_manual_hours * Session.hourly_rate).label(
                "dollar_value"
            ),
        )
        .join(Engineer, Session.engineer_id == Engineer.id)
        .group_by(Session.engineer_id, Engineer.name)
    )
    query = _apply_filters(query, start, end, None, None)
    rows = (await db.execute(query)).all()

    results = []
    for r in rows:
        ai_h = float(r.minutes or 0) / 60.0
        manual_h = float(r.manual_hours or 0)
        results.append(
            EngineerMetrics(
                engineer_id=r.engineer_id,
                engineer_name=r.engineer_name,
                total_sessions=r.sessions,
                total_ai_hours=round(ai_h, 2),
                total_estimated_manual_hours=round(manual_h, 2),
                hours_saved=round(manual_h - ai_h, 2),
                dollar_value=round(float(r.dollar_value or 0), 2),
                ai_leverage_ratio=round(manual_h / ai_h, 2) if ai_h > 0 else 0.0,
            )
        )
    return results
