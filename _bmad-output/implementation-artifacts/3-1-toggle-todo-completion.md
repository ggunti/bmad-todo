# Story 3.1: Toggle Todo Completion

Status: done

## Story

As a user,
I want to mark a todo as complete or un-complete with a single click,
so that I can track what I've done.

## Acceptance Criteria

1. **Given** the backend is running, **When** I call `PATCH /api/todos/:id` with `{ "completed": true }`, **Then** the backend updates that todo's `completed` field and returns `{ todo: Todo }` with the updated state.
2. **Given** a todo is active, **When** I click the checkbox, **Then** within 50ms the checkbox fills with accent + white checkmark, text gets line-through + secondary color, and a 1px diagonal hairline appears behind text.
3. **Given** a todo is completed, **When** I click the checkbox again, **Then** within 50ms the checkbox un-fills, strikethrough is removed, text color restores, and the diagonal hairline disappears.
4. **Given** a todo is toggled, **When** the toggle completes, **Then** the item remains in its current list position (stable ordering).
5. **Given** the `PATCH` request fails after optimistic toggle, **When** the error arrives, **Then** that row shows per-item failure indication with inline retry and optimistic visual state persists until retry or untoggle.
6. **Given** the checkbox renders, **When** inspected, **Then** it is an 18x18 rounded square (4px radius), 1.5px tertiary border, has `role="checkbox"`, `aria-checked`, contextual `aria-label` ("Mark complete: [todo text]" / "Mark incomplete: [todo text]"), and 44x44 hit area.
7. **Given** the checkbox is keyboard focused, **When** I press Space, **Then** it toggles completion state with behavior identical to click.

## Tasks / Subtasks

- [x] Task 1: Add backend toggle endpoint with session isolation and contract fidelity (AC: 1, 4, 5)
  - [x] Add `PATCH /api/todos/:id` in `backend/src/routes/todos.ts`.
  - [x] Validate body shape with Zod (`completed: boolean`) and return `VALIDATION_ERROR` envelope on invalid input.
  - [x] Scope lookup/update by `{ id, sessionId }`; return `404` + `NOT_FOUND` envelope when todo is not owned by current session.
  - [x] Return `{ todo }` with updated record and preserve `sortOrder` (no reorder side effects).

- [x] Task 2: Extend backend test coverage for toggle behavior (AC: 1, 4, 5)
  - [x] Update `backend/src/routes/todos.test.ts` to cover successful toggle and response envelope.
  - [x] Add test proving session isolation on `PATCH /api/todos/:id` (cross-session id returns 404).
  - [x] Add validation failure test for non-boolean `completed`.

- [x] Task 3: Extend frontend API/types for toggle mutation (AC: 1, 5)
  - [x] Add toggle request/response typings in `frontend/src/types/todo.ts` (or colocated API types if preferred by current pattern).
  - [x] Add `toggleTodoCompletion(id, completed)` in `frontend/src/api/todos.ts` with strict envelope guards and `TodosApiError` behavior matching existing GET/POST paths.

- [x] Task 4: Implement optimistic toggle mutation hook (AC: 2, 3, 4, 5)
  - [x] Create `frontend/src/hooks/useToggleTodo.ts` using TanStack Query mutation lifecycle (`onMutate`, `onError`, `onSettled`) consistent with existing create flow.
  - [x] `onMutate`: cancel todos query, snapshot previous list, optimistically toggle only target row's `completed`.
  - [x] `onError`: keep/recover per-row failure indication and expose inline retry action for the failed row.
  - [x] `onSettled`: invalidate `['todos']` for authoritative reconciliation.

- [x] Task 5: Update list row UI for checkbox, completed styling, and row-local failure state (AC: 2, 3, 5, 6, 7)
  - [x] Update `frontend/src/components/TodoList.tsx` to render an interactive checkbox control per row.
  - [x] Apply completed visuals (line-through, muted text, diagonal hairline) without moving row position.
  - [x] Ensure click and Space key trigger identical toggle behavior.
  - [x] Add ARIA contract (`role`, `aria-checked`, contextual `aria-label`) and 44x44 hit-target.
  - [x] Keep failed-row indication inline and scoped to affected row only.

- [x] Task 6: Integrate toggle hook through app shell with no regressions (AC: 2, 3, 4, 5, 7)
  - [x] Wire `useToggleTodo` into `frontend/src/App.tsx` and pass handlers into `TodoList`.
  - [x] Preserve Story 2.2/2.3 behaviors: initial loading/empty/error states and optimistic create flow.
  - [x] Do not introduce global mutation loading overlays, route changes, or modal interactions.

- [x] Task 7: Add focused frontend tests for interaction and accessibility (AC: 2, 3, 5, 6, 7)
  - [x] Extend `frontend/src/components/TodoList.test.tsx` (or split tests if file becomes too large) for click toggle optimistic behavior.
  - [x] Add keyboard Space toggle coverage and ARIA assertions (`role=checkbox`, `aria-checked`, label text).
  - [x] Add failure-path test: failed `PATCH` shows row-level failure + retry and does not block other rows.
  - [x] Assert toggling does not change row order.

## Dev Notes

### Story Intent and Scope Guardrails

- This story only introduces completion toggle behavior (backend + UI + optimistic reconciliation). Do not implement single-delete, clear-all, reorder, or new global state systems.
- Stable ordering is a hard requirement: completion toggles must never reorder rows.
- Keep failure handling local to a row; no toast stack and no app-wide failure banner for toggle mutation.

### Epic Context (Epic 3)

- Epic 3 delivers completion and deletion flows with optimistic interactions and recoverable inline failures.
- Story sequencing in this epic:
  - Story 3.1: completion toggle (this story)
  - Story 3.2: single-item delete
  - Story 3.3: clear-all confirmation and footer
- Decisions made here (checkbox API contracts, row-level failure handling, completed-row visuals) should be reusable in 3.2 and 3.3.

### Existing Baseline Intelligence

- Backend currently exposes `GET /api/todos` and `POST /api/todos`; Story 3.1 adds the first `PATCH` path for item-level mutation.
- Frontend already has optimistic-create patterns and inline failed-row retry behavior in place; reuse and extend those patterns rather than introducing a second mutation architecture.
- Current tests already mock fetch and assert list-state transitions; follow this style for toggle tests to stay consistent and maintainable.

### Technical Requirements (Must Follow)

- Runtime stack in-repo:
  - Frontend: React `^19.2.5`, TypeScript `~6.0.2`, TanStack Query `^5.100.11`, Vite `^8.0.10`
  - Backend: Express `5.2.1`, Prisma `^7.8.0`, Zod `^4.4.3`
- API contracts to preserve:
  - Success: `{ todo: Todo }`
  - Error: `{ error: { code: string, message: string } }`
- Validation boundary:
  - Client validation improves UX only.
  - Server-side validation remains authority for request correctness.

### Architecture Compliance Requirements

- Follow existing module boundaries:
  - `backend/src/routes/` for endpoint handlers
  - `frontend/src/api/` for fetch wrappers
  - `frontend/src/hooks/` for mutation/query orchestration
  - `frontend/src/components/` for interaction + rendering
  - `frontend/src/types/` for shared frontend API typing
- Use TanStack Query optimistic lifecycle consistently:
  - `onMutate`: cancel query + snapshot + optimistic patch
  - `onError`: rollback/failure-state handling
  - `onSettled`: invalidate todos query
- Keep naming conventions from architecture:
  - Components PascalCase, non-component files kebab-case, hooks `use*`, booleans `is*`/`has*`.

### UX and Accessibility Compliance Requirements

- Checkbox contract:
  - 18x18 visual box, rounded corners (4px), 1.5px border
  - 44x44 effective hit area
  - `role="checkbox"` + `aria-checked` + contextual label text
- Completed-state visuals:
  - Text strikethrough + muted color
  - Diagonal 1px hairline appears only when completed
  - Toggle reaction target: within 50ms perceived UI response
- Keyboard:
  - Space on focused checkbox must mirror click behavior.
- Failure behavior:
  - Row-local warning indication and retry control.
  - Optimistic state remains visible until explicit retry or inverse toggle.

### File Structure Requirements

- Expected backend updates:
  - `backend/src/routes/todos.ts`
  - `backend/src/routes/todos.test.ts`
  - `backend/src/validation/todo.ts` (if toggle schema is added there)
- Expected frontend updates:
  - `frontend/src/api/todos.ts`
  - `frontend/src/types/todo.ts`
  - `frontend/src/hooks/useToggleTodo.ts` (new)
  - `frontend/src/components/TodoList.tsx`
  - `frontend/src/components/TodoList.test.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/index.css` (only if required for completed-row visuals and hit-target styling)

### Testing Requirements

- Backend:
  - `PATCH /api/todos/:id` success response envelope and updated `completed` value.
  - Session isolation: foreign-session ID must return `404 NOT_FOUND`.
  - Validation: non-boolean `completed` returns `400 VALIDATION_ERROR`.
- Frontend:
  - Click and Space toggles update UI optimistically.
  - Row order remains stable across toggles.
  - ARIA semantics and labels are present and update with state.
  - Failed patch yields row-level failure and retry behavior without affecting other rows.

### Anti-Pattern Prevention

- Do not recompute or rewrite `sortOrder` inside toggle operations.
- Do not move completed items to a different list section; this app uses a single mixed list.
- Do not degrade to global `isLoading` mutation locks.
- Do not bypass typed API envelope checks in frontend fetch wrappers.
- Do not replace existing optimistic-create patterns; extend them consistently.

### Git Intelligence Summary

- Recent commit cadence is story-scoped (`create and implement story X.Y`) with PR merges between stories.
- Latest completed story (`2.3`) established optimistic mutation + row-local failure conventions and should be treated as the implementation baseline.
- Keep this story similarly scoped and acceptance-mapped to maintain traceability and reviewability.

### Latest Tech Information

- TanStack Query v5 guidance continues to recommend the same optimistic mutation pattern used in this repository: cancel queries, snapshot cache, optimistic update, rollback on error, invalidate on settled.
- Express 5 + Zod boundary validation patterns remain stable for JSON REST APIs; route-level `safeParse` + structured error envelopes stays aligned with current best practice.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.1 acceptance criteria and sequencing)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR-011, FR-016, FR-017, FR-018, NFR-004, NFR-016, NFR-017, NFR-020)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (API envelope contracts, TanStack Query mutation lifecycle, structure and naming conventions)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (toggle flow, checkbox sizing/ARIA, stable ordering, row-level failure pattern)]
- [Source: `backend/src/routes/todos.ts` and `backend/src/routes/todos.test.ts` (current route/testing patterns to extend)]
- [Source: `frontend/src/components/TodoList.tsx`, `frontend/src/components/TodoList.test.tsx`, `frontend/src/api/todos.ts`, `frontend/src/types/todo.ts` (current frontend baseline)]

### Project Structure Notes

- No `project-context.md` file is present in this repository.
- Story should be implemented incrementally on top of the current in-progress Story 2.3 working tree without discarding local uncommitted changes.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow applied: `bmad-dev-story` (`workflow.md`)
- Story auto-selected from sprint status: `3-1-toggle-todo-completion`
- Validation run: `cd frontend && npm run lint && npm test && cd ../backend && npm test`
- Backend updated with new `PATCH /api/todos/:id` route and validation schema
- Frontend updated with optimistic toggle mutation hook, checkbox UI, and row-local retry behavior

### Completion Notes List

- Added `PATCH /api/todos/:id` with session-scoped lookup, boolean validation, and `NOT_FOUND` handling
- Added backend route tests for successful toggle, session isolation, and validation error scenarios
- Added frontend toggle API typings + strict payload guards and `toggleTodoCompletion`
- Implemented `useToggleTodo` optimistic mutation lifecycle with row-local retry metadata
- Updated todo row UI with accessible checkbox semantics, Space handling, completed visuals, and 44x44 hit area
- Extended UI tests for click/keyboard toggle behavior, stable ordering, and row-local failure + retry flow
- Story status moved to `review` after passing frontend lint + frontend tests + backend tests

### File List

- `_bmad-output/implementation-artifacts/3-1-toggle-todo-completion.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `backend/src/routes/todos.ts` (updated)
- `backend/src/routes/todos.test.ts` (updated)
- `backend/src/validation/todo.ts` (updated)
- `frontend/src/App.tsx` (updated)
- `frontend/src/api/todos.ts` (updated)
- `frontend/src/components/TodoList.test.tsx` (updated)
- `frontend/src/components/TodoList.tsx` (updated)
- `frontend/src/hooks/useToggleTodo.ts` (created)
- `frontend/src/index.css` (updated)
- `frontend/src/types/todo.ts` (updated)

## Change Log

- 2026-05-22: Created Story 3.1 context file with acceptance-mapped tasks, architecture guardrails, UX/a11y constraints, and anti-regression guidance.
- 2026-05-22: Implemented Story 3.1 toggle completion backend/frontend flow with optimistic UI, row-local failure retry, accessibility updates, and automated test coverage.
