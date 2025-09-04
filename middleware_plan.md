 TDD Plan: Enable Local NHL and NBA APIs

     Current Problem Analysis

     Your middleware currently proxies ALL /api/* requests to finance.bhenning.com (line 68 in middleware.js). This means /api/nhl and /api/nba are being proxied instead of executing locally.

     Solution Strategy

     Modify the middleware to exclude /api/nhl and /api/nba from proxy logic while maintaining all other existing functionality.

     TDD Implementation Plan

     Phase 1: Test Creation

     1. Create comprehensive middleware tests for local sports APIs:
       - Test that /api/nhl bypasses proxy and executes locally
       - Test that /api/nba bypasses proxy and executes locally
       - Test that other APIs still get proxied (e.g., /api/graphql, /api/me)
       - Test both development and production environments
       - Test various request methods (GET, POST, etc.)
     2. Create API endpoint tests for NHL/NBA:
       - Test successful responses from external APIs
       - Test error handling (network errors, API failures)
       - Test caching headers
       - Test method validation (only GET allowed)

     Phase 2: Middleware Modification

     3. Add local API exclusion logic:
       - Create whitelist of local APIs: ['/api/nhl', '/api/nba']
       - Add condition to bypass proxy for whitelisted paths
       - Ensure GraphQL and other finance APIs continue working
       - Maintain all security, CORS, and error handling

     Phase 3: Integration Testing

     4. Comprehensive integration tests:
       - Test middleware with real API endpoints
       - Verify no regression in existing finance API proxying
       - Test cookie handling still works for finance APIs
       - Test CORS headers still work correctly

     Phase 4: Edge Case Testing

     5. Security and edge cases:
       - Test malformed URLs don't bypass security
       - Test query parameters work correctly
       - Test request body handling for local APIs
       - Test timeout scenarios

     Key Requirements

     - CRITICAL: Do not break existing finance API proxying
     - CRITICAL: Maintain all security measures
     - CRITICAL: Preserve GraphQL routing logic
     - Ensure local APIs work in both dev and production
     - Maintain proper error handling and logging
