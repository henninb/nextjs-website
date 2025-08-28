# Category Merge UI — TDD Plan

## Problem

- The Categories page currently supports add, inline edit, and delete for a single category at a time.
- Users need to select multiple categories and merge them under a single, new name. This consolidates duplicates/variants (e.g., "Food", "Dining").

## Goals

- Enable multi-row selection on the Categories grid.
- Show a contextual "Merge" action only when one or more rows are selected.
- When clicked, prompt for the new merged name using the existing modal patterns.
- On confirm, call the backend to merge/rename the selected categories.
- Provide clear feedback (success/error), then refresh data and clear selection.

## Non-Goals / Out of Scope

- Backend implementation; we only call a presumed API.
- Defining server-side merge semantics (e.g., how transaction counts aggregate).
- Bulk undo/rollback of merges.

## UX Changes

- Grid: enable checkbox-like selection via a custom column.
- Page header actions: keep "Add Category"; show a "Merge" button when selection length > 0.
- Merge modal: use existing `FormDialog` standard.
  - Title: "Merge Categories".
  - Field: "New Name" with helper/validation messages.
  - Buttons: Cancel, Merge (disabled until input is valid).
- Feedback: use `SnackbarBaseline` for success and error messages.

## Validation Rules (match existing Add flow)

- Required; trim whitespace.
- Max length 255.
- Allowed characters: letters, numbers, spaces, underscores, hyphens (`^[a-zA-Z0-9 _-]+$`).

## API Contract (assumed)

- Endpoint: `POST /api/category/merge`
- Payload: `{ sourceNames: string[], targetName: string }`
- Success: `200`/`201` with a summary; client will refetch on success.
- Failure: non-2xx with JSON `{ response: string }` similar to other endpoints.

## Design Reference — Descriptions

We will closely mirror the Descriptions implementation which uses a manual checkbox selection column rather than DataGrid's built-in selection. This avoids prior issues (e.g., "Cannot read properties of undefined (reading 'size')") and ensures consistent behavior for select-all, indeterminate, and per-row toggles.

Key aspects to replicate from Descriptions:

- A custom `select` column with `renderHeader` and `renderCell` using MUI `Checkbox`.
- Local `rowSelection: Array<string | number>` state with `handleRowToggle`, `handleSelectAll`, `isAllSelected`, and `isIndeterminate`.
- Conditional header "Merge" button when `rowSelection.length > 0`.
- A `FormDialog` titled "Merge Categories" to capture the new name.

## Implementation Plan (TDD)

1. Write tests for categories merge UI (`__tests__/pages/finance/categories.merge.test.tsx`):
   - Render with mocked data and mocked DataGrid to expose the custom checkbox column.
   - Verify Merge button is hidden until one or more rows are selected, then appears.
   - Open modal, validate input (disabled until valid), submit valid name.
   - Expect `useCategoryMerge().mutateAsync` called with `{ sourceNames, targetName }`.
   - On success: show success snackbar, `refetch` called, selection cleared (button disappears).
   - Validate error message for invalid input; cancel does not call merge.

2. Write tests for the category merge hook (`__tests__/hooks/useCategoryMerge.test.ts`):
   - Posts the payload to `/api/category/merge` and resolves on success.
   - Surfaces API error (status text or `response` body) as an exception.

3. Implement hook (`hooks/useCategoryMerge.ts`):
   - React Query `useMutation` that POSTs to `/api/category/merge`.

4. Implement page changes (`pages/finance/categories.tsx`):
   - Add selection state and custom `select` column (matching Descriptions).
   - Add conditional Merge button in header actions.
   - Add Merge modal (`FormDialog`) with validation identical to Add flow.
   - On submit, call merge hook, then refetch, clear selection, and show success.

## Risks & Mitigations

- DataGrid selection complexity: use the proven manual-checkbox approach from Descriptions.
- Backend contract differences: keep endpoint isolated in a hook for easy adjustments.
- Merging into an existing name: let backend decide; surface any returned error message.

## Accessibility

- Ensure Merge button has accessible name ("Merge").
- Modal field labeled ("New Name"); rely on MUI Dialog semantics for focus/keyboard.

## Acceptance Criteria

- Users can select one or more categories via checkboxes on the grid.
- A "Merge" button becomes visible only when there is at least one selection.
- Clicking "Merge" opens a modal asking for the new name; validation matches the Add flow.
- Confirming performs a backend call; on success the list refreshes, selection clears, and a success snackbar appears.
- Canceling the modal performs no backend call and keeps selection intact.

## Files to Touch

- `pages/finance/categories.tsx`
- `hooks/useCategoryMerge.ts`
- `__tests__/pages/finance/categories.merge.test.tsx`
- `__tests__/hooks/useCategoryMerge.test.ts`

## Rollout

- Ship without a flag; behavior is additive and mirrors Descriptions. If issues arise, remove the custom `select` column temporarily to disable merging.
