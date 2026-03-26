# WYRE AI Impact Tracker — Claude Code Stop Hook Installer (Windows)
# Usage: irm https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host "WYRE AI Impact Tracker — Stop Hook Installer" -ForegroundColor Green
Write-Host ""

# ── Download the hook script ──────────────────────────────────────────
$HooksDir = Join-Path $env:USERPROFILE ".claude\hooks"
if (-not (Test-Path $HooksDir)) { New-Item -Path $HooksDir -ItemType Directory -Force | Out-Null }

$HookPath = Join-Path $HooksDir "stop_hook.py"
Write-Host "Downloading stop hook..."
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/wyre-technology/ai-impact-tracker/main/hooks/claude-code/stop_hook.py" -OutFile $HookPath
Write-Host "  Hook saved to $HookPath" -ForegroundColor Green

# ── Add to Claude Code settings.json ──────────────────────────────────
$SettingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"

if (-not (Test-Path $SettingsPath)) {
    '{}' | Set-Content $SettingsPath -Encoding UTF8
}

$settings = Get-Content $SettingsPath -Raw | ConvertFrom-Json -AsHashtable

if (-not $settings.ContainsKey("hooks")) { $settings["hooks"] = @{} }
if (-not $settings["hooks"].ContainsKey("Stop")) {
    $settings["hooks"]["Stop"] = @(@{ "hooks" = @() })
}

$existingHooks = $settings["hooks"]["Stop"][0]["hooks"]
$alreadyInstalled = $existingHooks | Where-Object { $_.command -like "*stop_hook.py*" }

if ($alreadyInstalled) {
    Write-Host "  Hook already in settings.json — skipping" -ForegroundColor Yellow
} else {
    $existingHooks += @{
        "type" = "command"
        "command" = "python3 ~/.claude/hooks/stop_hook.py"
        "timeout" = 30
    }
    $settings["hooks"]["Stop"][0]["hooks"] = $existingHooks
    $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsPath -Encoding UTF8
    Write-Host "  Added to Claude Code settings.json" -ForegroundColor Green
}

# ── Prompt for environment variables ──────────────────────────────────
Write-Host ""
Write-Host "Configure environment variables:" -ForegroundColor Yellow

$existingOid = [Environment]::GetEnvironmentVariable("WYRE_ENGINEER_OID", "User")
if ($existingOid) {
    Write-Host "  Environment variables already configured" -ForegroundColor Green
} else {
    $oid = Read-Host "  Your Entra ID Object ID (from Azure Portal > Users)"
    $apiUrl = Read-Host "  Impact API URL [https://impact-api.wyretechnology.com]"
    if (-not $apiUrl) { $apiUrl = "https://impact-api.wyretechnology.com" }

    [Environment]::SetEnvironmentVariable("WYRE_ENGINEER_OID", $oid, "User")
    [Environment]::SetEnvironmentVariable("WYRE_IMPACT_API_URL", $apiUrl, "User")
    [Environment]::SetEnvironmentVariable("WYRE_SESSION_CLIENT", "", "User")

    Write-Host "  Environment variables set (restart terminal to apply)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! The stop hook will fire at the end of every Claude Code session." -ForegroundColor Green
Write-Host "Set WYRE_SESSION_CLIENT per-project to attribute work to a client."
Write-Host ""
Write-Host "Test it: python3 ~/.claude/hooks/stop_hook.py --test"
