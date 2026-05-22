# Story 2.3: Todo Input, Validation & Optimistic Add

Status: done

## Story

As a user,
I want to type a todo and press Enter to add it instantly with validation feedback,
so that I can capture thoughts as fast as I can think without waiting for the server.

## Acceptance Criteria

1. **Given** the page loads, **When** the input field renders, **Then** it is automatically focused, has placeholder `"What needs doing?"`, `aria-label="New todo"`, and is never disabled.
2. **Given** the input field is focused, **When** I type `"buy bread"` and press Enter, **Then** the new todo appears at the top of the list within 50ms (optimistic insert), the input clears, and the input retains focus.
3. **Given** a new todo is optimistically inserted, **When** the POST request succeeds in the background, **Then** the optimistic item is silently reconciled with the server response.
4. **Given** a new todo is optimistically inserted, **When** the POST request fails (4xx, 5xx, network error), **Then** the affected row shows failure indication (`--warning-bg` row background, warning border, warning glyph, inline retry) with `role="status"`.
5. **Given** a failed item is showing failure indication, **When** I click inline retry, **Then** POST re-fires and row returns to normal on success (or remains failed on repeated failure).
6. **Given** I press Enter on empty or whitespace-only input, **When** validation runs, **Then** inline message `"Add some text first."` appears below input (`--warning`, `--text-sm`, `aria-live="polite"`), input retains focus, and input is cleared.
7. **Given** I press Enter with text exceeding 1024 characters, **When** validation runs, **Then** inline message `"Max 1024 characters — please shorten."` appears below input; input retains focus and preserves text for editing.
8. **Given** a validation message is visible, **When** I start typing again, **Then** validation message disappears immediately.
9. **Given** I click the `"Add"` button instead of Enter, **When** click fires, **Then** identical add logic runs (same behavior).
10. **Given** I add ten items in rapid succession, **When** each Enter is pressed, **Then** each item appears at top within 50ms, requests resolve independently, and failures are isolated per item.

## Tasks / Subtasks

- [x] Task 1: Add client-side create validation and message mapping (AC: 6, 7, 8)
  - [x] Create `frontend/src/validation/todo.ts` with named export schema and helper validation function for create text.
  - [x] Implement deterministic message mapping to exact UX copy:
    - [x] Empty/whitespace -> `"Add some text first."`
    - [x] Over-length -> `"Max 1024 characters — please shorten."`
  - [x] Ensure validation result is synchronous and low-latency (no async debounce before first response).

- [x] Task 2: Extend API layer for create + typed errors (AC: 2, 3, 4, 5, 10)
  - [x] Extend `frontend/src/api/todos.ts` with `createTodo(input)` and `CreateTodoRequest` typing.
  - [x] Keep strict JSON envelope checks and throw `TodosApiError` for non-2xx responses.
  - [x] Add typed handling for `POST /api/todos` success envelope `{ todo }`.

- [x] Task 3: Implement optimistic add mutation hook with rollback and retry metadata (AC: 2, 3, 4, 5, 10)
  - [x] Add `frontend/src/hooks/useCreateTodo.ts` with the architecture mutation pattern:
    - [x] `onMutate`: cancel `['todos']`, snapshot prior list, optimistically insert temp todo at top
    - [x] `onError`: rollback or preserve row with failed marker (per AC 4), store retry callback tied to optimistic row
    - [x] `onSettled`: invalidate `['todos']`
  - [x] Ensure independent mutation resolution for rapid-fire adds (no single global pending gate).
  - [x] Represent optimistic rows with stable temporary IDs to avoid React key churn.

- [x] Task 4: Build input surface component and integrate UX semantics (AC: 1, 2, 6, 7, 8, 9)
  - [x] Create `frontend/src/components/TodoInput.tsx` with:
    - [x] Text input (`placeholder`, `aria-label`, autofocus on mount, never disabled)
    - [x] Visible `Add` button (secondary visual role)
    - [x] Reserved inline validation slot below controls (`aria-live="polite"`)
  - [x] Wire Enter and Add button to the same submit path.
  - [x] Keep focus on input after every submit path (success, validation failure, request failure).

- [x] Task 5: Add row-level failed-add rendering and retry affordance (AC: 4, 5, 10)
  - [x] Extend `frontend/src/components/TodoList.tsx` rendering to support failed row decoration and inline retry action.
  - [x] Add/adjust small row sub-component if needed (e.g., `FailureIndication`) while staying in `components/` flat structure.
  - [x] Ensure only the affected item shows failed state; unaffected rows remain stable.

- [x] Task 6: Integrate mutation flow into app shell without regressing Story 2.2 behavior (AC: 1-10)
  - [x] Update `frontend/src/App.tsx` to render input above list region and connect create mutation + failure state plumbing.
  - [x] Preserve Story 2.2 cold-start loading/empty/error semantics for initial fetch.
  - [x] Keep responsive structure and token usage aligned with existing `frontend/src/index.css`.

- [x] Task 7: Add focused test coverage for optimistic add + validation (AC: 1-10)
  - [x] Add tests for Enter submit and Add-button parity.
  - [x] Add tests for validation copy, focus retention, and message clear-on-typing.
  - [x] Add tests for optimistic top insertion and independent rapid-fire failure isolation.
  - [x] Add tests for failed-row retry flow and row-state recovery on success.
  - [x] Keep lint/type-check/tests green for frontend scope.

## Dev Notes

### Story Intent and Scope Guardrails

- This story implements input + optimistic create only. Do not pull in toggle/delete/reorder/clear-all behaviors from later stories.
- Preserve list-region initial load behavior from Story 2.2. No global loading overlays during add mutations.
- Failure handling is row-local and non-modal. No toast system, no modal dialogs for add failures.
- Add button must remain interactive (never disabled/never spinner). Optimistic insertion is the primary feedback channel.

### Previous Story Intelligence (Story 2.2)

- Existing frontend baseline already ships:
  - Typed list fetch + strict envelopes in `frontend/src/api/todos.ts`
  - Query hook `frontend/src/hooks/useTodos.ts` (`retry: false` for manual retry UX)
  - State-region components and `TodoList` shell rendering
- Current `App.tsx` uses fetch state for loading/error/empty and will need careful extension to avoid reintroducing loading state on mutation.
- Existing CSS tokens and responsive card styling are already aligned to Story 2.2; extend instead of redesign.
- Story 2.2 done artifact and commits show established pattern: focused changes in `components/`, `hooks/`, `api/`, `types/`, and acceptance-mapped tests.

### Technical Requirements (Must Follow)

- Stack and versions:
  - React `^19.2.5`
  - TypeScript `~6.0.2`
  - Vite `^8.0.10`
  - `@tanstack/react-query` current line `5.100.x`
  - Zod validation on client for immediate feedback; backend remains validation authority
- Naming and exports:
  - PascalCase components, kebab-case non-component files, camelCase functions
  - Named exports only (except `App` default export)
- API contracts (must not drift):
  - `POST /api/todos` success: `{ todo: Todo }`
  - Error shape: `{ error: { code, message } }`

### Architecture Compliance Requirements

- Use architecture mutation lifecycle exactly for optimistic operations:
  - `onMutate -> cancel queries -> snapshot -> optimistic cache update`
  - `onError -> rollback/failure-state handling`
  - `onSettled -> invalidate queries`
- Keep frontend boundaries:
  - API wrappers in `frontend/src/api/`
  - Query/mutation wrappers in `frontend/src/hooks/`
  - UI and interaction in `frontend/src/components/`
  - Validation in `frontend/src/validation/`
- No router introduction, no parallel state container replacing TanStack Query cache.

### UX Compliance Requirements

- Input:
  - Placeholder exactly `"What needs doing?"`
  - `aria-label="New todo"`
  - Auto-focus on load and re-focus after actions
- Validation copy exactness:
  - Empty: `"Add some text first."`
  - Over-length: `"Max 1024 characters — please shorten."`
- Failure UX:
  - Row-local warning state with inline retry and `role="status"`
  - Keep interaction calm: no motion-heavy transitions, no focus theft
- Add button:
  - Visible, secondary role, never disabled, no loading spinner.

### File Structure Requirements

- Expected files to create:
  - `frontend/src/components/TodoInput.tsx`
  - `frontend/src/hooks/useCreateTodo.ts`
  - `frontend/src/validation/todo.ts`
- Expected files to update:
  - `frontend/src/App.tsx`
  - `frontend/src/components/TodoList.tsx`
  - `frontend/src/api/todos.ts`
  - `frontend/src/types/todo.ts` (if optimistic/failure typing requires it)
  - `frontend/src/index.css` (only minimal token-consistent styles for input/inline failure)
  - `frontend/src/components/TodoList.test.tsx` and/or new focused tests for input/create flow

### Testing Requirements

- Verify autofocus on first render and focus retention after Enter/Add interactions.
- Verify exact validation messages and immediate clear-on-typing behavior.
- Verify optimistic insert appears at top before network completion.
- Verify POST success reconciliation does not visually flicker or duplicate.
- Verify POST failure marks only failed row and exposes retry control.
- Verify rapid-fire adds resolve independently, preserving unaffected rows.

### Anti-Pattern Prevention

- Do not block add interactions behind a single `isLoading` guard that serializes submissions.
- Do not disable input/button during pending mutation.
- Do not collapse all failures into a global app-level error banner.
- Do not mutate query cache without snapshot/rollback context.
- Do not derive ordering from `createdAt`; preserve list ordering contract (`sortOrder`, newest at top behavior via backend and optimistic insertion).
- Do not replace user over-length text on validation failure.

### Git Intelligence Summary

- Recent delivery pattern is "create and implement story X.Y" followed by merge PR.
- Story 2.2 implementation touched exactly the folders this story should continue using (`frontend/src/api`, `hooks`, `components`, `types`, tests).
- Backend `POST /api/todos` contract is already stable in Story 2.1 implementation and should be consumed, not redefined.

### Latest Tech Information

- `@tanstack/react-query` latest stable line is `5.100.11` (May 2026); architecture baseline `5.100.8` remains compatible for this story's mutation APIs.
- TanStack Query package line (`@tanstack/query*`) is documented as unaffected by the May 2026 TanStack Router/Start supply-chain incident; standard pinned-version hygiene still applies.
- React 19 guidance continues to support optimistic UI patterns (`useOptimistic`) but this project's architecture standard remains TanStack Query cache-driven optimistic mutation; keep consistency over introducing a second optimistic state model.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3 acceptance criteria, FR/NFR mapping, UX requirements)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR-007 to FR-010, FR-016 to FR-018, NFR-004, NFR-012, NFR-016 to NFR-018)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (TanStack Query mutation pattern, API envelopes, frontend structure, naming rules)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (input-first interaction model, inline validation behavior, row-local failure and retry expectations)]
- [Source: `_bmad-output/implementation-artifacts/2-2-todo-list-display-with-empty-loading-error-states.md` (existing frontend baseline and learnings)]
- [Source: `backend/src/routes/todos.ts` and `backend/src/validation/todo.ts` (POST contract and server validation messages)]

### Project Structure Notes

- No `project-context.md` file is present in the repository.
- Existing story work-in-progress already includes Story 2.2 frontend files in the expected structure; Story 2.3 should layer on those modules rather than replace them.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow applied: `bmad-create-story` (`workflow.md`, `template.md`, `checklist.md`)
- Story key auto-selected from sprint status: `2-3-todo-input-validation-optimistic-add`
- Previous story intelligence source: `_bmad-output/implementation-artifacts/2-2-todo-list-display-with-empty-loading-error-states.md`
- Git intelligence source: `git log -5` + recent changed-file analysis
- Web intelligence source: package/docs checks for TanStack Query and React 19 optimistic guidance
- Dev workflow applied: `bmad-dev-story/workflow.md` (full execution through validation and completion)
- Validation commands run: `cd frontend && npm run test`, `cd frontend && npm run lint`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story context includes acceptance-mapped task breakdown, architecture guardrails, UX exact-copy constraints, and anti-pattern prevention
- Sprint status should transition this story from `backlog` to `ready-for-dev` immediately after file creation
- Implemented client-side synchronous create validation with exact message mapping and clear-on-typing behavior.
- Added typed `POST /api/todos` client API handling with strict success/error envelope checks.
- Implemented `useCreateTodo` optimistic mutation lifecycle (`onMutate` snapshot/update, `onError` failed-row state, `onSettled` query invalidation).
- Added `TodoInput` UI with autofocus, Enter/Add parity, and focus retention.
- Added row-level failed-save indication in `TodoList` with inline retry and isolated per-row failure handling.
- Extended tests for validation, optimistic insertion, rapid-fire isolation, and retry recovery; frontend test and lint are green.

### File List

- `_bmad-output/implementation-artifacts/2-3-todo-input-validation-optimistic-add.md` (updated)
- `frontend/src/App.tsx` (updated)
- `frontend/src/api/todos.ts` (updated)
- `frontend/src/components/TodoInput.tsx` (created)
- `frontend/src/components/TodoList.tsx` (updated)
- `frontend/src/components/TodoList.test.tsx` (updated)
- `frontend/src/hooks/useCreateTodo.ts` (created)
- `frontend/src/index.css` (updated)
- `frontend/src/types/todo.ts` (updated)
- `frontend/src/validation/todo.ts` (created)

## Change Log

- 2026-05-22: Implemented Story 2.3 optimistic add, validation UX, failed-row retry handling, and acceptance-mapped frontend test coverage.
