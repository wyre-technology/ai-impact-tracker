# WYRE AI Impact Tracker

Capture, quantify, and communicate the value of AI-assisted engineering work at WYRE Technology.

## What it does

1. **Ingests session data** from Claude Code stop hooks via a REST API
2. **Stores structured impact records** in PostgreSQL
3. **Visualizes metrics** on an internal dashboard scoped per-client, per-engineer, and per-task-type
4. **Produces shareable impact reports** for QBRs and internal reviews

## Architecture

```
Claude Code Session
    |
    +-- Stop Hook (Python)
            |
            +-- POST /api/v1/sessions -> FastAPI
                        |
                        +-- PostgreSQL
                                    |
                                    +-- Next.js Dashboard
```

## Monorepo Structure

```
apps/api/          - FastAPI backend
apps/web/          - Next.js frontend (TBD)
hooks/claude-code/ - Claude Code stop hook
infra/             - OpenTofu (Azure Container Apps)
```

## Local Development

```bash
# Start PostgreSQL and API
docker compose up -d

# API available at http://localhost:8000
# Health check: http://localhost:8000/healthz
# API docs: http://localhost:8000/docs
```

### Dev mode auth

In dev mode (`IMPACT_DEV_MODE=true`, the default), pass `X-Dev-Engineer-OID` header instead of a JWT:

```bash
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "X-Dev-Engineer-OID: your-entra-oid" \
  -d '{ ... }'
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/sessions | Ingest a session from the stop hook |
| GET | /api/v1/sessions | List sessions (paginated, filterable) |
| GET | /api/v1/metrics/summary | Aggregate metrics |
| GET | /api/v1/metrics/clients | Per-client breakdown |
| GET | /api/v1/metrics/engineers | Per-engineer breakdown |
| GET | /api/v1/clients | List clients |
| GET | /api/v1/clients/{slug} | Get client by slug |
| GET | /api/v1/engineers | List engineers |
| GET | /api/v1/engineers/{id} | Get engineer by ID |
| GET | /healthz | Health check (unauthenticated) |

## Database Migrations

```bash
cd apps/api
alembic upgrade head
```

## Stop Hook Setup

See [hooks/claude-code/README.md](hooks/claude-code/README.md).
