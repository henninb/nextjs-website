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

fetch_line() {
  $TIMEOUT_CMD $VERCEL ls 2>&1 \
    | grep -E 'Ready|Building|Initializing|Queued|Error|Canceled' \
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
