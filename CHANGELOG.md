# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
