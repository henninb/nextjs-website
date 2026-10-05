#!/bin/sh

set -eu

POLL_INTERVAL=5
MAX_WAIT=600

log() { printf '%s - %s\n' "$(date +"%Y-%m-%d %H:%M:%S")" "$*"; }
err() { printf '%s - ERROR: %s\n' "$(date +"%Y-%m-%d %H:%M:%S")" "$*" >&2; }

if command -v vercel >/dev/null 2>&1; then
  VERCEL="vercel"
elif command -v npx >/dev/null 2>&1; then
  VERCEL="npx --yes vercel@latest"
else
  err "vercel not found. Install with: npm i -g vercel"
  exit 1
fi

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout 30"
fi

# Use a long-lived token when provided (create at https://vercel.com/account/tokens)
TOKEN_ARG=""
if [ -n "${VERCEL_TOKEN:-}" ]; then
  TOKEN_ARG="--token $VERCEL_TOKEN"
fi

AUTH_ERROR_PATTERN='token is not valid|token provided.*not valid|not logged in|vercel login|No existing credentials|Not authorized|forbidden'

auth_fail() {
  err "Vercel CLI is not authenticated:"
  printf '%s\n' "$1" | grep -E "$AUTH_ERROR_PATTERN" | head -3 >&2
  err "Fix: run 'npx vercel login', or export VERCEL_TOKEN=<token from https://vercel.com/account/tokens>"
  exit 2
}

# Preflight: verify credentials before polling
WHOAMI_OUT=$($TIMEOUT_CMD $VERCEL whoami $TOKEN_ARG 2>&1) || {
  if printf '%s' "$WHOAMI_OUT" | grep -qiE "$AUTH_ERROR_PATTERN"; then
    auth_fail "$WHOAMI_OUT"
  fi
  err "vercel whoami failed:"
  printf '%s\n' "$WHOAMI_OUT" | tail -5 >&2
  exit 1
}
log "Authenticated as $(printf '%s' "$WHOAMI_OUT" | tail -1)"

fetch_line() {
  LS_OUT=$($TIMEOUT_CMD $VERCEL ls $TOKEN_ARG 2>&1) || true
  # Token can expire mid-run; surface it instead of reporting "No deployments found"
  if printf '%s' "$LS_OUT" | grep -qiE "$AUTH_ERROR_PATTERN"; then
    auth_fail "$LS_OUT"
  fi
  printf '%s\n' "$LS_OUT" \
    | grep -E 'Ready|Building|Initializing|Queued|Error|Canceled' \
    | grep -v '^Error:' \
    | head -1
}

extract_status() {
  printf '%s' "$1" | grep -oE 'Ready|Building|Initializing|Queued|Error|Canceled' | head -1
}

extract_url() {
  printf '%s' "$1" | grep -oE 'https://[^ ]+' | head -1
}

log "Watching latest Vercel deployment (polling every ${POLL_INTERVAL}s, timeout ${MAX_WAIT}s)..."

LAST_STATUS=""
ELAPSED=0

while [ "$ELAPSED" -lt "$MAX_WAIT" ]; do
  LINE=$(fetch_line)
  STATUS=$(extract_status "$LINE")

  if [ -z "$STATUS" ]; then
    log "No deployments found"
    sleep "$POLL_INTERVAL"
    ELAPSED=$(( ELAPSED + POLL_INTERVAL ))
    continue
  fi

  if [ "$STATUS" != "$LAST_STATUS" ]; then
    log "Status: $STATUS"
    LAST_STATUS="$STATUS"
  fi

  case "$STATUS" in
    Ready)
      URL=$(extract_url "$LINE")
      log "Done: $URL"
      exit 0
      ;;
    Error)
      log "Deployment failed"
      exit 1
      ;;
    Canceled)
      log "Deployment canceled"
      exit 1
      ;;
  esac

  sleep "$POLL_INTERVAL"
  ELAPSED=$(( ELAPSED + POLL_INTERVAL ))
done

err "Timed out after ${MAX_WAIT}s"
exit 1
