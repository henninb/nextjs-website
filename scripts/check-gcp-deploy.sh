#!/usr/bin/env bash

set -Eeuo pipefail

# Check and optionally fix GCP setup for pushing images to Artifact Registry
# - Verifies API enablement, repo existence, and IAM for Cloud Build SA
# - Optionally applies fixes with --apply
#
# Usage examples:
#   scripts/check-gcp-deploy.sh --project sa-brian-henning --location us --repository containers
#   scripts/check-gcp-deploy.sh --project sa-brian-henning --apply

PROJECT_ID=""
LOCATION="us"
REPOSITORY="containers"
CB_SA=""              # Optional: override Cloud Build service account email
APPLY=false

log() { echo "$(date +"%Y-%m-%d %H:%M:%S") - $*"; }
err() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ERROR: $*" >&2; }

usage() {
  cat <<EOF
Check GCP Artifact Registry deployment prerequisites

Flags:
  --project <id>        GCP project ID (required)
  --location <region>   Artifact Registry location (default: us)
  --repository <name>   Artifact Registry repo name (default: containers)
  --service-account <email>  Cloud Build SA (default: <PROJECT_NUMBER>@cloudbuild.gserviceaccount.com)
  --apply               Attempt to fix missing items (enable API, create repo, grant IAM)
  -h, --help            Show help

Examples:
  scripts/check-gcp-deploy.sh --project my-proj
  scripts/check-gcp-deploy.sh --project my-proj --location us --repository containers --apply
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --location) LOCATION="$2"; shift 2 ;;
    --repository) REPOSITORY="$2"; shift 2 ;;
    --service-account) CB_SA="$2"; shift 2 ;;
    --apply) APPLY=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

main() {
  require_cmd gcloud
  if [[ -z "$PROJECT_ID" ]]; then
    err "--project is required"; usage; exit 1
  fi

  log "Project: $PROJECT_ID"
  log "Location: $LOCATION"
  log "Repository: $REPOSITORY"

  # Ensure we can talk to the project
  local PROJECT_NUMBER
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='get(projectNumber)') || {
    err "Unable to describe project '$PROJECT_ID'. Check your credentials and project ID."; exit 1; }
  log "Project Number: $PROJECT_NUMBER"

  if [[ -z "$CB_SA" ]]; then
    CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
  fi
  log "Cloud Build SA: $CB_SA"

  # Show current gcloud account
  local ACTIVE_ACCT
  ACTIVE_ACCT=$(gcloud config get-value account 2>/dev/null || true)
  log "gcloud account: ${ACTIVE_ACCT:-<none configured>}"

  # 1) Check APIs
  check_api "artifactregistry.googleapis.com" "Artifact Registry"
  check_api "cloudbuild.googleapis.com" "Cloud Build"

  # 2) Ensure repo exists
  ensure_repo

  # 3) Check IAM for Cloud Build SA
  check_repo_iam "roles/artifactregistry.writer"

  # 4) Check Cloud Run service if it exists
  check_cloud_run_service

  # 5) Optional: show docker helper tip
  log "Tip: Configure Docker auth locally if needed:"
  log "  gcloud auth configure-docker ${LOCATION}-docker.pkg.dev --quiet"

  log "All checks completed."
}

check_api() {
  local API="$1"; local NAME="$2"
  if gcloud services list --enabled --project "$PROJECT_ID" --filter="name:$API" --format='value(name)' | grep -q "$API"; then
    log "API enabled: $NAME ($API)"
  else
    if $APPLY; then
      log "Enabling API: $NAME ($API)"
      gcloud services enable "$API" --project "$PROJECT_ID"
    else
      err "API NOT enabled: $NAME ($API). Run with --apply to enable."
    fi
  fi
}

ensure_repo() {
  if gcloud artifacts repositories describe "$REPOSITORY" \
      --location "$LOCATION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    log "Repo exists: $REPOSITORY in $LOCATION"
  else
    if $APPLY; then
      log "Creating repo: $REPOSITORY in $LOCATION"
      gcloud artifacts repositories create "$REPOSITORY" \
        --repository-format=docker \
        --location "$LOCATION" \
        --description "Docker images for nextjs-website" \
        --project "$PROJECT_ID"
    else
      err "Repo NOT found: $REPOSITORY in $LOCATION. Run with --apply to create."
    fi
  fi
}

check_repo_iam() {
  local ROLE="$1"
  local HAS_BINDING=false
  if gcloud artifacts repositories get-iam-policy "$REPOSITORY" \
       --location "$LOCATION" --project "$PROJECT_ID" \
       --format=json | jq -e ".bindings[]? | select(.role==\"$ROLE\") | .members[]? | select(.==\"serviceAccount:$CB_SA\")" >/dev/null 2>&1; then
    HAS_BINDING=true
  fi

  if [[ "$HAS_BINDING" == true ]]; then
    log "IAM ok on repo: $ROLE bound to $CB_SA"
  else
    if $APPLY; then
      log "Granting repo IAM: $ROLE to $CB_SA"
      gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
        --location "$LOCATION" \
        --member "serviceAccount:$CB_SA" \
        --role "$ROLE" \
        --project "$PROJECT_ID"
    else
      err "Missing IAM on repo: $ROLE for $CB_SA. Run with --apply to grant."
    fi
  fi
}

check_cloud_run_service() {
  local SERVICE_NAME="nextjs-website"
  local CLOUD_RUN_REGION="us-central1"

  if gcloud run services describe "$SERVICE_NAME" \
      --region "$CLOUD_RUN_REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    local service_url
    service_url=$(gcloud run services describe "$SERVICE_NAME" \
      --region "$CLOUD_RUN_REGION" --project "$PROJECT_ID" \
      --format='value(status.url)' 2>/dev/null)

    if [[ -n "$service_url" ]]; then
      log "Cloud Run service deployed: $service_url"
      log "Health check: $service_url/api/health"
      log "Use: scripts/check-cloud-run.sh --project $PROJECT_ID"
    else
      log "Cloud Run service exists but URL not available"
    fi
  else
    log "Cloud Run service not deployed yet (will be created on next build)"
  fi
}

main "$@"

