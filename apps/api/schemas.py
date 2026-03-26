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
    is_admin: bool
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


# ── Admin Schemas ────────────────────────────────────────────────────


class AdminSessionCreate(BaseModel):
    """Manual session entry by an admin (backfilling historical data)."""
    engineer_id: uuid.UUID
    client_id: uuid.UUID | None = None
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
    hourly_rate: float | None = None
    notes: str | None = None
    created_at: datetime | None = None  # Allow backdating


class AdminSessionUpdate(BaseModel):
    """Edit/correct a session."""
    client_id: uuid.UUID | None = None
    project: str | None = None
    task_summary: str | None = None
    task_type: TaskType | None = None
    duration_minutes: int | None = Field(None, ge=0)
    tool_calls: dict[str, int] | None = None
    files_created: int | None = Field(None, ge=0)
    files_modified: int | None = Field(None, ge=0)
    lines_added: int | None = Field(None, ge=0)
    lines_removed: int | None = Field(None, ge=0)
    estimated_manual_hours: float | None = Field(None, ge=0)
    hourly_rate: float | None = None
    notes: str | None = None


class EngineerCreate(BaseModel):
    entra_oid: str
    name: str
    email: str
    default_hourly_rate: float = 225.00
    is_admin: bool = False


class EngineerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    default_hourly_rate: float | None = None
    active: bool | None = None
    is_admin: bool | None = None


class ClientCreate(BaseModel):
    name: str
    slug: str
    monthly_mrr: float | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    monthly_mrr: float | None = None
    active: bool | None = None


class GlobalSettingsOut(BaseModel):
    default_hourly_rate: float


class GlobalSettingsUpdate(BaseModel):
    default_hourly_rate: float = Field(ge=0)


class ExportRequest(BaseModel):
    start: datetime | None = None
    end: datetime | None = None
    client_id: uuid.UUID | None = None
    engineer_id: uuid.UUID | None = None


# ── API Keys ─────────────────────────────────────────────────────────


class ApiKeyCreate(BaseModel):
    engineer_id: uuid.UUID
    name: str


class ApiKeyOut(BaseModel):
    """Returned when listing keys (no raw key)."""
    id: uuid.UUID
    engineer_id: uuid.UUID
    name: str
    key_prefix: str
    active: bool
    created_at: datetime
    last_used_at: datetime | None

    model_config = {"from_attributes": True}


class ApiKeyCreated(BaseModel):
    """Returned on creation (includes the raw key shown only once)."""
    id: uuid.UUID
    key: str
    name: str
    key_prefix: str
    created_at: datetime
