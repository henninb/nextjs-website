#!/bin/bash

# Script to quickly switch between production and local backend for testing

set -e

ENV_FILE=".env.local"
BACKUP_FILE=".env.local.backup"

show_help() {
    echo "Usage: ./switch-backend.sh [local|production|status]"
    echo ""
    echo "Commands:"
    echo "  local       - Switch to local backend (https://localhost:8443)"
    echo "  production  - Switch to production backend (https://finance.bhenning.com)"
    echo "  status      - Show current backend configuration"
    echo ""
    echo "Examples:"
    echo "  ./switch-backend.sh local        # Point to local backend"
    echo "  ./switch-backend.sh production   # Point to production backend"
    echo "  ./switch-backend.sh status       # Check current config"
}

show_status() {
    echo "Current backend configuration:"
    echo "================================"
    if [ -f "$ENV_FILE" ]; then
        grep "NEXT_PUBLIC_API_BASE_URL" "$ENV_FILE" || echo "NEXT_PUBLIC_API_BASE_URL not set"
        grep "NEXT_PUBLIC_GRAPHQL_ENDPOINT" "$ENV_FILE" || echo "NEXT_PUBLIC_GRAPHQL_ENDPOINT not set"
    else
        echo "❌ $ENV_FILE not found"
    fi
    echo ""
}

switch_to_local() {
    echo "🔄 Switching to LOCAL backend (https://localhost:8443)..."

    # Create backup
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo "✅ Backup created: $BACKUP_FILE"
    fi

    # Update .env.local
    cat > "$ENV_FILE" << EOF
# Disable Next.js development overlay and turbopack features
DISABLE_DEV_OVERLAY=true
__NEXT_DEV_OVERLAY=false
TURBOPACK_DEV_OVERLAY=false

# LOCAL BACKEND CONFIGURATION
NEXT_PUBLIC_API_BASE_URL=https://localhost:8443
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/graphql
EOF

    echo "✅ Switched to LOCAL backend"
    echo ""
    echo "⚠️  IMPORTANT NOTES:"
    echo "   1. Make sure your local backend is running: ./run.sh"
    echo "   2. Backend should be running on https://localhost:8443"
    echo "   3. Use the special dev:local script to disable SSL verification:"
    echo "      npm run dev:local"
    echo ""
    show_status
}

switch_to_production() {
    echo "🔄 Switching to PRODUCTION backend (https://finance.bhenning.com)..."

    # Create backup
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo "✅ Backup created: $BACKUP_FILE"
    fi

    # Update .env.local
    cat > "$ENV_FILE" << EOF
# Disable Next.js development overlay and turbopack features
DISABLE_DEV_OVERLAY=true
__NEXT_DEV_OVERLAY=false
TURBOPACK_DEV_OVERLAY=false

# PRODUCTION BACKEND CONFIGURATION
NEXT_PUBLIC_API_BASE_URL=https://finance.bhenning.com
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
EOF

    echo "✅ Switched to PRODUCTION backend"
    echo ""
    echo "⚠️  IMPORTANT NOTES:"
    echo "   1. API calls will go to https://finance.bhenning.com"
    echo "   2. Restart your dev server: npm run dev"
    echo ""
    show_status
}

# Main script logic
case "${1:-}" in
    local)
        switch_to_local
        ;;
    production|prod)
        switch_to_production
        ;;
    status)
        show_status
        ;;
    -h|--help|help)
        show_help
        ;;
    *)
        echo "❌ Invalid command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
