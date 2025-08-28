# Description Merge UI — TDD Plan

## Problem

- The Descriptions page currently supports add, inline edit, and delete for a single description at a time.
- Users need to select multiple descriptions and merge them under a single, new name. This allows consolidating duplicates/variants (e.g., "Starbucks", "STARBUCKS #123").

## Goals

- Enable multi-row selection on the Descriptions grid.
- Show a contextual "Merge" action only when one or more rows are selected.
- When clicked, prompt for the new merged name using the existing modal patterns.
- On confirm, call the backend to merge/rename the selected descriptions.
- Provide clear feedback (success/error), then refresh data and clear selection.

## Non-Goals / Out of Scope

- Backend implementation; we only call a presumed API.
- Automatic conflict resolution rules (e.g., how counts aggregate) — handled server-side.
- Bulk undo/rollback of merges.

## UX Changes

- Grid: enable checkbox selection; allow selecting multiple rows.
- Page header actions: continue showing "Add Description"; show a "Merge" button when selection length > 0.
- Merge modal: use existing `FormDialog` pattern.
  - Title: "Merge Descriptions" (consistent title case; can be centralized later if needed).
  - Single text field: "New Name" with helper/validation messages.
  - Buttons: Cancel, Merge (primary action disabled until valid).
- Feedback: existing `SnackbarBaseline` for success and error messages.

## Validation Rules (align with existing Add flow)

- Required; trim whitespace.
- Max length 255.
- Allowed characters: letters, numbers, spaces, underscores, hyphens (`^[a-zA-Z0-9 _-]+$`).

## API Contract (assumed)

- Endpoint: `POST /api/description/merge`
- Payload: `{ sourceNames: string[], targetName: string }`
- Success: `200`/`201` with merged description object or summary; client will refetch on success.
- Failure: non-2xx with JSON `{ response: string }` similar to other endpoints.

## Data and Caching Strategy

- Use a new hook `useDescriptionMerge` with React Query mutation.
- On success: prefer `refetch` of `description` query (simplest and consistent with other flows after structural changes); also clear selection.
- On error: surface message via snackbar using existing error handler.

## Implementation Plan (TDD)

1. Tests first (page-level):
   - Render Descriptions page with data; mock `@mui/x-data-grid` to expose a test control that triggers `onRowSelectionModelChange` with two rows.
   - Expect Merge button to appear when selection length > 0 and disappear when cleared.
   - Clicking Merge opens modal; entering valid new name enables submit; submitting calls `useDescriptionMerge().mutateAsync` with `{ sourceNames, targetName }`.
   - On success: snackbar shows success; selection clears; `refetch` called.
   - Edge cases: empty input shows validation; invalid characters; cancel closes modal and calls nothing; allow single selection (acts as rename).
2. Tests for the new hook:
   - Unit-test `useDescriptionMerge` to POST expected payload and handle error response parsing like other hooks.
3. Implementation:
   - Descriptions page:
     - Maintain `rowSelectionModel` state and pass through to `DataGridBase` with `checkboxSelection` and `rowSelection` enabled.
     - Render a conditional Merge button in the header actions when `rowSelectionModel.length > 0`.
     - Implement Merge modal via `FormDialog` with the same validation logic used in Add (shared where reasonable).
     - On submit, call `useDescriptionMerge` and then `refetch` + clear selection + success snackbar.
   - Add `hooks/useDescriptionMerge.ts` implementing the POST call and React Query mutation.

## Risks & Mitigations

- DataGrid selection simulation in tests: mock `DataGrid` to manually trigger selection change handler; keep mock local to the merge tests file to avoid impacting other tests.
- Backend API naming may differ: keep the hook/endpoint isolated; easy to adjust.
- Name collision (merging into an existing name): allow backend to decide; surface returned error message.

## Accessibility

- Ensure Merge button has an accessible name ("Merge").
- Modal fields labeled ("New Name"); maintain keyboard and focus semantics via MUI `Dialog` defaults.

## Acceptance Criteria

- Users can select one or more descriptions via checkboxes on the grid.
- A "Merge" button becomes visible only when there is at least one selection.
- Clicking "Merge" opens a modal asking for the new name; validation enforces the same rules as adding a description.
- Confirming performs a backend call; on success the list refreshes, selection clears, and a success snackbar appears.
- Canceling the modal performs no backend call and keeps selection intact.

## Files to Touch

- `pages/finance/descriptions.tsx` — enable selection; add Merge CTA; wire modal; handle success/error.
- `hooks/useDescriptionMerge.ts` — new mutation hook.
- `__tests__/pages/finance/descriptions.merge.test.tsx` — page behavior tests.
- `__tests__/hooks/useDescriptionMerge.test.ts` — hook tests.
- (Optional) `utils/modalMessages.ts` — add a centralized title if desired.

## Rollout

- Ship behind no flag; behavior is additive and discoverable. Validate on dev with realistic data. If issues arise, selection can be temporarily disabled by setting `checkboxSelection={false}`.
