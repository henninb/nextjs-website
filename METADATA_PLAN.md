# SEO Metadata Enhancement Plan

## Overview

Add `metadata` exports to all 45+ pages for improved SEO.

## Metadata Strategy

### Finance Pages (20 pages)

1. app/finance/page.tsx - "Account Management | Finance Dashboard"
2. app/finance/backup/page.tsx - "Backup & Restore | Finance"
3. app/finance/categories/page.tsx - "Transaction Categories | Finance"
4. app/finance/categories-next/page.tsx - "Categories Management (GraphQL) | Finance"
5. app/finance/configuration/page.tsx - "Account Configuration | Finance"
6. app/finance/configuration-next/page.tsx - "Configuration Management (GraphQL) | Finance"
7. app/finance/descriptions/page.tsx - "Transaction Descriptions | Finance"
8. app/finance/descriptions-next/page.tsx - "Descriptions Management (GraphQL) | Finance"
9. app/finance/medical-expenses/page.tsx - "Medical Expenses Tracker | Finance"
10. app/finance/payments/page.tsx - "Payment Management | Finance"
11. app/finance/payments-next/page.tsx - "Payments (GraphQL) | Finance"
12. app/finance/paymentrequired/page.tsx - "Payment Required | Finance"
13. app/finance/transfers/page.tsx - "Transfer Management | Finance"
14. app/finance/transfers-next/page.tsx - "Transfers (GraphQL) | Finance"
15. app/finance/trends/page.tsx - "Financial Trends & Analytics | Finance"
16. app/finance/validation-amounts/page.tsx - "Validation Amounts | Finance"
17. app/finance/transactions/[accountNameOwner]/page.tsx - Dynamic
18. app/finance/transactions/category/[categoryName]/page.tsx - Dynamic
19. app/finance/transactions/description/[descriptionName]/page.tsx - Dynamic
20. app/finance/transactions/import/page.tsx - "Import Transactions | Finance"

### Sports Pages (4 pages)

1. app/nfl/page.tsx - "NFL Scores & Stats | Sports"
2. app/nba/page.tsx - "NBA Scores & Stats | Sports"
3. app/mlb/page.tsx - "MLB Scores & Stats | Sports"
4. app/nhl/page.tsx - "NHL Scores & Stats | Sports"

### How-To Pages (8 pages)

1. app/howto/page.tsx - "How-To Guides"
2. app/howto/cloudflare/page.tsx - "Cloudflare Setup Guide"
3. app/howto/debian/page.tsx - "Debian Configuration Guide"
4. app/howto/docker/page.tsx - "Docker Setup Guide"
5. app/howto/f5/page.tsx - "F5 Configuration Guide"
6. app/howto/gentoo/page.tsx - "Gentoo Installation Guide"
7. app/howto/nextjs/page.tsx - "Next.js Development Guide"
8. app/howto/pfsense/page.tsx - "pfSense Configuration Guide"
9. app/howto/proxmox/page.tsx - "Proxmox Setup Guide"

### Auth Pages (3 pages)

1. app/login/page.tsx - "Login | Finance App"
2. app/register/page.tsx - "Register | Finance App"
3. app/logout/page.tsx - "Logout | Finance App"

### Lead Pages (4 pages)

1. app/lead/page.jsx - "Vehicle Information | Lead Form"
2. app/lead/color/page.jsx - "Select Color | Lead Form"
3. app/lead/info/page.jsx - "Contact Information | Lead Form"
4. app/lead/success/page.jsx - "Thank You | Lead Form"

### Utility Pages (8 pages)

1. app/tools/page.tsx - "Developer Tools"
2. app/temperature/page.tsx - "Temperature Converter"
3. app/me/page.tsx - "Profile | My Account"
4. app/watch/page.tsx - "Watch | Monitoring"
5. app/furnace/page.tsx - "Furnace Monitor"
6. app/payment/page.jsx - "Secure Payment"
7. app/registration/page.tsx - "Registration Form"
8. app/spotifyauth/page.jsx - "Spotify Authentication"
9. app/v2/payment/page.jsx - "Secure Payment v2"

## Implementation Notes

- Use TypeScript `Metadata` type for type safety
- Include `title` and `description` for all pages
- For dynamic routes, use `generateMetadata` function
- Keep descriptions concise (150-160 characters)
- Use template in root layout for consistent branding
