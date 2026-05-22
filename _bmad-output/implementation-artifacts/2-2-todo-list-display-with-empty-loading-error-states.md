# Story 2.2: Todo List Display with Empty, Loading & Error States

Status: done

## Story

As a user,
I want to see my todo list when I open the app, with clear feedback for empty, loading, and error conditions,
So that I always know the state of my data.

## Acceptance Criteria

1. **Given** the app loads and the initial data fetch is in progress, **When** the list region renders, **Then** it shows `"Loading…"` in `--text-tertiary`, `--text-base` (no skeleton, no spinner), with `aria-live="polite"`.

2. **Given** the initial fetch returns an empty list, **When** the list region renders, **Then** it shows `"No todos yet — add one above."` in `--text-tertiary`, `--text-base`, top-aligned where the list would render.

3. **Given** the initial fetch returns todos, **When** the list region renders, **Then** todos are displayed as a `<ul>` with each todo in a `<li>` card: `--surface` bg, `1px --border`, `--radius-base 6px`, padding `--space-3/--space-4`, gap `--space-2` between items.

4. **Given** the viewport is `>= 640px` (desktop), **When** todo cards render, **Then** they show a subtle box-shadow `0 1px 2px rgba(26,24,21,0.06)`.

5. **Given** the viewport is `< 640px` (mobile), **When** todo cards render, **Then** they have no box-shadow (border alone provides dimensionality).

6. **Given** the initial fetch fails (backend unreachable, network error, 5xx), **When** the list region renders, **Then** it shows `"Couldn't load your todos."` in `--text-secondary` with a Retry button, `role="alert"`, Retry has `aria-label="Retry loading todos"`.

7. **Given** the error state is shown, **When** the user clicks Retry, **Then** the fetch re-fires and the list region returns to loading state, then resolves to empty/populated/error.

8. **Given** todos are returned, **When** the list renders, **Then** items appear in the order stored by `sortOrder` (newest at top by default per FR-003).

## Tasks / Subtasks

- [x] Task 1: Add frontend data and type layer for todos (AC: 1, 2, 6, 7, 8)
  - [x] Create `frontend/src/types/todo.ts` with `Todo`, `TodosResponse`, and `ApiErrorResponse` types matching backend envelopes.
  - [x] Create `frontend/src/api/todos.ts` with a `getTodos()` fetch wrapper that:
    - [x] Calls `GET /api/todos`
    - [x] Parses JSON object responses only
    - [x] Throws a typed error for non-2xx using `{ error: { code, message } }`
  - [x] Ensure request and response handling are strict with no silent fallbacks.

- [x] Task 2: Add query hook and React Query setup (AC: 1, 2, 6, 7, 8)
  - [x] Install and use `@tanstack/react-query` in the frontend package.
  - [x] Create `frontend/src/hooks/useTodos.ts` using `useQuery` with key `['todos']`.
  - [x] Configure retry behavior to support manual retry button UX while keeping state transitions predictable.
  - [x] Wrap app root in `QueryClientProvider` in `frontend/src/main.tsx`.

- [x] Task 3: Build list-region state components (AC: 1, 2, 6, 7)
  - [x] Create `frontend/src/components/LoadingState.tsx` with exact copy `"Loading…"` and `aria-live="polite"`.
  - [x] Create `frontend/src/components/EmptyState.tsx` with exact copy `"No todos yet — add one above."`.
  - [x] Create `frontend/src/components/ErrorState.tsx` with exact copy `"Couldn't load your todos."`, `role="alert"`, and Retry button labeled `"Retry"` with `aria-label="Retry loading todos"`.
  - [x] Keep all state surfaces in the same list region (no modals, no toasts, no full-page blockers).

- [x] Task 4: Build todo list rendering with responsive card styling (AC: 3, 4, 5, 8)
  - [x] Create `frontend/src/components/TodoList.tsx` that renders `<ul>` and maps todos to `<li>` items.
  - [x] Render items in `sortOrder` order from API result (do not reorder client-side unless required for deterministic rendering).
  - [x] Implement card styles with CSS custom properties from Story 1.2 and UX-DR8 requirements.
  - [x] Apply desktop-only shadow at `@media (min-width: 640px)` and no shadow on mobile.

- [x] Task 5: Integrate list region into app shell without regressing Story 1.2 baseline (AC: 1-8)
  - [x] Update `frontend/src/App.tsx` to keep the existing shell and wordmark, then mount list region under it.
  - [x] Ensure input-focused UX from Story 2.3 remains possible (do not bake in assumptions that block future input component insertion above list).
  - [x] Keep typography, spacing, and focus ring behavior aligned with existing `frontend/src/index.css`.

- [x] Task 6: Add tests for list states and retry behavior (AC: 1, 2, 6, 7, 8)
  - [x] Add component tests for loading, empty, populated, and error state rendering.
  - [x] Verify retry button invokes refetch and returns state to loading first.
  - [x] Verify error-state accessibility attributes (`role="alert"`, retry `aria-label`) and loading-state `aria-live`.
  - [x] Verify rendered order follows `sortOrder`.

- [x] Task 7: Quality gates and verification (AC: 1-8)
  - [x] Run `npm run lint --prefix frontend`.
  - [x] Run `npm run build --prefix frontend`.
  - [x] Run frontend tests and confirm list-region state behavior manually against backend.

## Dev Notes

### Story Intent and Scope Guardrails

- This story is list-view and list-region state rendering only: loading, empty, populated, initial-load error + manual retry.
- Do not implement create/toggle/delete/reorder/clear-all behavior here; those belong to later stories.
- Do not introduce skeletons, spinners, modal errors, toast errors, or full-page loading walls.
- Keep all user feedback for this story localized to the list region.

### Previous Story Intelligence (Story 2.1)

- Backend API contract is already implemented in `backend/src/routes/todos.ts` and expects object envelopes:
  - Success: `{ todos: Todo[] }`
  - Error: `{ error: { code, message } }`
- Session middleware and cookie handling are already in place; frontend should call `/api/todos` without custom auth/session logic.
- Story 2.1 established that stable error envelopes are a hard dependency for optimistic UX stories; do not bypass or reshape server errors in frontend code.
- Story 2.1 noted a test-environment blocker around Prisma-backed integration in sandbox. For Story 2.2, prefer frontend-level tests that mock network boundaries cleanly.

### Technical Requirements (Must Follow)

- Use current stack and existing project conventions:
  - React `^19.2.5`
  - TypeScript `~6.0.2`
  - Vite `^8.0.10`
  - TanStack Query (architecture baseline `5.100.8`; latest patch line is available and safe to use)
- Use named exports for new modules (except `App` default export).
- Keep non-component file names kebab-case and component names PascalCase.
- Preserve strict API envelope handling and explicit error-path handling.

### Architecture Compliance Requirements

- Implement in architecture-defined frontend structure:
  - `frontend/src/components/`
  - `frontend/src/hooks/`
  - `frontend/src/api/`
  - `frontend/src/types/`
- Keep API boundary clean: frontend communicates only through `/api/todos` JSON endpoints.
- Use TanStack Query for server state (`useQuery`) and surface query states directly to UI state components.
- Maintain single-page model with no router additions.

### UX Compliance Requirements

- Match exact copy and semantics from Epic 2 and UX spec:
  - Loading: `"Loading…"` (`aria-live="polite"`)
  - Empty: `"No todos yet — add one above."`
  - Error: `"Couldn't load your todos."` + Retry (`role="alert"`, retry `aria-label="Retry loading todos"`)
- Keep state transitions calm and non-jarring (no animation requirement for list-state replacement).
- Card treatment must follow UX-DR8 dimensions and responsive shadow behavior exactly.

### File Structure Requirements

- Expected files to create:
  - `frontend/src/types/todo.ts`
  - `frontend/src/api/todos.ts`
  - `frontend/src/hooks/useTodos.ts`
  - `frontend/src/components/TodoList.tsx`
  - `frontend/src/components/LoadingState.tsx`
  - `frontend/src/components/EmptyState.tsx`
  - `frontend/src/components/ErrorState.tsx`
  - `frontend/src/components/TodoList.test.tsx` (or equivalent co-located test files)
- Expected files to modify:
  - `frontend/src/main.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/index.css` (only for missing utility classes or token-aligned refinements)
  - `frontend/package.json` (add query/testing dependencies only if required)

### Testing Requirements

- Validate all four list-region states: loading, empty, populated, error.
- Validate retry behavior from error state back to loading and final resolution.
- Validate semantic/accessibility requirements for loading and error states.
- Validate sort-order rendering consistency from API payload.
- Keep lint/build clean and avoid introducing warnings.

### Anti-Pattern Prevention

- Do not fetch inside components with ad-hoc `useEffect` + local loading flags when query state already models these concerns.
- Do not normalize API errors into ambiguous generic strings that hide `code` and `message`.
- Do not infer empty state from HTTP status; empty is successful `200` with `todos: []`.
- Do not reorder list by `createdAt` if backend already returns desired order by `sortOrder`.
- Do not add a second state container for todos outside TanStack Query cache in this story.

### Git Intelligence Summary

- Recent implementation pattern is "create + implement" per story with explicit artifact updates and sprint-status transitions.
- Most recent implementation commit (`1669e55`) established backend middleware/routes/validation patterns and test placement conventions used by this story.
- Keep Story 2.2 changes focused on frontend state rendering and integration with already-shipped backend API contract.

### Latest Tech Information

- `@tanstack/react-query` latest stable is `5.100.11` (patch-line update over architecture baseline `5.100.8`), with no direct known vulnerability advisories in common package scanners at time of story creation.
- React 19 guidance continues to favor explicit error boundaries for render-time failures; avoid attempting to catch render failures with `try/catch` in components.
- For this story scope, keep query-state-driven UI straightforward (`isLoading`, `isError`, success state), and avoid Suspense migration complexity.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 2 overview, Story 2.2 acceptance criteria, UX-DR8/14/15/16, FR map)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR-001, FR-003, FR-004, FR-005, FR-006, FR-019 to FR-023, NFR-007)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (API envelopes, TanStack Query pattern, frontend structure, naming rules, boundary rules)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (list-region states, copy, and calm transition behavior)]
- [Source: `_bmad-output/implementation-artifacts/2-1-backend-session-middleware-todo-api.md` (prior-story learnings and implemented backend contract)]

### Project Structure Notes

- The current frontend is still minimal (`App.tsx`, `index.css` shell baseline from Story 1.2). Story 2.2 should extend this baseline incrementally, not rewrite it.
- No `project-context.md` file exists in this repository at story creation time.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow applied: `bmad-create-story` (`workflow.md`, `template.md`, `checklist.md`)
- Story key auto-selected from sprint status: `2-2-todo-list-display-with-empty-loading-error-states`
- Previous story intelligence source: `_bmad-output/implementation-artifacts/2-1-backend-session-middleware-todo-api.md`
- Recent commit intelligence: `git log -5` and changed-file inspection
- Dependency installation: `npm install --prefix frontend @tanstack/react-query` and test tooling dependencies
- Verification commands: `npm run lint --prefix frontend`, `npm run build --prefix frontend`, `npm run test --prefix frontend`
- Full regression command: `npm run test --prefix backend`

### Implementation Plan

- Build typed todo API client and `useTodos` query hook.
- Add list-region state components for loading/empty/error with required copy and aria semantics.
- Render populated todo list cards with responsive shadow behavior and strict ordering.
- Integrate query provider and list region into existing app shell.
- Add component tests for list states and retry flow, then run frontend quality gates.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story context includes architecture, UX, previous story intelligence, git patterns, and latest technical version guidance
- Implemented strict typed API layer (`getTodos`) with explicit envelope validation and typed non-2xx error handling
- Added TanStack Query setup (`QueryClientProvider`) and `useTodos` query hook with manual retry control
- Implemented list-region loading, empty, error, and populated states in existing shell without modal/toast/full-page blockers
- Added responsive todo list card styling with desktop-only shadow and mobile no-shadow behavior
- Added frontend tests for all list states, retry-to-loading transition, accessibility attributes, and payload order rendering
- Quality gates pass: frontend lint/build/test and backend regression test suite
- Story status set to `done`

### File List

- `_bmad-output/implementation-artifacts/2-2-todo-list-display-with-empty-loading-error-states.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `frontend/package.json` (updated)
- `frontend/package-lock.json` (updated)
- `frontend/src/main.tsx` (updated)
- `frontend/src/App.tsx` (updated)
- `frontend/src/index.css` (updated)
- `frontend/vite.config.ts` (updated)
- `frontend/src/types/todo.ts` (created)
- `frontend/src/api/todos.ts` (created)
- `frontend/src/hooks/useTodos.ts` (created)
- `frontend/src/components/LoadingState.tsx` (created)
- `frontend/src/components/EmptyState.tsx` (created)
- `frontend/src/components/ErrorState.tsx` (created)
- `frontend/src/components/TodoList.tsx` (created)
- `frontend/src/components/TodoList.test.tsx` (created)
- `frontend/src/test/setup.ts` (created)

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-22 | Created Story 2.2 context file with frontend list-state implementation guardrails and acceptance-mapped tasks | Story Agent |
| 2026-05-22 | Implemented Story 2.2 frontend todo list state handling, TanStack Query integration, and acceptance-mapped test coverage | Dev Agent |
| 2026-05-22 | Marked story status as done after review completion | Dev Agent |
