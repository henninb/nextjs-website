# Development Setup

## Ad Blocker Configuration

The development domain `dev.finance.bhenning.com` may be blocked by ad blockers due to the "finance" keyword triggering financial/tracking filters.

### Required Ad Blocker Whitelist

Add these domains to your ad blocker whitelist:

- `dev.finance.bhenning.com`
- `*.bhenning.com` (for all subdomains)

### Browser-Specific Instructions

**uBlock Origin:**

1. Click the uBlock Origin extension icon
2. Click the large power button to disable for this site
3. Refresh the page

**AdBlock Plus:**

1. Click the AdBlock Plus extension icon
2. Select "Don't run on this domain"
3. Refresh the page

**Brave Browser:**

1. Click the shield icon in the address bar
2. Turn off Brave Shields for this site
3. Refresh the page

### Alternative Testing

If ad blockers can't be disabled, test with:

- Incognito/Private browsing mode (disables most extensions)
- Different browser without ad blockers installed
- Firefox Developer Edition (minimal extensions by default)

### Why This Happens

Ad blockers use keyword filtering and the domain contains "finance" which triggers:

- Financial tracking protection
- Anti-malvertising filters
- Cryptocurrency mining protection

The PerimeterX scripts (px-cloud.net) are legitimate bot protection but commonly blocked by privacy tools.
