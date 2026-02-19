# Project Memory

## Key Architectural Patterns
- Uses Next.js App Router (`/app` directory), NOT pages router
- MUI v7 with `@ts-expect-error` comments needed for `<Grid item>` props (known type issue)
- Client components use `"use client"` directive; server components are default
- API routes should NOT use `export const runtime = "edge"` when importing npm packages that aren't Edge-compatible

## Middleware / Proxy
- `proxy.js` in root is the Next.js middleware (not `middleware.ts`)
- New API routes that should bypass the finance service proxy MUST be added to `localApis` array in `proxy.js`
- The nginx reverse proxy at `~/projects/github.com/henninb/nginx-reverse-proxy/nginx.conf` also needs updating for new local APIs (vercel.bhenning.com and www.bhenning.com server blocks)

## Features Added
- **Planets page** (`/planets`): Planet rise/set/transit viewer using `astronomy-engine` npm package
  - API route: `app/api/planets/route.ts` (Node.js runtime, NOT edge)
  - Geocode API: `app/api/geocode/route.ts` (edge runtime, proxies Nominatim)
  - Both added to `localApis` in `proxy.js`
  - Navigation link added to `components/Layout.tsx` (uses `NightsStayIcon`)

## Style Guidelines
- Gradient text: `background: linear-gradient(...)` + `WebkitBackgroundClip: "text"` + `WebkitTextFillColor: "transparent"`
- Planet/space colors: Mercury #9e9e9e, Venus #fdd835, Mars #ef5350, Jupiter #ff9800, Saturn #ffc107, Uranus #80deea, Neptune #7c4dff
