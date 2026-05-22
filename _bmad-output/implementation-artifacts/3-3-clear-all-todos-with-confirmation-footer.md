# Story 3.3: Clear All Todos with Confirmation & Footer

Status: done

## Story

As a user,
I want to clear all my todos at once with a safety confirmation, and see a cookie disclosure link,
so that I can start fresh without accidentally losing everything, and understand what data the app stores.

## Acceptance Criteria

1. **Given** the list has one or more todos, **When** the footer renders, **Then** it shows a cookie disclosure link ("About cookies", left-aligned, `--text-xs`, `--text-tertiary`, underlined) and a "Clear all" button (right-aligned, destructive styling: `--surface` background, 1px `--warning` border, `--warning` text).
2. **Given** the list is empty, **When** the footer renders, **Then** only the cookie disclosure link is visible and the "Clear all" button is hidden.
3. **Given** the list has todos, **When** I click "Clear all", **Then** a modal dialog opens (Radix Dialog) with title "Clear all todos?", body "This will delete all [N] todos. This cannot be undone.", Cancel button (default-focused), and confirm "Clear all" button styled as destructive secondary emphasis.
4. **Given** the dialog is open, **When** I click Cancel, press Escape, or click outside, **Then** the dialog closes, the list remains unchanged, and focus returns to the "Clear all" button.
5. **Given** the dialog is open, **When** I click the confirm "Clear all" button, **Then** the dialog closes, the list empties immediately (optimistic), empty state appears, and `DELETE /api/todos` fires in the background.
6. **Given** the backend is running, **When** `DELETE /api/todos` is processed, **Then** it deletes all todos for the session, returns `{ success: true }`, and keeps the session cookie valid (FR-022).
7. **Given** the clear-all request fails, **When** the error response arrives, **Then** the list region shows recoverable error copy ("Couldn't clear — try again") with retry, and todos are restored from server state.
8. **Given** the cookie disclosure link exists, **When** I click "About cookies", **Then** I am taken to `/cookies` (or `cookies.html`) with plain-language explanation of session-cookie purpose/scope and explicit no-tracking/no-analytics statement.
9. **Given** the dialog is open, **When** I inspect accessibility, **Then** it has role/dialog semantics (`aria-modal`, `aria-labelledby`, `aria-describedby`), focus trap, and focus restore on close.

## Tasks / Subtasks

- [x] Task 1: Confirm and harden backend clear-all contract (AC: 6)
  - [x] Verify `DELETE /api/todos` in `backend/src/routes/todos.ts` is session-scoped and keeps response envelope `{ success: true }`.
  - [x] Verify no session invalidation side effects; cookie/session remains reusable after clear-all.
  - [x] Keep error envelope parity (`{ error: { code, message } }`) for failure paths.

- [x] Task 2: Extend backend tests for clear-all semantics and isolation (AC: 6, 7)
  - [x] Add/adjust tests in `backend/src/routes/todos.test.ts` proving only current session todos are deleted.
  - [x] Add regression test confirming sibling session data remains intact after clear-all.
  - [x] Add failure-path assertions for consistent error envelope behavior.

- [x] Task 3: Extend frontend API/types for clear-all mutation and retry affordance (AC: 5, 7)
  - [x] Ensure `clearAllTodos()` contract in `frontend/src/api/todos.ts` has strict success/error envelope guards.
  - [x] Ensure clear-all mutation typing exists in `frontend/src/types/todo.ts` and aligns with existing API patterns.

- [x] Task 4: Implement optimistic clear-all hook with rollback + retry metadata (AC: 5, 7)
  - [x] Create `frontend/src/hooks/useClearAllTodos.ts` using TanStack Query v5 mutation lifecycle (`onMutate`, `onError`, `onSettled`).
  - [x] `onMutate`: snapshot existing todos and optimistically set list empty.
  - [x] `onError`: rollback cached todos and expose clear-all specific retry state/copy.
  - [x] `onSettled`: invalidate `['todos']` for authoritative reconciliation.

- [x] Task 5: Add footer UI with cookie link and conditional clear-all control (AC: 1, 2, 8)
  - [x] Add `Footer` presentation in `frontend/src/components` or equivalent pattern used by current app.
  - [x] Render cookie link at all times; render "Clear all" button only when todo count > 0.
  - [x] Ensure link target resolves to static cookie disclosure page.

- [x] Task 6: Add clear-all confirmation dialog with strong accessibility defaults (AC: 3, 4, 9)
  - [x] Add `ClearAllDialog` component using `@radix-ui/react-dialog`.
  - [x] Ensure Cancel is default-focused and non-destructive action remains easiest path.
  - [x] Ensure close behaviors (Cancel/Escape/backdrop click) restore focus to trigger button.
  - [x] Ensure title/body IDs are wired to `aria-labelledby` and `aria-describedby`.

- [x] Task 7: Integrate clear-all flow through app shell and list-state behavior (AC: 5, 7)
  - [x] Wire footer + dialog + mutation hook through `frontend/src/App.tsx` and list components.
  - [x] On confirm clear-all, close dialog before mutation and show empty state immediately.
  - [x] On failure, restore todos and expose recoverable retry action without blocking unrelated interactions.

- [x] Task 8: Add cookie disclosure static page and routing path consistency (AC: 8)
  - [x] Add/update `frontend/public/cookies.html` with plain-language copy describing session cookie behavior.
  - [x] Include explicit statement that no analytics/tracking cookies are collected.
  - [x] Verify static serving path works with current Express + Vite build output.

- [x] Task 9: Add frontend tests for footer/dialog/clear-all regression safety (AC: 1-5, 7-9)
  - [x] Extend `frontend/src/components/TodoList.test.tsx` (or split tests) for footer visibility rules.
  - [x] Add tests for dialog open/close behaviors, Cancel default focus, and focus restore.
  - [x] Add optimistic clear-all success test: immediate empty state + background request.
  - [x] Add failure test: rollback list + recoverable retry copy.
  - [x] Add cookie link navigation assertion and no-regression checks for existing add/toggle/delete behavior.

## Dev Notes

### Story Intent and Scope Guardrails

- This story introduces the footer and clear-all flow only; do not alter single-item delete semantics.
- Clear-all must be safe by default (confirmation required, Cancel default-focused) but fast on confirm (optimistic clear).
- Keep interaction calm: no global blocking overlay, no forced page reload, no destructive action without explicit confirmation.

### Epic Context (Epic 3)

- Epic 3 sequence:
  - Story 3.1: toggle completion (done)
  - Story 3.2: delete single todo (done)
  - Story 3.3: clear-all with confirmation + footer (this story)
- This story should reuse established optimistic mutation and row/list failure conventions from 3.1 and 3.2.

### Previous Story Intelligence (from Story 3.2)

- Keep TanStack Query mutation lifecycle consistent with existing hooks:
  - cancel query
  - snapshot previous cache
  - optimistic cache update
  - rollback on error
  - invalidate on settled
- Preserve strict API envelope parsing in `frontend/src/api/todos.ts` and type contracts in `frontend/src/types/todo.ts`.
- Maintain local, recoverable error UX; do not introduce modal/toast style global failure reporting for request failures.
- Preserve focus quality standards established in Story 3.2 (intentional focus handoff, no focus theft).

### Technical Requirements (Must Follow)

- Stack remains locked by architecture:
  - Frontend: React 19.x, Vite 8.x, TanStack Query 5.x, Radix Dialog 1.1.x
  - Backend: Express 5.2.x, Prisma 7.8.x, Zod 4.4.x
- API contracts:
  - Clear-all success: `{ success: true }`
  - Error envelope: `{ error: { code: string, message: string } }`
- Session isolation is mandatory: clear-all deletes only current session's todos (FR-022, FR-023).

### Architecture Compliance Requirements

- Respect existing boundaries:
  - `backend/src/routes/` for endpoint behavior and session-scoped data operations
  - `frontend/src/api/` for fetch wrappers and payload guards
  - `frontend/src/hooks/` for mutation orchestration
  - `frontend/src/components/` for footer, dialog, and rendering behavior
  - `frontend/src/types/` for shared frontend contracts
- Keep named exports and existing naming conventions (PascalCase components, `use*` hooks, kebab-case non-components).
- Do not introduce new dependencies beyond already-approved stack.

### UX and Accessibility Compliance Requirements

- Footer:
  - Cookie disclosure link left-aligned, always visible, underlined, `--text-xs` and `--text-tertiary`.
  - Clear-all button right-aligned, shown only when list is non-empty.
- Dialog:
  - Use Radix Dialog primitive for focus trap and modal semantics.
  - Title: "Clear all todos?"
  - Body: "This will delete all [N] todos. This cannot be undone."
  - Cancel default-focused; confirm destructive style (`--warning` border/text).
- Interaction behavior:
  - Cancel/Escape/backdrop click closes dialog without data mutation.
  - Confirm closes dialog first, then optimistic clear.
  - On error, list is restored and retry is available.

### File Structure Requirements

- Expected backend updates:
  - `backend/src/routes/todos.ts`
  - `backend/src/routes/todos.test.ts`
- Expected frontend updates:
  - `frontend/src/App.tsx`
  - `frontend/src/api/todos.ts`
  - `frontend/src/types/todo.ts`
  - `frontend/src/hooks/useClearAllTodos.ts` (new)
  - `frontend/src/components/TodoList.tsx`
  - `frontend/src/components/TodoList.test.tsx`
  - `frontend/src/components/Footer.tsx` (new or equivalent composition in existing component layout)
  - `frontend/src/components/ClearAllDialog.tsx` (new)
  - `frontend/public/cookies.html` (new/update)
  - `frontend/src/index.css` (only if token-mapped styling primitives are missing)

### Testing Requirements

- Backend:
  - Clear-all deletes all todos for current session only.
  - Cross-session isolation is preserved.
  - Clear-all response remains `{ success: true }`.
- Frontend:
  - Footer visibility conditions (empty vs non-empty list) are verified.
  - Dialog semantics/focus behavior are verified.
  - Optimistic clear-all behavior is verified.
  - Failure rollback + retry UX is verified.
  - Cookie link target is verified.
  - Existing add/toggle/delete behavior remains intact (regression checks).

### Anti-Pattern Prevention

- Do not bypass confirmation for clear-all action.
- Do not hide cookie disclosure link when list is empty.
- Do not clear or rotate session cookie as part of clear-all.
- Do not add global loading/disabled states that block unrelated interactions.
- Do not place mutation fetch logic directly in UI components; keep API + hook layers.

### Git Intelligence Summary

- Recent implementation cadence is story-scoped (`create and implement story X.Y`) with matching artifact updates.
- Stories 3.1 and 3.2 touched the same backend route tests and frontend app/api/hooks/components stack this story should extend.
- Keep this story similarly scoped and acceptance-mapped to preserve FR-to-story-to-commit traceability.

### Latest Tech Information

- TanStack Query v5 optimistic mutation guidance remains aligned with current repository pattern (`onMutate` snapshot/optimistic update, `onError` rollback, `onSettled` invalidate).
- Radix Dialog 1.1.x remains the preferred headless primitive for robust focus trap, focus restore, and modal ARIA behavior in React.
- Express 5 error-handling and route patterns remain compatible with existing envelope-based API contract; no migration changes are required for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3 acceptance criteria and sequencing)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR-013, FR-015, FR-022, FR-023, NFR-014, NFR-016, NFR-017)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (API contracts, TanStack Query mutation pattern, structure constraints, Radix usage)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (footer/disclosure/dialog behavior and accessibility emphasis)]
- [Source: `_bmad-output/implementation-artifacts/3-2-delete-single-todo.md` (previous-story implementation patterns and guardrails)]
- [Source: recent commits `2b3a3b3`, `69f4c9e` (file touch patterns and story-scoped delivery cadence)]

### Project Structure Notes

- No `project-context.md` file exists in this repository.
- Create this story on top of the current working tree without reverting unrelated local changes.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow executed: `bmad-create-story`
- Story auto-selected from sprint status: `3-3-clear-all-todos-with-confirmation-footer`
- Core artifact set loaded: `epics.md`, `architecture.md`, `prd.md`, `ux-design-specification.md`, and previous story files (`3-1`, `3-2`)
- Recent git intelligence loaded: latest five commits + file touch patterns from recent story implementations
- Implemented backend clear-all endpoint and session-isolation regression coverage for `DELETE /api/todos`
- Implemented frontend clear-all API/type/hook/dialog/footer integration with optimistic empty state and rollback retry UX
- Validation runs: `cd backend && npm test`, `cd frontend && npm test`, `cd frontend && npm run lint`

### Completion Notes List

- Added `DELETE /api/todos` clear-all route with `{ success: true }` envelope and unchanged global error envelope behavior.
- Added backend clear-all tests for same-session deletion, sibling-session isolation, session reuse after clear, and failure-path envelope parity.
- Added frontend clear-all API/type contract guards, optimistic mutation hook with rollback, and retry error state in list region.
- Added footer and dialog UX with cookie disclosure link, conditional clear-all button, Cancel default focus, dialog semantics, and focus restore.
- Added cookie disclosure static page with plain-language session-cookie scope and explicit no-tracking/no-analytics statement.
- Added frontend regression tests covering footer visibility, dialog interaction/accessibility behaviors, optimistic clear-all, and rollback + retry.

### File List

- `backend/src/routes/todos.ts` (modified)
- `backend/src/routes/todos.test.ts` (modified)
- `frontend/package.json` (modified)
- `frontend/package-lock.json` (modified)
- `frontend/src/api/todos.ts` (modified)
- `frontend/src/types/todo.ts` (modified)
- `frontend/src/hooks/useClearAllTodos.ts` (added)
- `frontend/src/components/Footer.tsx` (added)
- `frontend/src/components/ClearAllDialog.tsx` (added)
- `frontend/src/App.tsx` (modified)
- `frontend/src/components/TodoList.test.tsx` (modified)
- `frontend/src/index.css` (modified)
- `frontend/public/cookies.html` (added)
- `_bmad-output/implementation-artifacts/3-3-clear-all-todos-with-confirmation-footer.md` (modified)

## Change Log

- 2026-05-22: Created Story 3.3 context artifact and marked it `ready-for-dev` for implementation handoff.
- 2026-05-22: Implemented clear-all backend/frontend flow, added cookie disclosure page, and completed regression test coverage; status moved to `review`.
- 2026-05-22: Story reviewed and accepted; status moved to `done`.
