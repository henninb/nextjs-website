---
name: project_rewards_tracking
description: Credit card rewards points tracking feature — parameter naming convention and design decisions
metadata:
  type: project
---

Credit card rewards points tracking is implemented on the transaction page (`app/finance/transactions/[accountNameOwner]/page.tsx`).

**How it works:** A Points column appears in the table view and a Points stat card appears in the header — both only for credit accounts that have rewards parameters configured.

**Parameter table keys (per account):**
- `rewards_3x_categories_<accountNameOwner>` — comma-separated category names earning 3x points (e.g., "restaurant,gas,travel,transit,streaming,phone")
- `rewards_2x_categories_<accountNameOwner>` — comma-separated category names earning 2x points (empty = not used)
- `rewards_cpp_<accountNameOwner>` — cents per point as decimal (default: `0.01` = 1¢/pt)

**Design decisions:**
- If no `rewards_3x_categories_*` or `rewards_2x_categories_*` param exists for the account, the feature is invisible.
- Income and transfer transactions earn 0 points (shown as `—`).
- Points value = 1¢ per point (configurable via `rewards_cpp_*`).
- Category matching uses `includes()` so "restaurant" matches "restaurants" etc.
- Only Wells Fargo Autograph configured initially; other cards to be added later by inserting more parameters.

**Why:** User wants to see rewards value accruing as they spend during the month. Pure frontend calculation from existing transaction data — no backend changes needed.
