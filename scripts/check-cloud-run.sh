#!/usr/bin/env bash

set -Eeuo pipefail

# Check and manage GCP Cloud Run deployment for nextjs-website
# - Verifies service is running and healthy
# - Provides service URL and health status
# - Can restart service if needed
#
# Usage examples:
#   scripts/check-cloud-run.sh --project sa-brian-henning
#   scripts/check-cloud-run.sh --project sa-brian-henning --restart
#   scripts/check-cloud-run.sh --project sa-brian-henning --region us-east1

PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="nextjs-website"
RESTART_SERVICE=false

log() { echo "$(date +"%Y-%m-%d %H:%M:%S") - $*"; }
err() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ERROR: $*" >&2; }
success() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ $*"; }
warn() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ⚠️  $*"; }

usage() {
  cat <<EOF
Check GCP Cloud Run deployment status and health

Flags:
  --project <id>        GCP project ID (required)
  --region <region>     Cloud Run region (default: us-central1)
  --service <name>      Service name (default: nextjs-website)
  --restart             Restart the service if it's running
  --deploy              Deploy/redeploy the service (requires latest image)
  -h, --help            Show help

Examples:
  scripts/check-cloud-run.sh --project my-proj
  scripts/check-cloud-run.sh --project my-proj --restart
  scripts/check-cloud-run.sh --project my-proj --region us-east1
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --service) SERVICE_NAME="$2"; shift 2 ;;
    --restart) RESTART_SERVICE=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

check_service_exists() {
  if gcloud run services describe "$SERVICE_NAME" \
      --region "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

get_service_url() {
  gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" --project "$PROJECT_ID" \
    --format='value(status.url)' 2>/dev/null || echo ""
}

get_service_status() {
  gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" --project "$PROJECT_ID" \
    --format='value(status.conditions[0].type,status.conditions[0].status)' 2>/dev/null || echo "Unknown Unknown"
}

check_health() {
  local url="$1"
  if [[ -z "$url" ]]; then
    return 1
  fi

  # Try health endpoint with timeout
  if curl -f -s --max-time 10 "${url}/api/health" > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

restart_service() {
  log "Restarting Cloud Run service: $SERVICE_NAME"

  # Get current image
  local current_image
  current_image=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" --project "$PROJECT_ID" \
    --format='value(spec.template.spec.template.spec.containers[0].image)' 2>/dev/null)

  if [[ -z "$current_image" ]]; then
    err "Could not determine current image for service"
    return 1
  fi

  log "Redeploying with current image: $current_image"

  # Redeploy with same image to restart
  gcloud run deploy "$SERVICE_NAME" \
    --image "$current_image" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --platform managed \
    --quiet

  # Wait for deployment
  sleep 5
}

main() {
  require_cmd gcloud
  require_cmd curl

  if [[ -z "$PROJECT_ID" ]]; then
    err "--project is required"; usage; exit 1
  fi

  log "Checking Cloud Run service: $SERVICE_NAME"
  log "Project: $PROJECT_ID"
  log "Region: $REGION"

  # Check if service exists
  if ! check_service_exists; then
    err "Cloud Run service '$SERVICE_NAME' not found in region '$REGION'"
    log "Available services:"
    gcloud run services list --region "$REGION" --project "$PROJECT_ID" 2>/dev/null || true
    exit 1
  fi

  # Restart service if requested
  if [[ "$RESTART_SERVICE" == true ]]; then
    restart_service
  fi

  # Get service details
  local service_url status_type status_value
  service_url=$(get_service_url)
  read -r status_type status_value <<< "$(get_service_status)"

  log "Service Status: $status_type = $status_value"

  if [[ -n "$service_url" ]]; then
    success "Service URL: $service_url"

    # Check health
    log "Testing health endpoint..."
    if check_health "$service_url"; then
      success "Health check passed"
      success "Service is running and healthy! 🎉"
    else
      warn "Health check failed - service may be starting or having issues"
    fi

    # Provide useful links
    echo ""
    log "Useful links:"
    log "  • Service URL: $service_url"
    log "  • Health Check: $service_url/api/health"
    log "  • Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
    log "  • Logs: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/logs?project=$PROJECT_ID"
  else
    err "Could not retrieve service URL"
    exit 1
  fi
}

main "$@"