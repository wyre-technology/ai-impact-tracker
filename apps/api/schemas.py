"""Pydantic v2 request/response schemas."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TaskType(str, Enum):
    iac = "iac"
    documentation = "documentation"
    scripting = "scripting"
    troubleshooting = "troubleshooting"
    admin = "admin"
    development = "development"
    analysis = "analysis"
    other = "other"


# ── Sessions ──────────────────────────────────────────────────────────


class SessionCreate(BaseModel):
    engineer_entra_oid: str
    client_slug: str | None = None
    project: str
    task_summary: str
    task_type: TaskType
    duration_minutes: int = Field(ge=0)
    tool_calls: dict[str, int] = Field(default_factory=dict)
    files_created: int = Field(ge=0, default=0)
    files_modified: int = Field(ge=0, default=0)
    lines_added: int = Field(ge=0, default=0)
    lines_removed: int = Field(ge=0, default=0)
    estimated_manual_hours: float = Field(ge=0)
    notes: str | None = None


class SessionOut(BaseModel):
    id: uuid.UUID
    created_at: datetime
    engineer_id: uuid.UUID
    client_id: uuid.UUID | None
    project: str
    task_summary: str
    task_type: str
    duration_minutes: int
    tool_calls: dict[str, Any]
    files_created: int
    files_modified: int
    lines_added: int
    lines_removed: int
    estimated_manual_hours: float
    hourly_rate: float | None
    notes: str | None
    session_metadata: dict[str, Any]

    model_config = {"from_attributes": True}


class SessionList(BaseModel):
    items: list[SessionOut]
    total: int
    page: int
    page_size: int


# ── Engineers ─────────────────────────────────────────────────────────


class EngineerOut(BaseModel):
    id: uuid.UUID
    entra_oid: str
    name: str
    email: str
    default_hourly_rate: float
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Clients ───────────────────────────────────────────────────────────


class ClientOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    monthly_mrr: float | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Metrics ───────────────────────────────────────────────────────────


class TaskTypeMetrics(BaseModel):
    sessions: int
    ai_hours: float
    estimated_manual_hours: float
    hours_saved: float
    dollar_value: float


class MonthMetrics(BaseModel):
    month: str
    sessions: int
    hours_saved: float
    dollar_value: float


class MetricsSummary(BaseModel):
    total_sessions: int
    total_ai_hours: float
    total_estimated_manual_hours: float
    hours_saved: float
    dollar_value: float
    ai_leverage_ratio: float
    by_task_type: dict[str, TaskTypeMetrics]
    by_month: list[MonthMetrics]


class ClientMetrics(BaseModel):
    client_id: uuid.UUID | None
    client_name: str
    total_sessions: int
    total_ai_hours: float
    total_estimated_manual_hours: float
    hours_saved: float
    dollar_value: float
    ai_leverage_ratio: float


class EngineerMetrics(BaseModel):
    engineer_id: uuid.UUID
    engineer_name: str
    total_sessions: int
    total_ai_hours: float
    total_estimated_manual_hours: float
    hours_saved: float
    dollar_value: float
    ai_leverage_ratio: float
