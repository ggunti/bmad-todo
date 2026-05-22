# Story 3.2: Delete Single Todo

Status: done

## Story

As a user,
I want to delete a todo with one click,
so that I can remove items I no longer need.

## Acceptance Criteria

1. **Given** the backend is running, **When** I call `DELETE /api/todos/:id`, **Then** the backend deletes the todo and returns `{ success: true }`.
2. **Given** I call `DELETE /api/todos/:id` with an ID that does not belong to my session, **When** the server processes the request, **Then** it returns `404` with `{ error: { code: "NOT_FOUND", message: "Todo not found" } }`.
3. **Given** a todo is visible in the list, **When** I click the `×` delete button, **Then** the item disappears within 50ms (optimistic removal), remaining items reflow naturally, and focus moves to the next item (or input if it was the last item).
4. **Given** the `DELETE` request fails after optimistic removal, **When** the error response arrives, **Then** the item re-appears in its original position with failure indication (`--warning-bg`, warning glyph, "Couldn't delete —" with inline retry).
5. **Given** the delete button renders, **When** I inspect it, **Then** it is a `×` glyph in `--text-tertiary`, transparent background, with `aria-label="Delete: [todo text]"`, hit area 44x44px on touch viewports.
6. **Given** no confirmation dialog, **When** I click delete on a single todo, **Then** deletion happens immediately and no confirmation modal appears.

## Tasks / Subtasks

- [x] Task 1: Add backend delete-single endpoint behavior and contract fidelity (AC: 1, 2)
  - [x] Ensure `DELETE /api/todos/:id` exists in `backend/src/routes/todos.ts` and is session-scoped.
  - [x] Return `{ success: true }` on successful deletion.
  - [x] Return `404` + `{ error: { code: "NOT_FOUND", message: "Todo not found" } }` for unknown/foreign-session IDs.
  - [x] Preserve existing error envelope and error logging behavior.

- [x] Task 2: Extend backend tests for delete-single flow (AC: 1, 2)
  - [x] Add test for successful delete response envelope and actual record removal.
  - [x] Add session-isolation test (different session attempting same ID receives `404 NOT_FOUND`).
  - [x] Add regression test that sibling todos remain intact after deleting one item.

- [x] Task 3: Extend frontend API/types for delete-single mutation (AC: 1, 4)
  - [x] Add delete request/response typing in `frontend/src/types/todo.ts` (or colocated API types following existing pattern).
  - [x] Add `deleteTodo(id)` in `frontend/src/api/todos.ts` with strict success/error envelope guards.

- [x] Task 4: Implement optimistic delete mutation hook (AC: 3, 4)
  - [x] Create `frontend/src/hooks/useDeleteTodo.ts` using TanStack Query v5 mutation lifecycle.
  - [x] `onMutate`: cancel todos query, snapshot prior list, remove target todo optimistically while preserving remaining order.
  - [x] `onError`: rollback from snapshot, then mark only that row failed with delete-specific retry metadata/message.
  - [x] `onSettled`: invalidate `['todos']` for authoritative reconciliation.

- [x] Task 5: Update row UI for delete control and row-local failure affordance (AC: 3, 4, 5, 6)
  - [x] Add delete button in `frontend/src/components/TodoList.tsx` using `×` glyph and transparent styling.
  - [x] Ensure `aria-label="Delete: [todo text]"` and 44x44 effective touch target.
  - [x] Keep delete behavior immediate (no modal, no second-step confirmation).
  - [x] Ensure failed delete re-renders the item in original position with inline retry and warning styling.

- [x] Task 6: Focus and keyboard behavior for optimistic removal/reappearance (AC: 3, 4, 5)
  - [x] After optimistic delete, move focus to next row control; if deleted row was last, move focus to input.
  - [x] Ensure re-appeared failed row does not steal focus on error.
  - [x] Verify failed-row retry keeps interaction local to that row and does not block other rows.

- [x] Task 7: Add frontend tests for delete interactions and regressions (AC: 3, 4, 5, 6)
  - [x] Extend `frontend/src/components/TodoList.test.tsx` (or split file if needed) for optimistic disappearance + natural reflow.
  - [x] Add focus-transition tests (next item vs input fallback).
  - [x] Add failed delete test: item reappears at original index with failure state and retry.
  - [x] Add assertion that no confirmation dialog is rendered for single-item delete.

## Dev Notes

### Story Intent and Scope Guardrails

- This story only covers single-item deletion. Do not implement clear-all behavior or dialog logic here.
- Deletion must be optimistic and fast (<50ms visible UI response), with recoverable row-local failure.
- Row order integrity is required: if delete fails, restore at original position.

### Epic Context (Epic 3)

- Epic 3 objective: completion + deletion flows with optimistic UX and calm failure handling.
- Story sequence:
  - Story 3.1 (done): toggle completion
  - Story 3.2 (this story): single delete
  - Story 3.3 (next): clear-all with confirmation + footer integration
- Reuse established row-level failure approach from Story 3.1 for consistency across toggle/delete.

### Previous Story Intelligence (from Story 3.1)

- Reuse the same TanStack Query mutation shape (`onMutate` snapshot + optimistic change + `onError` handling + `onSettled` invalidate); do not invent an alternative mutation pipeline.
- Keep failure communication inline at row level; avoid global error banners/toasts for row-specific operations.
- Maintain strict API envelope handling in `frontend/src/api/todos.ts` and shared typing in `frontend/src/types/todo.ts`.
- Preserve behavior from Epic 2 and Story 3.1: no global mutation loading overlays, no focus theft, no reordering side-effects.

### Technical Requirements (Must Follow)

- Stack versions in project architecture:
  - Frontend: React 19.2.5, Vite 8.0.10, TanStack Query 5.x
  - Backend: Express 5.2.1, Prisma 7.8.0, Zod 4.4.3
- API contracts:
  - Success: `{ success: true }`
  - Error: `{ error: { code: string, message: string } }`
- Session isolation is mandatory for all route-level reads/writes/deletes.

### Architecture Compliance Requirements

- Respect file/module boundaries:
  - `backend/src/routes/` for endpoint logic and session-scoped persistence interaction
  - `frontend/src/api/` for fetch wrappers and envelope parsing
  - `frontend/src/hooks/` for query/mutation orchestration
  - `frontend/src/components/` for interaction + rendering
  - `frontend/src/types/` for shared frontend contracts
- Keep naming conventions: PascalCase components, kebab-case non-component files, `use*` hook naming.
- Keep JSON envelope consistency across all todo endpoints.

### UX and Accessibility Compliance Requirements

- Delete control must be an always-available row action with one-click behavior and no confirmation modal.
- Delete button visual and behavior:
  - `×` glyph, `--text-tertiary`, transparent background
  - hover color shift to `--text-secondary`
  - 44x44 effective hit area on touch
  - `aria-label="Delete: [todo text]"`
- Failure state on delete error:
  - row returns with `--warning-bg` tint and warning affordance
  - inline retry remains on the affected row only
  - no focus stealing, no modal, no toast

### File Structure Requirements

- Expected backend updates:
  - `backend/src/routes/todos.ts`
  - `backend/src/routes/todos.test.ts`
- Expected frontend updates:
  - `frontend/src/api/todos.ts`
  - `frontend/src/types/todo.ts`
  - `frontend/src/hooks/useDeleteTodo.ts` (new)
  - `frontend/src/components/TodoList.tsx`
  - `frontend/src/components/TodoList.test.tsx`
  - `frontend/src/App.tsx` (if prop plumbing needed)
  - `frontend/src/index.css` (only if styling primitives are missing)

### Testing Requirements

- Backend:
  - Success delete returns `{ success: true }` and removes only the targeted row.
  - Cross-session delete attempt returns `404 NOT_FOUND`.
  - Existing routes keep passing (no regression in GET/POST/PATCH behavior).
- Frontend:
  - Optimistic remove occurs immediately on click.
  - Failed delete restores row at original position with delete-specific failure copy and retry.
  - Delete button a11y contract (aria-label + keyboard operability + focus-visible) is covered.
  - No single-delete confirmation dialog is present.

### Anti-Pattern Prevention

- Do not add a confirmation modal for single-item delete.
- Do not block the whole list with global loading or disabled states during delete mutation.
- Do not re-sort remaining items beyond natural list reflow.
- Do not silently swallow failed delete responses; preserve retry path.
- Do not place delete logic directly in component fetch calls; route through api + hook layers.

### Git Intelligence Summary

- Recent delivery pattern is story-scoped and traceable (`create and implement story X.Y` plus merge commit).
- Story 3.1 established the exact files and conventions this story should extend:
  - backend routes/tests + frontend api/types/hooks/components/tests + sprint/story artifact updates.
- Maintain the same commit/story granularity to preserve FR-to-story-to-commit traceability (FR-029 / NFR-025).

### Latest Tech Information

- TanStack Query v5 guidance continues to support this repository's optimistic workflow: cancel query, snapshot cache, optimistic mutate, rollback on error, invalidate on settled.
- Express 5 is stable and works well with route-level schema validation and structured error responses; current project pattern remains aligned and should be retained.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.2 acceptance criteria and epic sequencing)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR-012, FR-016, FR-017, FR-018, NFR-004, NFR-016, NFR-017, NFR-020, NFR-025)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (API contracts, optimistic mutation pattern, naming and structure constraints)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (Delete Single flow, delete button spec, per-row failure behavior)]
- [Source: `_bmad-output/implementation-artifacts/3-1-toggle-todo-completion.md` (prior story intelligence and established mutation/failure conventions)]
- [Source: recent git commits `69f4c9e`, `4dd394f` (current implementation cadence and touched-file patterns)]

### Project Structure Notes

- No `project-context.md` file is present in this repository.
- Create this story on top of the current working tree without reverting ongoing implementation changes.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow applied: `bmad-create-story` (`workflow.md`)
- Story auto-selected from sprint status: `3-2-delete-single-todo`
- Core artifacts loaded: `epics.md`, `architecture.md`, `prd.md`, `ux-design-specification.md`, previous story file
- Recent git patterns reviewed: last five commits + files changed in latest implementation commit
- Switched story workflow execution to implementation mode and marked sprint item `in-progress`.
- Ran red-green-refactor cycle with targeted backend and frontend delete-flow tests.
- Validation run completed: `cd backend && npm test`, `cd frontend && npm test`, `cd frontend && npm run lint`.

### Implementation Plan

- Implement backend `DELETE /api/todos/:id` with session-scoped lookup, shared `NOT_FOUND` envelope, and `{ success: true }` success contract.
- Extend route tests to verify success, cross-session rejection, and sibling-record integrity after deletion.
- Add frontend delete contract typing and API function with strict envelope guards.
- Implement optimistic TanStack Query delete mutation with rollback + row-local failure state.
- Wire delete action into row UI with a11y contract (`aria-label`, 44x44 hit target), inline retry, and focus handoff.
- Add focused UI tests for optimistic disappearance, focus transition behavior, failure restore/retry, and no confirmation modal.

### Completion Notes List

- Added backend `DELETE /api/todos/:id` endpoint with session isolation, `NOT_FOUND` error parity, and `{ success: true }` response envelope.
- Added backend route tests for delete success, cross-session `404 NOT_FOUND`, and sibling-todo regression protection.
- Added frontend delete contract (`DeleteTodoResponse`, `deleteTodo`) with strict payload guards and existing `TodosApiError` behavior.
- Added `useDeleteTodo` hook implementing optimistic remove, rollback-to-index on failure, row-local failure state, and settled invalidation.
- Updated `TodoList` and `App` to support one-click delete with `×`, required aria labels, 44x44 target, inline retry, and no confirmation dialog.
- Implemented focus handoff after optimistic delete to next row delete button or input fallback; ensured failure restore does not steal focus.
- Added UI tests for optimistic delete + reflow, focus transitions, delete failure restore/retry, and no modal rendering.
- Full validation completed with all checks passing (`backend` tests, `frontend` tests, `frontend` lint).

### File List

- `backend/src/routes/todos.ts` (updated)
- `backend/src/routes/todos.test.ts` (updated)
- `frontend/src/types/todo.ts` (updated)
- `frontend/src/api/todos.ts` (updated)
- `frontend/src/hooks/useDeleteTodo.ts` (created)
- `frontend/src/components/TodoList.tsx` (updated)
- `frontend/src/components/TodoList.test.tsx` (updated)
- `frontend/src/components/TodoInput.tsx` (updated)
- `frontend/src/App.tsx` (updated)
- `frontend/src/index.css` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `_bmad-output/implementation-artifacts/3-2-delete-single-todo.md` (updated)

## Change Log

- 2026-05-22: Created Story 3.2 context file with acceptance-mapped tasks, architecture guardrails, UX/a11y requirements, prior-story learnings, and implementation boundaries.
- 2026-05-22: Implemented Story 3.2 delete-single flow across backend and frontend with optimistic delete, row-local failure recovery, focus handoff behavior, and full automated validation.
