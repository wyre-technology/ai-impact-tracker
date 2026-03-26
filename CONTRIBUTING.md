# Contributing to WYRE AI Impact Tracker

Thank you for your interest in contributing to the WYRE AI Impact Tracker. This guide will help you get started.

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.12+
- Node.js 20+
- Git

### Getting Started

```bash
# Clone the repository
git clone git@github.com:wyretechnology/wyre-ai-impact-tracker.git
cd wyre-ai-impact-tracker

# Copy environment variables
cp .env.example .env

# Start all services
docker compose up -d

# API available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Running the API locally (without Docker)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Running the frontend locally

```bash
cd apps/web
npm install
npm run dev
```

## Branch Naming Convention

Use the following prefixes for branch names:

| Prefix     | Purpose                          |
|------------|----------------------------------|
| `feature/` | New features                     |
| `fix/`     | Bug fixes                        |
| `chore/`   | Maintenance, dependencies, CI/CD |

Examples:

```
feature/dashboard-filters
fix/session-ingestion-null-client
chore/upgrade-fastapi
```

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                      |
|------------|--------------------------------------------------|
| `feat`     | A new feature                                    |
| `fix`      | A bug fix                                        |
| `docs`     | Documentation only changes                       |
| `style`    | Formatting, missing semicolons, etc.             |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                          |
| `test`     | Adding or correcting tests                       |
| `chore`    | Build process, CI, or auxiliary tool changes     |

### Examples

```
feat(api): add per-client metrics endpoint
fix(hook): handle missing session duration gracefully
chore(deps): bump fastapi to 0.115
```

## Pull Request Process

1. Create a branch from `main` using the naming convention above.
2. Make your changes in small, focused commits.
3. Ensure all tests pass locally.
4. Push your branch and open a pull request against `main`.
5. Fill out the PR template completely.
6. Request a review from `@asachs01`.
7. Address any review feedback.
8. Once approved, the PR will be squash-merged.

### PR Checklist

- [ ] Code compiles/runs without errors
- [ ] Tests added or updated for changes
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] No secrets or credentials committed

## Code Style

### Python (API)

We use [Ruff](https://docs.astral.sh/ruff/) for linting and formatting.

```bash
cd apps/api
ruff check .
ruff format .
```

Configuration is in `apps/api/ruff.toml`.

### TypeScript (Frontend)

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/).

```bash
cd apps/web
npx eslint .
npx prettier --check .
```

Configuration is in `.eslintrc.json` and `.prettierrc` at the repo root.

## Questions?

Open an issue or reach out to the team on Slack.
