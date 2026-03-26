# WYRE AI Impact Tracker

Capture, quantify, and communicate the value of AI-assisted engineering work at WYRE Technology.

Every time an engineer finishes a Claude Code session, a stop hook automatically logs the session to a central API. The dashboard then turns that raw data into metrics: hours saved, dollar value generated, leverage ratios -- broken down by client, engineer, and task type. Use it for QBRs, internal reviews, and proving ROI on AI tooling.

## Architecture

```
 Engineer's Machine                    WYRE Infrastructure
+---------------------+              +------------------------+
|                     |              |                        |
|  Claude Code        |              |   FastAPI (uvicorn)    |
|    |                |   HTTPS      |    |                   |
|    +-- Stop Hook ---+------------->+    +-- PostgreSQL      |
|       (Python)      |  POST        |    |                   |
|                     |  /api/v1/    |    +-- Next.js Dashboard|
+---------------------+  sessions    |       (TBD)            |
                                     +------------------------+
```

**Data flow:**
1. Claude Code session ends and fires the stop hook
2. Hook uses Claude CLI to classify the work (task type, summary, manual-hours estimate)
3. Hook POSTs a session record to the Impact API
4. API stores it in PostgreSQL with the engineer's hourly rate
5. Dashboard and metrics endpoints expose hours saved, dollar value, and leverage ratios

## Quick Start

```bash
# 1. Clone and start everything
git clone https://github.com/wyre-technology/ai-impact-tracker.git
cd ai-impact-tracker
docker compose up -d

# 2. Verify the API is running
curl http://localhost:8000/healthz
# => {"status":"ok"}

# 3. Create an engineer (dev mode, no auth required beyond the header)
curl -X POST http://localhost:8000/api/v1/admin/engineers \
  -H "Content-Type: application/json" \
  -H "X-Dev-Engineer-OID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "entra_oid": "00000000-0000-0000-0000-000000000001",
    "name": "Jane Doe",
    "email": "jane@wyretechnology.com",
    "is_admin": true
  }'

# 4. Post a test session
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "X-Dev-Engineer-OID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "engineer_entra_oid": "00000000-0000-0000-0000-000000000001",
    "project": "ai-impact-tracker",
    "task_summary": "Initial project setup",
    "task_type": "development",
    "duration_minutes": 45,
    "files_created": 12,
    "files_modified": 3,
    "lines_added": 800,
    "lines_removed": 50,
    "estimated_manual_hours": 4.0
  }'

# 5. Check metrics
curl http://localhost:8000/api/v1/metrics/summary \
  -H "X-Dev-Engineer-OID: 00000000-0000-0000-0000-000000000001"
```

Interactive API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Installation (Stop Hook)

The stop hook runs on each engineer's machine and automatically logs Claude Code sessions to the API.

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/install.sh | bash
```

The installer will:
- Download `stop_hook.py` to `~/.claude/hooks/`
- Register it in `~/.claude/settings.json`
- Prompt for your Entra ID Object ID and API URL

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/install.ps1 | iex
```

### Manual Installation

1. Copy `hooks/claude-code/stop_hook.py` to `~/.claude/hooks/stop_hook.py`
2. Add to `~/.claude/settings.json`:
   ```json
   {
     "hooks": {
       "Stop": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "python3 ~/.claude/hooks/stop_hook.py",
               "timeout": 30
             }
           ]
         }
       ]
     }
   }
   ```
3. Set environment variables (see Configuration below)

## Configuration

### Hook Environment Variables (engineer's machine)

Set these in your shell profile (`~/.zshrc`, `~/.bashrc`, or Windows user env vars):

| Variable | Required | Description |
|----------|----------|-------------|
| `WYRE_ENGINEER_OID` | Yes | Your Entra ID Object ID (from Azure Portal > Users) |
| `WYRE_IMPACT_API_URL` | Yes | Base URL of the Impact API (e.g. `https://impact-api.wyretechnology.com`) |
| `WYRE_IMPACT_API_KEY` | Recommended | API key (`wyre_ak_...`) for authentication. Get one from an admin. |
| `WYRE_SESSION_CLIENT` | No | Client slug to attribute work to. Set per-project in `.envrc` or similar. |
| `WYRE_IMPACT_API_TOKEN` | No | Entra ID Bearer token (fallback if no API key). |

Example `.zshrc`:
```bash
export WYRE_ENGINEER_OID="ab12cd34-ef56-7890-abcd-ef1234567890"
export WYRE_IMPACT_API_URL="https://impact-api.wyretechnology.com"
export WYRE_IMPACT_API_KEY="wyre_ak_a1b2c3d4e5f6..."
```

Per-project client attribution (e.g. in a project's `.envrc`):
```bash
export WYRE_SESSION_CLIENT="acme-corp"
```

### API Environment Variables (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `IMPACT_DATABASE_URL` | `postgresql+asyncpg://impact:impact@localhost:5432/impact` | Async PostgreSQL connection string |
| `IMPACT_DEV_MODE` | `true` | Enable dev auth bypass (`X-Dev-Engineer-OID` header) |
| `IMPACT_DEBUG` | `false` | Enable debug logging |
| `IMPACT_ENTRA_TENANT_ID` | (empty) | Azure AD tenant ID for JWT validation |
| `IMPACT_ENTRA_CLIENT_ID` | (empty) | Azure AD app registration client ID |
| `IMPACT_ENTRA_AUTHORITY` | (empty) | Entra authority URL |
| `IMPACT_CORS_ORIGINS` | `["http://localhost:3000"]` | JSON array of allowed CORS origins |

## Authentication

The API supports three authentication methods, checked in order:

### 1. API Key (recommended for hooks)

Generate a key via the admin UI or API (see [docs/api-keys.md](docs/api-keys.md)), then pass it as a Bearer token:

```bash
curl -H "Authorization: Bearer wyre_ak_a1b2c3d4..." https://impact-api.wyretechnology.com/api/v1/sessions
```

API keys start with the `wyre_ak_` prefix. They are hashed (SHA-256) before storage -- the raw key is shown only once at creation time.

### 2. Entra ID JWT (production web app)

For the dashboard or other apps integrated with Azure AD, pass a standard Bearer JWT:

```bash
curl -H "Authorization: Bearer eyJ0eXAi..." https://impact-api.wyretechnology.com/api/v1/sessions
```

The API validates the token against your tenant's JWKS endpoint and extracts the `oid` claim.

### 3. Dev Mode Header (local development only)

When `IMPACT_DEV_MODE=true` (the default in docker-compose), pass the engineer's Entra OID directly:

```bash
curl -H "X-Dev-Engineer-OID: ab12cd34-ef56-..." http://localhost:8000/api/v1/sessions
```

This mode must never be enabled in production.

## API Reference

Base URL: `/api/v1`

All endpoints except `/healthz` require authentication.

### Sessions

#### `POST /api/v1/sessions`

Ingest a session from the stop hook.

**Request body:**
```json
{
  "engineer_entra_oid": "ab12cd34-...",
  "client_slug": "acme-corp",
  "project": "infra-automation",
  "task_summary": "Wrote Terraform modules for AKS cluster",
  "task_type": "iac",
  "duration_minutes": 45,
  "tool_calls": {"Edit": 12, "Bash": 8, "Read": 20},
  "files_created": 5,
  "files_modified": 3,
  "lines_added": 320,
  "lines_removed": 40,
  "estimated_manual_hours": 4.0,
  "notes": null
}
```

**Task types:** `iac`, `documentation`, `scripting`, `troubleshooting`, `admin`, `development`, `analysis`, `other`

**Response:** `201 Created` with the full session object including `id`, `created_at`, and computed `hourly_rate`.

#### `GET /api/v1/sessions`

List sessions with pagination and filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `page_size` | int | Items per page (default: 20, max: 100) |
| `client_id` | UUID | Filter by client |
| `engineer_id` | UUID | Filter by engineer |
| `task_type` | string | Filter by task type |
| `start` | datetime | Sessions after this time |
| `end` | datetime | Sessions before this time |

**Response:**
```json
{
  "items": [...],
  "total": 142,
  "page": 1,
  "page_size": 20
}
```

### Metrics

#### `GET /api/v1/metrics/summary`

Aggregate metrics across all sessions. Supports `start`, `end`, `client_id`, and `engineer_id` query filters.

**Response:**
```json
{
  "total_sessions": 142,
  "total_ai_hours": 71.5,
  "total_estimated_manual_hours": 428.0,
  "hours_saved": 356.5,
  "dollar_value": 96300.00,
  "ai_leverage_ratio": 5.99,
  "by_task_type": {
    "iac": {
      "sessions": 45,
      "ai_hours": 22.0,
      "estimated_manual_hours": 180.0,
      "hours_saved": 158.0,
      "dollar_value": 40500.00
    }
  },
  "by_month": [
    {"month": "2026-01", "sessions": 30, "hours_saved": 75.0, "dollar_value": 18750.00}
  ]
}
```

#### `GET /api/v1/metrics/clients`

Per-client metric breakdown. Supports `start` and `end` query filters.

**Response:** Array of `ClientMetrics` objects with `client_id`, `client_name`, `total_sessions`, `total_ai_hours`, `total_estimated_manual_hours`, `hours_saved`, `dollar_value`, and `ai_leverage_ratio`.

#### `GET /api/v1/metrics/engineers`

Per-engineer metric breakdown. Supports `start` and `end` query filters.

**Response:** Array of `EngineerMetrics` objects with `engineer_id`, `engineer_name`, and the same metric fields as client metrics.

### Clients

#### `GET /api/v1/clients`

List all clients.

#### `GET /api/v1/clients/{slug}`

Get a single client by slug.

### Engineers

#### `GET /api/v1/engineers`

List all engineers.

#### `GET /api/v1/engineers/{id}`

Get a single engineer by UUID.

### Admin Endpoints

All admin endpoints require the authenticated user to have `is_admin = true`.

#### Sessions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/sessions` | Create a session manually (backfill). Accepts `engineer_id` (UUID) instead of `entra_oid`. Supports `created_at` for backdating. |
| `PUT` | `/api/v1/admin/sessions/{id}` | Edit/correct a session. Partial updates supported. |
| `DELETE` | `/api/v1/admin/sessions/{id}` | Delete a session. |

#### Engineers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/engineers` | Add an engineer. Fields: `entra_oid`, `name`, `email`, `default_hourly_rate` (default: 225.00), `is_admin`. |
| `PUT` | `/api/v1/admin/engineers/{id}` | Update engineer fields (name, email, rate, active, is_admin). |

#### Clients

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/clients` | Add a client. Fields: `name`, `slug`, `monthly_mrr`. |
| `PUT` | `/api/v1/admin/clients/{id}` | Update client fields (name, slug, MRR, active). |

#### Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/settings` | Get global settings (currently: `default_hourly_rate`). |
| `PUT` | `/api/v1/admin/settings` | Update global settings. |

#### API Keys

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/api-keys` | Create an API key for an engineer. Returns the raw key once. |
| `GET` | `/api/v1/admin/api-keys` | List all API keys (prefix only, never the full key). |
| `DELETE` | `/api/v1/admin/api-keys/{id}` | Revoke an API key. |

See [docs/api-keys.md](docs/api-keys.md) for the full API key lifecycle guide.

#### CSV Export

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/export` | Export sessions as CSV. Body accepts `start`, `end`, `client_id`, `engineer_id` filters. |

### Health

#### `GET /healthz`

Unauthenticated health check. Returns `{"status": "ok"}`.

## Dashboard

The Next.js dashboard (in `apps/web/`, TBD) will provide:

- **Summary page** -- total hours saved, dollar value, leverage ratio, trend charts
- **Client breakdown** -- per-client metrics table and charts
- **Engineer breakdown** -- per-engineer metrics table
- **Session log** -- paginated, filterable list of all sessions
- **Admin panel** -- manage engineers, clients, settings, and API keys

Until the dashboard is built, use the interactive API docs at `/docs` or query the metrics endpoints directly.

## Admin Guide

### First-Time Setup

1. Start the API (`docker compose up -d`)
2. Create your first engineer as an admin:
   ```bash
   curl -X POST http://localhost:8000/api/v1/admin/engineers \
     -H "Content-Type: application/json" \
     -H "X-Dev-Engineer-OID: YOUR_ENTRA_OID" \
     -d '{
       "entra_oid": "YOUR_ENTRA_OID",
       "name": "Your Name",
       "email": "you@wyretechnology.com",
       "is_admin": true
     }'
   ```
3. Create API keys for each engineer (see [docs/api-keys.md](docs/api-keys.md))
4. Create clients for work attribution:
   ```bash
   curl -X POST http://localhost:8000/api/v1/admin/clients \
     -H "Content-Type: application/json" \
     -H "X-Dev-Engineer-OID: YOUR_ENTRA_OID" \
     -d '{"name": "Acme Corp", "slug": "acme-corp", "monthly_mrr": 5000.00}'
   ```
5. Distribute API keys and install instructions to your team

### Managing Engineers

- Set `default_hourly_rate` per engineer to calculate dollar value of time saved
- Set `is_admin: true` for users who need access to admin endpoints
- Deactivate engineers with `PUT /api/v1/admin/engineers/{id}` and `{"active": false}`

### Backfilling Data

Use `POST /api/v1/admin/sessions` to manually enter historical sessions. The `created_at` field accepts a datetime for backdating.

### Exporting Data

Use `POST /api/v1/admin/export` to download a CSV of all sessions, optionally filtered by date range, client, or engineer.

## Deployment

### Azure Container Apps

The `infra/` directory contains OpenTofu configuration for deploying to Azure Container Apps.

**Required environment variables in production:**

```
IMPACT_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/impact
IMPACT_DEV_MODE=false
IMPACT_ENTRA_TENANT_ID=your-tenant-id
IMPACT_ENTRA_CLIENT_ID=your-client-id
IMPACT_CORS_ORIGINS=["https://impact.wyretechnology.com"]
```

**Critical:** Set `IMPACT_DEV_MODE=false` in production. This disables the `X-Dev-Engineer-OID` header bypass and requires real authentication (API key or Entra JWT).

## Development

### Local Setup

```bash
# Start PostgreSQL and API with hot reload
docker compose up -d

# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# Health: http://localhost:8000/healthz
```

The docker-compose setup runs with `IMPACT_DEV_MODE=true`, so you can authenticate with just the `X-Dev-Engineer-OID` header.

### Database Migrations

```bash
cd apps/api
alembic upgrade head
```

### Monorepo Structure

```
apps/api/          FastAPI backend (Python, async SQLAlchemy, Pydantic v2)
apps/web/          Next.js dashboard (TBD)
hooks/claude-code/ Claude Code stop hook + installers
infra/             OpenTofu (Azure Container Apps)
docs/              Additional documentation
```

### Running Tests

```bash
cd apps/api
pytest
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
