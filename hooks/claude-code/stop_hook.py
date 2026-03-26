#!/usr/bin/env python3
"""Claude Code stop hook for WYRE AI Impact Tracker.

Fires at the end of every Claude Code session. Collects session stats,
uses Claude to generate a task summary / classification / manual hours
estimate, and POSTs the result to the Impact API.

Environment variables:
    WYRE_ENGINEER_OID      - Engineer's Entra ID object ID (required)
    WYRE_IMPACT_API_URL    - Base URL of the Impact API (required)
    WYRE_IMPACT_API_TOKEN  - Bearer token for the API (optional in dev)
    WYRE_SESSION_CLIENT    - Client slug for this project (optional)
"""

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error


def get_session_stats() -> dict:
    """Collect session stats from environment variables set by Claude Code."""
    return {
        "duration_minutes": int(os.environ.get("CLAUDE_SESSION_DURATION", "0")) // 60,
        "tool_calls": json.loads(os.environ.get("CLAUDE_TOOL_CALLS", "{}")),
        "files_created": int(os.environ.get("CLAUDE_FILES_CREATED", "0")),
        "files_modified": int(os.environ.get("CLAUDE_FILES_MODIFIED", "0")),
        "lines_added": int(os.environ.get("CLAUDE_LINES_ADDED", "0")),
        "lines_removed": int(os.environ.get("CLAUDE_LINES_REMOVED", "0")),
    }


def classify_with_claude(stats: dict) -> dict:
    """Ask Claude to generate task_summary, task_type, and estimated_manual_hours.

    Uses the `claude` CLI in non-interactive mode. Falls back to defaults
    if the CLI is unavailable or returns an error.
    """
    prompt = f"""You just completed a Claude Code session. Based on the work performed, provide:

1. task_summary: 1-2 sentences describing what was accomplished
2. task_type: one of [iac, documentation, scripting, troubleshooting, admin, development, analysis, other]
3. estimated_manual_hours: how long this work would take a skilled engineer without AI assistance

Session stats:
- Duration: {stats['duration_minutes']} minutes
- Files created: {stats['files_created']}
- Files modified: {stats['files_modified']}
- Lines changed: +{stats['lines_added']} / -{stats['lines_removed']}
- Tool calls: {json.dumps(stats['tool_calls'])}

Respond ONLY with a JSON object. No preamble."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            response = json.loads(result.stdout)
            # claude CLI with --output-format json wraps the response
            text = response.get("result", result.stdout)
            # Parse the JSON from Claude's response
            if isinstance(text, str):
                parsed = json.loads(text)
            else:
                parsed = text
            return {
                "task_summary": parsed.get("task_summary", "Claude Code session"),
                "task_type": parsed.get("task_type", "other"),
                "estimated_manual_hours": float(parsed.get("estimated_manual_hours", 1.0)),
            }
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError, KeyError):
        pass

    # Fallback defaults
    return {
        "task_summary": "Claude Code session (auto-classified)",
        "task_type": "other",
        "estimated_manual_hours": max(1.0, stats["duration_minutes"] / 20.0),
    }


def post_session(payload: dict) -> None:
    """POST the session payload to the Impact API."""
    api_url = os.environ.get("WYRE_IMPACT_API_URL", "").rstrip("/")
    if not api_url:
        print("[impact-hook] WYRE_IMPACT_API_URL not set, skipping POST")
        return

    url = f"{api_url}/api/v1/sessions"
    token = os.environ.get("WYRE_IMPACT_API_TOKEN", "")

    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        # Dev mode: pass OID as header
        headers["X-Dev-Engineer-OID"] = payload.get("engineer_entra_oid", "")

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[impact-hook] Session recorded: {body.get('id', 'unknown')}")
    except urllib.error.HTTPError as e:
        print(f"[impact-hook] API error {e.code}: {e.read().decode('utf-8', errors='replace')}")
    except urllib.error.URLError as e:
        print(f"[impact-hook] Connection error: {e.reason}")


def main() -> None:
    engineer_oid = os.environ.get("WYRE_ENGINEER_OID")
    if not engineer_oid:
        print("[impact-hook] WYRE_ENGINEER_OID not set, skipping")
        return

    stats = get_session_stats()

    # Skip if the session was trivially short (< 1 minute)
    if stats["duration_minutes"] < 1:
        print("[impact-hook] Session too short, skipping")
        return

    classification = classify_with_claude(stats)

    project = os.environ.get("CLAUDE_PROJECT", os.path.basename(os.getcwd()))
    client_slug = os.environ.get("WYRE_SESSION_CLIENT")

    payload = {
        "engineer_entra_oid": engineer_oid,
        "client_slug": client_slug,
        "project": project,
        "task_summary": classification["task_summary"],
        "task_type": classification["task_type"],
        "duration_minutes": stats["duration_minutes"],
        "tool_calls": stats["tool_calls"],
        "files_created": stats["files_created"],
        "files_modified": stats["files_modified"],
        "lines_added": stats["lines_added"],
        "lines_removed": stats["lines_removed"],
        "estimated_manual_hours": classification["estimated_manual_hours"],
        "notes": None,
    }

    post_session(payload)


if __name__ == "__main__":
    main()
