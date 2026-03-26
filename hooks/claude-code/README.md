# Claude Code Stop Hook

Automatically captures AI session impact data at the end of every Claude Code session.

## Setup

### 1. Set environment variables

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export WYRE_ENGINEER_OID="your-entra-object-id"
export WYRE_IMPACT_API_URL="https://impact-api.wyretechnology.com"
export WYRE_IMPACT_API_TOKEN="your-token"  # optional in dev mode
```

### 2. Set per-project client (optional)

```bash
export WYRE_SESSION_CLIENT="chattstate"
```

### 3. Configure Claude Code

Add to your `.claude/settings.json`:

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

### 4. Copy the hook

```bash
mkdir -p ~/.claude/hooks
cp hooks/claude-code/stop_hook.py ~/.claude/hooks/stop_hook.py
```

## How it works

1. Collects session stats from Claude Code environment variables
2. Uses the `claude` CLI to generate a task summary, classification, and manual hours estimate
3. POSTs the assembled payload to the Impact API
4. Prints a brief confirmation to stdout

If the `claude` CLI is unavailable or errors, sensible defaults are used.
