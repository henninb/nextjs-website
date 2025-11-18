# Local Backend Testing Guide

This guide explains how to test the Next.js frontend against your local backend running at `https://localhost:8443`.

## Quick Start

### 1. Start Your Local Backend

```bash
# In your backend directory (wherever run.sh is located)
./run.sh
```

Your backend should start on `https://localhost:8443` as shown in the logs:

```
Tomcat started on port 8443 (https) with context path '/'
```

### 2. Switch Frontend to Local Backend

```bash
# In the nextjs-website directory
./switch-backend.sh local
```

This updates `.env.local` to point to `https://localhost:8443`

### 3. Start Next.js Dev Server with SSL Verification Disabled

```bash
# Use the special dev:local script that disables SSL verification
npm run dev:local
```

**Note**: The `dev:local` script sets `NODE_TLS_REJECT_UNAUTHORIZED=0` to allow connections to your local backend's self-signed certificate. This is safe for local development only.

### 4. Test in Browser

Open your browser to `http://localhost:3000` and test your application!

## Switching Back to Production

When you're done testing locally and want to use the production backend:

```bash
./switch-backend.sh production
```

Then restart your dev server.

## Check Current Configuration

```bash
./switch-backend.sh status
```

## Manual Configuration

If you prefer to edit `.env.local` manually:

### For Local Backend

```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:8443
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/graphql
```

### For Production Backend

```env
NEXT_PUBLIC_API_BASE_URL=https://finance.bhenning.com
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
```

## Troubleshooting

### SSL Certificate Errors

The `npm run dev:local` script automatically disables SSL verification by setting `NODE_TLS_REJECT_UNAUTHORIZED=0`.

If you still see errors, verify:

- You're using `npm run dev:local` (not `npm run dev`)
- Your backend is actually running on `https://localhost:8443`
- Check backend logs for connection errors

⚠️ **WARNING**: `NODE_TLS_REJECT_UNAUTHORIZED=0` should NEVER be used in production!

### CORS Errors

If you see CORS errors, your local backend needs to allow requests from `http://localhost:3000`.

Check your backend CORS configuration includes:

- `http://localhost:3000`
- `http://localhost:3001`

### GraphQL Endpoint Issues

The GraphQL endpoint is different between environments:

- **Local**: `/graphql` (direct endpoint)
- **Production**: `/api/graphql` (proxied through Next.js middleware)

The `switch-backend.sh` script handles this automatically.

### API Routes Not Working

Make sure you've restarted the Next.js dev server after changing `.env.local`:

```bash
# Stop dev server (Ctrl+C)
npm run dev
```

### Backend Not Running

Verify your backend is running:

```bash
# Check if port 8443 is listening
netstat -an | grep 8443
# or
lsof -i :8443
```

Expected output should show Tomcat listening on port 8443.

## Environment Variable Priority

Next.js loads environment variables in this order (highest priority first):

1. `.env.local` (your local configuration - **use this for testing**)
2. `.env.development` (development defaults)
3. `.env` (general defaults)

The `.env.local` file is gitignored, so your local testing configuration won't be committed.

## Advanced: Using Different Ports

If your backend runs on a different port:

```bash
# Edit .env.local
NEXT_PUBLIC_API_BASE_URL=https://localhost:YOUR_PORT
```

## Testing Workflow

Typical workflow for testing local changes:

```bash
# 1. Start backend
cd ~/path/to/backend
./run.sh

# 2. Switch frontend to local
cd ~/projects/github.com/henninb/nextjs-website
./switch-backend.sh local

# 3. Start frontend
npm run dev

# 4. Test in browser at http://localhost:3000

# 5. When done, switch back
./switch-backend.sh production
```

## Backup and Recovery

The `switch-backend.sh` script automatically creates backups:

- Backup file: `.env.local.backup`

If something goes wrong, you can restore from the backup:

```bash
cp .env.local.backup .env.local
```
