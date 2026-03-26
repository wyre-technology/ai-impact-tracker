# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Admin-only API endpoints (`/api/v1/admin/*`) for session CRUD, engineer/client management, global settings, and CSV export
- `is_admin` column on engineers table (default false) with admin role check dependency
- `global_settings` table for storing configurable default hourly rate
- Alembic migration 002 for `is_admin` column and `global_settings` table
- Admin dashboard page (`/admin`) with settings form and CSV export with date range picker
- Manual session entry form (`/admin/sessions/new`) for backfilling historical data
- Engineer management page (`/admin/engineers`) with add/edit/deactivate
- Client management page (`/admin/clients`) with add/edit/deactivate
- Reusable `AdminForm` component with form fields, error/success states
- Admin link in sidebar navigation (shield icon)
- Monorepo structure: `apps/api/`, `apps/web/`, `hooks/claude-code/`, `infra/`
- FastAPI backend with async SQLAlchemy and asyncpg
- Database schema: `sessions`, `engineers`, `clients` tables
- Alembic migration for initial schema
- POST /api/v1/sessions endpoint for session ingestion
- GET /api/v1/sessions with pagination and filters
- GET /api/v1/metrics/summary, /metrics/clients, /metrics/engineers
- GET /api/v1/clients, /api/v1/clients/{slug}
- GET /api/v1/engineers, /api/v1/engineers/{id}
- Entra ID JWT validation middleware with dev mode bypass
- Claude Code stop hook for automatic session capture
- docker-compose.yml for local development (PostgreSQL + API)
- OpenTofu infrastructure placeholders for Azure Container Apps
