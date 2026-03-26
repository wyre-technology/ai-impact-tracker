# PRD: WYRE AI Impact Tracker

**Version:** 1.0  
**Author:** Aaron Sachs / WYRE Technology  
**Status:** Ready for Claude Code Handoff  
**Last Updated:** 2025-03-25

---

## 1. Overview

### 1.1 Problem Statement

WYRE Technology engineers are generating significant, measurable value through AI-assisted work (Claude Code, Claude.ai) across infrastructure codification, documentation, troubleshooting acceleration, and client deliverables. This value is currently invisible — there is no system to capture, quantify, or communicate it to leadership or clients.

### 1.2 Solution

A lightweight, full-stack web application that:

1. **Ingests session data** from Claude Code stop hooks via a REST API
2. **Stores structured impact records** in PostgreSQL on Azure Container Apps
3. **Visualizes metrics** on a polished internal dashboard scoped per-client, per-engineer, and per-task-type
4. **Produces shareable impact reports** for QBRs and internal reviews

### 1.3 Goals

- Capture AI session impact passively with zero manual logging
- Translate raw session data into hours saved, dollar value, and capacity metrics
- Provide per-client views suitable for QBR presentations
- Provide aggregate views for WYRE leadership and MSP benchmarking
- Support engineer-level attribution for team performance visibility

### 1.4 Non-Goals (v1)

- Client-facing access (Entra ID internal only for v1; client access is v2)
- Real-time streaming updates (polling/refresh is sufficient)
- Mobile-native app
- Integration with billing or invoicing systems

---

## 2. Architecture

### 2.1 System Diagram

```
Claude Code Session
    │
    └── Stop Hook (Python/shell script)
            │
            ├── Collects: duration, tool call stats, files changed, lines delta
            ├── Prompts Claude for: task summary, task type classification, manual hours estimate
            └── POST /api/v1/sessions → Impact API
                        │
                        └── PostgreSQL (Azure Container Apps)
                                    │
                                    └── Next.js Dashboard (Azure Container Apps)
                                                │
                                                ├── /dashboard (aggregate view)
                                                ├── /clients/:id (per-client view)
                                                └── /engineers/:id (per-engineer view)
```

### 2.2 Infrastructure

| Component | Technology | Hosting |
|---|---|---|
| API | FastAPI (Python) | Azure Container Apps |
| Database | PostgreSQL 15 | Azure Container Apps (or Azure DB for PostgreSQL Flexible Server) |
| Frontend | Next.js 14 (App Router) | Azure Container Apps |
| Auth | Entra ID (MSAL / NextAuth) | Microsoft-managed |
| Secrets | Azure Key Vault | Azure-managed |
| Container Registry | Azure Container Registry | Azure-managed |

### 2.3 Monorepo Structure

```
wyre-ai-impact/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── sessions.py
│   │   │   ├── metrics.py
│   │   │   └── clients.py
│   │   ├── models/
│   │   │   └── schema.py     # SQLAlchemy models
│   │   ├── db.py
│   │   └── auth.py           # Entra ID token validation
│   └── web/                  # Next.js frontend
│       ├── app/
│       │   ├── dashboard/
│       │   ├── clients/[id]/
│       │   └── engineers/[id]/
│       ├── components/
│       └── lib/
├── hooks/
│   └── claude-code/
│       ├── stop_hook.py      # Claude Code stop hook
│       └── README.md
├── infra/                    # OpenTofu
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker-compose.yml        # Local dev
└── README.md
```

---

## 3. Data Model

### 3.1 Core Tables

#### `sessions`
Primary record written by the stop hook after each Claude Code session.

```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engineer_id     UUID NOT NULL REFERENCES engineers(id),
    client_id       UUID REFERENCES clients(id),   -- NULL = internal/WYRE
    project         TEXT NOT NULL,
    task_summary    TEXT NOT NULL,                  -- Claude-generated
    task_type       TEXT NOT NULL,                  -- see enum below
    duration_minutes INTEGER NOT NULL,
    tool_calls      JSONB NOT NULL DEFAULT '{}',    -- { "write_file": 12, "bash": 8 }
    files_created   INTEGER NOT NULL DEFAULT 0,
    files_modified  INTEGER NOT NULL DEFAULT 0,
    lines_added     INTEGER NOT NULL DEFAULT 0,
    lines_removed   INTEGER NOT NULL DEFAULT 0,
    estimated_manual_hours NUMERIC(5,2) NOT NULL,  -- Claude-estimated
    hourly_rate     NUMERIC(7,2),                   -- override; falls back to engineer default
    notes           TEXT,
    session_metadata JSONB DEFAULT '{}'             -- arbitrary hook-supplied extras
);

-- task_type enum values:
-- 'iac'            Infrastructure as Code / config codification
-- 'documentation'  Runbooks, PRDs, guides, reports
-- 'scripting'      PowerShell, Python, Bash scripts
-- 'troubleshooting' Incident investigation, debugging
-- 'admin'          Tenant admin, M365, Entra, licensing
-- 'development'    Application/tool development
-- 'analysis'       Research, discovery, planning
-- 'other'
```

#### `engineers`
```sql
CREATE TABLE engineers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entra_oid       TEXT UNIQUE NOT NULL,   -- Entra ID object ID
    name            TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    default_hourly_rate NUMERIC(7,2) NOT NULL DEFAULT 225.00,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `clients`
```sql
CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,   -- e.g. 'chattstate', 'wyre-internal'
    monthly_mrr     NUMERIC(10,2),          -- optional, for ROI calc
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 Derived Metrics (computed at query time)

```sql
-- Hours saved
SUM(estimated_manual_hours) - SUM(duration_minutes / 60.0)

-- Dollar value (cost avoidance)
SUM(estimated_manual_hours * hourly_rate)

-- AI leverage ratio
SUM(estimated_manual_hours) / NULLIF(SUM(duration_minutes / 60.0), 0)
```

---

## 4. API Specification

### 4.1 Authentication

All endpoints require a valid Entra ID bearer token in the `Authorization` header. The API validates tokens against the WYRE tenant using MSAL.

### 4.2 Endpoints

#### `POST /api/v1/sessions`
Ingest a new session from the Claude Code stop hook.

**Request body:**
```json
{
  "engineer_entra_oid": "string",
  "client_slug": "string | null",
  "project": "string",
  "task_summary": "string",
  "task_type": "iac | documentation | scripting | troubleshooting | admin | development | analysis | other",
  "duration_minutes": 47,
  "tool_calls": { "write_file": 12, "bash": 8, "read_file": 6 },
  "files_created": 4,
  "files_modified": 11,
  "lines_added": 623,
  "lines_removed": 224,
  "estimated_manual_hours": 6.0,
  "notes": "string | null"
}
```

**Response:** `201 Created` with the created session record.

#### `GET /api/v1/metrics/summary`
Aggregate metrics across all sessions.

**Query params:** `?start=ISO8601&end=ISO8601&client_id=uuid&engineer_id=uuid`

**Response:**
```json
{
  "total_sessions": 142,
  "total_ai_hours": 118.3,
  "total_estimated_manual_hours": 847.5,
  "hours_saved": 729.2,
  "dollar_value": 109380.00,
  "ai_leverage_ratio": 7.17,
  "by_task_type": { "iac": {...}, "documentation": {...} },
  "by_month": [...]
}
```

#### `GET /api/v1/metrics/clients`
Per-client breakdown.

#### `GET /api/v1/metrics/engineers`
Per-engineer breakdown.

#### `GET /api/v1/clients`
List all clients.

#### `GET /api/v1/sessions`
Paginated session list with filters.

---

## 5. Claude Code Stop Hook

### 5.1 Location
`hooks/claude-code/stop_hook.py`

### 5.2 Behavior

The stop hook fires at the end of every Claude Code session. It:

1. Collects session stats from the Claude Code session context (duration, tool call counts, file change stats)
2. Makes a final prompt to Claude asking for:
   - A 1-2 sentence task summary
   - Task type classification (from the enum)
   - Estimated manual hours to accomplish the same work without AI
3. Reads engineer identity from env var `WYRE_ENGINEER_OID` (set once in shell profile)
4. Reads optional client context from env var `WYRE_SESSION_CLIENT` (set per-project or per-session)
5. POSTs the assembled payload to the Impact API
6. Prints a brief confirmation to stdout

### 5.3 Configuration

```bash
# ~/.zshrc or ~/.bashrc
export WYRE_ENGINEER_OID="your-entra-object-id"
export WYRE_IMPACT_API_URL="https://impact-api.wyretechnology.com"
export WYRE_IMPACT_API_TOKEN="your-token"  # or use az CLI token refresh

# Per-project (in .claude/settings.json or project env)
export WYRE_SESSION_CLIENT="chattstate"
```

### 5.4 Claude Code settings.json integration

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/stop_hook.py"
          }
        ]
      }
    ]
  }
}
```

### 5.5 Prompt Template (for manual hours estimation)

```
You just completed a Claude Code session. Based on the work performed, provide:

1. task_summary: 1-2 sentences describing what was accomplished
2. task_type: one of [iac, documentation, scripting, troubleshooting, admin, development, analysis, other]
3. estimated_manual_hours: how long this work would take a skilled engineer without AI assistance

Session stats:
- Duration: {duration_minutes} minutes
- Files created: {files_created}
- Files modified: {files_modified}  
- Lines changed: +{lines_added} / -{lines_removed}
- Tool calls: {tool_calls_json}

Respond ONLY with a JSON object. No preamble.
```

---

## 6. Frontend — Dashboard

### 6.1 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth.js with Entra ID provider
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Data fetching:** SWR (client) + fetch (server components)

### 6.2 Pages & Views

#### `/dashboard` — Aggregate Overview
- KPI cards: Total Hours Saved, Dollar Value, AI Leverage Ratio, Total Sessions
- Hours saved over time (line chart, toggleable by month/quarter)
- Task type breakdown (donut chart)
- Top clients by AI impact (bar chart)
- Recent sessions table (last 10, with project, engineer, task type, hours saved)

#### `/clients` — Client List
- Card grid of all active clients
- Mini KPI per card: total hours saved, total dollar value, session count
- Sorted by total impact descending

#### `/clients/[slug]` — Per-Client View
- Client-specific KPI cards
- Hours saved over time for this client
- Task type breakdown for this client
- Engineer contributions (who's doing the work)
- Session history table

#### `/engineers` — Engineer List
- Card grid per engineer
- Mini KPI: sessions, hours saved, leverage ratio

#### `/engineers/[id]` — Per-Engineer View
- Individual KPI cards
- Task type breakdown
- Client distribution (where is their time going)
- Session history

### 6.3 Date Range Filter
All views support a global date range picker (This Month / Last 3 Months / Last 6 Months / YTD / Custom). State stored in URL params for shareability.

### 6.4 Dollar Value Configuration
A settings page (admin only) allows configuring the default hourly rate used for dollar value calculations. Per-engineer overrides stored in the `engineers` table.

---

## 7. Infrastructure (OpenTofu)

### 7.1 Resources to Provision

- Azure Resource Group: `rg-wyre-ai-impact`
- Azure Container Registry
- Azure Container Apps Environment
- Container Apps:
  - `impact-api` (FastAPI)
  - `impact-web` (Next.js)
  - `impact-db` (PostgreSQL) — or Azure DB for PostgreSQL Flexible Server
- Azure Key Vault (API secrets, DB connection string)
- Entra ID App Registration (dashboard SSO)

### 7.2 Key Variables

```hcl
variable "location" { default = "eastus2" }
variable "environment" { default = "prod" }
variable "entra_tenant_id" {}
variable "entra_client_id" {}
variable "db_password" { sensitive = true }
variable "default_hourly_rate" { default = 225 }
```

---

## 8. Implementation Phases

### Phase 1 — Core Data Pipeline (Week 1)
- [ ] PostgreSQL schema + migrations (Alembic)
- [ ] FastAPI with `/api/v1/sessions` POST endpoint
- [ ] Entra ID token validation middleware
- [ ] Stop hook script (Python)
- [ ] Local docker-compose for dev
- [ ] OpenTofu infra for Azure Container Apps

### Phase 2 — Dashboard (Week 2)
- [ ] Next.js scaffold with NextAuth + Entra ID
- [ ] `/dashboard` aggregate view with KPIs and charts
- [ ] `/clients` and `/clients/[slug]` views
- [ ] `/engineers` and `/engineers/[id]` views
- [ ] Date range filter (global)
- [ ] Deploy to Azure Container Apps

### Phase 3 — Polish & Seeding (Week 3)
- [ ] Seed historical data (backfill from memory/estimates)
- [ ] Dollar value settings page
- [ ] Export to PDF/CSV for QBR use
- [ ] README + onboarding docs for other WYRE engineers

### Phase 4 — Client-Facing (v2, future)
- [ ] Public read-only per-client views (magic link or Entra B2B)
- [ ] Branded client report generation
- [ ] Email digest (weekly impact summary)

---

## 9. Open Questions

| # | Question | Default Assumption |
|---|---|---|
| 1 | Should the stop hook require manual confirmation before posting, or fire silently? | Fire silently; engineer can delete via API if needed |
| 2 | What's the canonical hourly rate to use for dollar value? | $225/hr default, configurable per engineer |
| 3 | Should "WYRE internal" projects (TenantGuard, AFKBot, etc.) be attributed to a client? | No — use `client_id = NULL`, show as "WYRE Internal" in UI |
| 4 | Multi-engineer sessions (pair/review)? | Out of scope v1; hook captures session owner only |
| 5 | Should the leverage ratio (estimated vs actual hours) be shown to clients? | Yes — this is the headline metric for client-facing v2 |

---

## 10. Success Criteria

- Stop hook fires reliably at end of Claude Code sessions with no engineer intervention
- Dashboard loads in < 2s with 6 months of session history
- Per-client view is clean enough to screen-share in a QBR without embarrassment
- Dollar value calculation is explainable and defensible to leadership
- At least 3 WYRE engineers are logging sessions within 2 weeks of deploy
