#!/bin/sh

set -eu

PROJECT=""
LIMIT=5

log() { printf '%s - %s\n' "$(date +"%Y-%m-%d %H:%M:%S")" "$*"; }
err() { printf '%s - ERROR: %s\n' "$(date +"%Y-%m-%d %H:%M:%S")" "$*" >&2; }

usage() {
  cat <<EOF
Check latest Vercel deployment status

Flags:
  --project <name>   Vercel project name
  --limit <n>        Number of deployments to show (default: 5)
  -h, --help         Show help

Examples:
  scripts/check-vercel-deploy.sh
  scripts/check-vercel-deploy.sh --project nextjs-website-alpha-weld
  scripts/check-vercel-deploy.sh --limit 10
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --limit)   LIMIT="$2";   shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

if command -v vercel >/dev/null 2>&1; then
  VERCEL="vercel"
elif command -v npx >/dev/null 2>&1; then
  log "vercel not installed globally; using npx (slow). Run: npm i -g vercel"
  VERCEL="npx --yes vercel@latest"
else
  err "vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout 30"
fi

log "Using: $VERCEL"
log "Fetching latest $LIMIT deployments..."
printf '\n'

SCOPE=""
if [ -f ".vercel/project.json" ] && command -v jq >/dev/null 2>&1; then
  SCOPE=$(jq -r '.orgId // empty' .vercel/project.json 2>/dev/null || true)
fi

if [ -n "$PROJECT" ] && [ -n "$SCOPE" ]; then
  $TIMEOUT_CMD $VERCEL ls "$PROJECT" --scope "$SCOPE" 2>&1 | head -n $(( LIMIT + 5 ))
elif [ -n "$PROJECT" ]; then
  $TIMEOUT_CMD $VERCEL ls "$PROJECT" 2>&1 | head -n $(( LIMIT + 5 ))
elif [ -n "$SCOPE" ]; then
  $TIMEOUT_CMD $VERCEL ls --scope "$SCOPE" 2>&1 | head -n $(( LIMIT + 5 ))
else
  $TIMEOUT_CMD $VERCEL ls 2>&1 | head -n $(( LIMIT + 5 ))
fi
