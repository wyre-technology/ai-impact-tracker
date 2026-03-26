#!/usr/bin/env bash
# WYRE AI Impact Tracker — Claude Code Stop Hook Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/install.sh | bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}WYRE AI Impact Tracker — Stop Hook Installer${NC}"
echo ""

# ── Download the hook script ──────────────────────────────────────────
HOOKS_DIR="$HOME/.claude/hooks"
mkdir -p "$HOOKS_DIR"

echo "Downloading stop hook..."
curl -fsSL "https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/stop_hook.py" \
  -o "$HOOKS_DIR/stop_hook.py"
chmod +x "$HOOKS_DIR/stop_hook.py"
echo -e "${GREEN}✓${NC} Hook saved to $HOOKS_DIR/stop_hook.py"

# ── Add to Claude Code settings.json ──────────────────────────────────
SETTINGS="$HOME/.claude/settings.json"

if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

python3 -c "
import json, sys

with open('$SETTINGS') as f:
    cfg = json.load(f)

hooks = cfg.setdefault('hooks', {})
stop_hooks = hooks.setdefault('Stop', [{'hooks': []}])

# Check if already installed
existing = stop_hooks[0].get('hooks', [])
already = any('stop_hook.py' in h.get('command', '') for h in existing)

if already:
    print('Hook already in settings.json — skipping')
else:
    existing.append({
        'type': 'command',
        'command': 'python3 ~/.claude/hooks/stop_hook.py',
        'timeout': 30
    })
    with open('$SETTINGS', 'w') as f:
        json.dump(cfg, f, indent=2)
    print('Added to Claude Code settings.json')
"

# ── Prompt for environment variables ──────────────────────────────────
echo ""
echo -e "${YELLOW}Configure environment variables:${NC}"

SHELL_RC="$HOME/.zshrc"
if [ ! -f "$SHELL_RC" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

if grep -q "WYRE_ENGINEER_OID" "$SHELL_RC" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Environment variables already configured in $SHELL_RC"
else
  echo ""
  read -rp "Your Entra ID Object ID (from Azure Portal > Users): " OID
  read -rp "Impact API URL [https://impact-api.wyretechnology.com]: " API_URL
  API_URL="${API_URL:-https://impact-api.wyretechnology.com}"

  cat >> "$SHELL_RC" << EOF

# WYRE AI Impact Tracker
export WYRE_ENGINEER_OID="$OID"
export WYRE_IMPACT_API_URL="$API_URL"
export WYRE_SESSION_CLIENT=""
EOF

  echo -e "${GREEN}✓${NC} Added to $SHELL_RC"
  echo -e "${YELLOW}Run 'source $SHELL_RC' or restart your terminal to apply.${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC} The stop hook will fire at the end of every Claude Code session."
echo "Set WYRE_SESSION_CLIENT per-project to attribute work to a client."
echo ""
echo "Test it: python3 ~/.claude/hooks/stop_hook.py --test"
