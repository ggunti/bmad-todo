---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-05-04'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# todo-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for todo-bmad, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR-001: User can view their current list of todos in a single view (active and completed todos shown together in one list).
- FR-002: Completed todos are visually distinguished from active todos in the list.
- FR-003: List items appear in the order chosen by the user (see FR-014). New todos are inserted at the top of the list by default.
- FR-004: List shows an empty-state message when the user has no todos.
- FR-005: List shows a loading state during the initial cold-start fetch only — not during subsequent CRUD operations.
- FR-006: List shows an error state when the backend is unreachable on initial load, with a retry control.
- FR-007: User can add a new todo by entering free-text and submitting.
- FR-008: New-todo submission is supported via the Enter key and via a visible Add control.
- FR-009: New-todo input field is focused automatically on initial page load.
- FR-010: New-todo submissions are validated before being accepted: (a) empty or whitespace-only content is rejected with a clear, non-blocking inline message, and (b) content exceeding 1024 characters is rejected with a clear, non-blocking inline message indicating the limit.
- FR-011: User can toggle a todo between completed and active state.
- FR-012: User can delete a single todo.
- FR-013: User can clear all of their todos (active and completed) in a single action.
- FR-014: User can reorder their todos via drag-and-drop on pointer devices, with equivalent keyboard semantics on the drag handle (focus an item, Space/Enter to pick up, arrow keys to move, Space/Enter to drop).
- FR-015: Clear-all action requires explicit confirmation via a destructive-action confirmation dialog with non-destructive default focus (Cancel focused by default).
- FR-016: All CRUD actions (add, toggle, delete, reorder, clear-all) update the local UI immediately upon user input, without waiting for the backend response.
- FR-017: When a backend operation fails, the corresponding optimistic UI change is rolled back and the failure is surfaced to the user as a non-blocking, per-item (or per-action) indication.
- FR-018: User can manually retry a failed CRUD operation without re-entering data.
- FR-019: Backend assigns each new visitor an opaque, anonymous session identifier persisted as an HTTP-only cookie on first visit.
- FR-020: Backend persists each user's todo list — including each todo's completion state and the user's chosen order — keyed by their session identifier.
- FR-021: User's todo list (with completion state and chosen order) is restored on every subsequent visit within the same browser, for at least 24 hours after last activity.
- FR-022: Clear-all action empties the user's stored todos but does not invalidate the session identifier.
- FR-023: Backend supports concurrent independent anonymous users; each user's todos are fully isolated from every other user's todos.
- FR-024: Application page exposes a `<title>`, `<meta name="description">`, and favicon.
- FR-025: Application page exposes OpenGraph and Twitter Card meta tags for clean link previews when the URL is shared.
- FR-026: Application page declares `<meta name="robots" content="noindex, nofollow">`.
- FR-027: System is deployable via a single `docker-compose up` invocation.
- FR-028: Project README documents a step-by-step install + run path completable in ≤ 10 minutes by a developer who has never seen the project.
- FR-029: Each FR in this PRD has end-to-end traceability to ≥ 1 implementing story and ≥ 1 implementing commit, navigable in ≤ 3 hops.

### NonFunctional Requirements

- NFR-001: Initial load time-to-interactive ≤ 1.5s on Lighthouse mobile profile, broadband network, mid-range device.
- NFR-002: List region first contentful paint ≤ 800ms on warm cache.
- NFR-003: All CRUD endpoints respond at p95 ≤ 200ms localhost, p95 ≤ 500ms production.
- NFR-004: Local UI updates for any CRUD action within 50ms of user input event.
- NFR-005: Zero data loss across normal-operation backend process restart.
- NFR-006: User's full todo list restored on subsequent visit within ≥ 24 hours of last activity.
- NFR-007: When backend unreachable, show clear non-blocking error state with retry without full page reload.
- NFR-008: All production traffic served over HTTPS; session cookie marked Secure in production.
- NFR-009: Session cookie must be HttpOnly, SameSite=Lax, contain only opaque server-generated identifier.
- NFR-010: All user-supplied todo text stored and rendered to prevent script injection (XSS prevention).
- NFR-011: State-changing API endpoints protected against CSRF. SameSite=Lax provides baseline; additional CSRF token decided in architecture.
- NFR-012: All input validation enforced on client also enforced on server (server is authority).
- NFR-013: System stores only necessary data: opaque session ID and todo entities. No fingerprinting, no IP logging, no analytics, no tracking.
- NFR-014: Application includes brief plain-language cookie disclosure accessible from footer link.
- NFR-015: Idle data older than 90 days since last activity may be purged. TTL documented in README and architecture.
- NFR-016: Every CRUD action fully operable using keyboard alone, including reorder via keyboard semantics on drag handle.
- NFR-017: All interactive elements show clearly visible focus state when focused, distinguishable from non-focused. No outline:none without equivalent.
- NFR-018: Deployed application produces zero failures on automated accessibility audit (axe-core or Lighthouse a11y). Not full WCAG 2.1 AA.
- NFR-019: Application functions correctly on last 2 stable major versions of Chrome, Firefox, Safari, Edge.
- NFR-020: Application renders across 320px to 1920px with no horizontal scroll; touch targets ≥ 44×44 CSS px on viewports ≤ 768px.
- NFR-021: Root font size ≥ 16px on mobile to prevent iOS Safari zoom-on-focus.
- NFR-022: Codebase produces zero linter warnings in CI for frontend and backend.
- NFR-023: If static type checker used, codebase produces zero type errors in CI.
- NFR-024: Backend persistence logic has meaningful test coverage. ≥ 80% line coverage on backend/src/routes/ and backend/src/middleware/.
- NFR-025: Every story file references source FR(s); every commit message references its story.
- NFR-026: Backend logs all unhandled exceptions and 5xx responses with context to stdout/stderr.
- NFR-027: No client telemetry. No analytics, no performance beacons, no third-party error-reporting.
- NFR-028: Application and services run as containers via Docker Compose. No host-installed runtimes required.
- NFR-029: All deployment-environment-specific configuration settable via environment variables. No hardcoded production values.

### Additional Requirements

Architecture-derived requirements that impact epic and story creation:

- **Starter template specified:** Vite `react-ts` template (frontend) + hand-rolled Express TypeScript (backend). Project initialization should be Epic 1 Story 1.
- **Technology stack locked:** React 19.2.5, Vite 8.0.10, Tailwind CSS 4.2.4, TanStack Query 5.100.8, @dnd-kit/react 0.4.0, @radix-ui/react-dialog 1.1.15, Express 5.2.1, Prisma 7.8.0, Zod 4.4.3, PostgreSQL 17.
- **Database schema defined:** Single `Todo` model with fields: id (UUID), sessionId, text (VarChar 1024), completed (Boolean), sortOrder (Int), createdAt, updatedAt. Index on sessionId.
- **Prisma migration strategy:** Migrations run as part of Docker entrypoint (`prisma migrate deploy`).
- **Session middleware:** Custom ~20-line middleware generating UUIDv4 session IDs; cookie attributes HttpOnly, SameSite=Lax, Secure (prod), Path=/, Max-Age=7776000 (90 days).
- **CSRF strategy decided:** SameSite=Lax sufficient; no CSRF token in v1.
- **API contract defined:** 6 endpoints — GET /api/todos, POST /api/todos, PATCH /api/todos/:id, PATCH /api/todos/reorder, DELETE /api/todos/:id, DELETE /api/todos. Standard error response format: `{ error: { code, message } }`.
- **State management pattern:** TanStack Query with optimistic mutation pattern (onMutate → cancel queries → snapshot → optimistic update → onError rollback → onSettled invalidate). Per-item failure state tracked via local React state map.
- **Frontend structure:** Flat component directory, hooks directory with TanStack Query wrappers, api directory with fetch wrappers, validation directory with Zod schemas, types directory.
- **Backend structure:** routes/, middleware/, validation/, prisma/ directories under src/.
- **Security middleware:** Helmet.js for HTTP security headers.
- **Static asset serving:** Express serves Vite `dist/` directory; API routes matched first, then static files, then SPA fallback.
- **Docker Compose:** 2 services — `app` (Node.js multi-stage build serving API + static) and `db` (postgres:17-alpine).
- **Test framework:** Vitest for both frontend and backend. ≥ 80% line coverage on backend routes and middleware.
- **Data retention script:** `scripts/cleanup-stale-sessions.ts` for 90-day idle data purge (manual in v1).
- **Implementation sequence:** Docker + DB → Backend setup → API endpoints → Frontend setup → TanStack Query → Components (Wave 1→2→3) → Integration → Testing.
- **Shared validation:** Zod schemas for todo text validation (not empty, ≤ 1024 chars) used on both client and server.
- **Naming conventions enforced:** PascalCase components, kebab-case non-component files, camelCase functions/variables, UPPER_SNAKE_CASE constants, named exports only.

### UX Design Requirements

- UX-DR1: **Design token system implementation** — Configure Tailwind with 10 CSS custom properties for color (--bg #FBFAF7, --surface #FFFFFF, --border #E8E3DB, --text-primary #1A1815, --text-secondary #5C5750, --text-tertiary #8A857C, --hairline #B5AEA4, --accent #2D3957, --warning #8C5A1A, --warning-bg #FBF1DC).
- UX-DR2: **Typography system** — IBM Plex Sans loaded via font-display: swap with preload. 2 weights (400 Regular, 500 Medium). 4-size type scale (--text-xs 13px, --text-sm 14px, --text-base 16px, --text-lg 19px). System-font fallback chain.
- UX-DR3: **Spacing system** — 7-token spacing scale (--space-1 4px, --space-2 8px, --space-3 12px, --space-4 16px, --space-6 24px, --space-8 32px, --space-12 48px). No magic numbers.
- UX-DR4: **Wordmark component** — "todo-bmad" in --text-lg Medium, --accent color, wrapped in `<h1>`, top-left of content well, not a link.
- UX-DR5: **Input field component** — Full-width, auto-focused on load (FR-009), --surface bg, 1px --border, placeholder "What needs doing?", aria-label="New todo", never disabled, never loading.
- UX-DR6: **Add button component** — Text button "Add" (not icon), visually secondary, --surface bg, 1px --border, --text-sm Medium. Never disabled, never loading. Right of input on desktop.
- UX-DR7: **Inline validation message component** — Reserved slot below input, --warning color, --text-sm. Two messages: "Add some text first." (empty) and "Max 1024 characters — please shorten." (over-length). aria-live="polite", auto-disappears on typing.
- UX-DR8: **Todo card component** — Dimensional card with 1px --border, --radius-base 6px, --surface bg, shadow on desktop only (0 1px 2px rgba(26,24,21,0.06)), no shadow on mobile. Card padding --space-3 vertical, --space-4 horizontal. Gap --space-2 between items.
- UX-DR9: **Checkbox sub-component** — 18×18px rounded square (4px radius), 1.5px --text-tertiary border. Checked: filled --accent + white checkmark. Hit area 44×44px via ::before. button role="checkbox" with aria-checked and contextual aria-label.
- UX-DR10: **Drag handle sub-component** — Six-dot glyph, --text-tertiary, always visible on every viewport (Direction A). Hover: color → --text-secondary, cursor → grab. Hit area 44×44px on touch. aria-label with reorder instructions.
- UX-DR11: **Delete button sub-component** — × glyph, --text-tertiary, transparent bg. No confirmation modal. Hit area 44×44px on touch. aria-label="Delete: [todo text]".
- UX-DR12: **Diagonal hairline completion mark** — Product's visual signature on completed items. 1px solid --hairline (#B5AEA4) at -12deg rotation, absolutely positioned spanning card width at vertical center. Behind text (z-index: 0). Static — no animation. aria-hidden="true".
- UX-DR13: **Per-row failure indication component** — Row bg → --warning-bg, border → rgba(140,90,26,0.25), warning glyph (⚠) in --warning, contextual failure message in --text-sm --warning, inline retry button (--accent, underlined, link-style). role="status". Item never auto-removed. Focus never stolen.
- UX-DR14: **Empty state component** — "No todos yet — add one above." in --text-tertiary, --text-base. Top-aligned. No illustration, no CTA button.
- UX-DR15: **Loading state component** — "Loading…" in --text-tertiary, --text-base. Cold-start only. No skeleton loader, no spinner. aria-live="polite".
- UX-DR16: **Initial-load error state component** — "Couldn't load your todos." in --text-secondary with Retry button. role="alert". Retry aria-label="Retry loading todos".
- UX-DR17: **Footer component** — Cookie disclosure link (left, --text-xs, underlined) + Clear-all button (right, visible only when list non-empty, destructive styling). margin-top --space-8.
- UX-DR18: **Clear-all confirmation dialog** — Radix Dialog headless primitive. 50% black backdrop, centered max-width 400px. Title "Clear all todos?" (--text-lg Medium). Body with dynamic count: "This will delete all [N] todos. This cannot be undone." Cancel default-focused. Destructive button: --warning border + text, visually less prominent.
- UX-DR19: **Drag-and-drop reorder** — @dnd-kit/react headless primitive. Pointer drag with continuous following + shadow upgrade (0 4px 12px rgba(26,24,21,0.12)). Keyboard: Space/Enter lift → ↑/↓ move → Space/Enter drop → Escape cancel. aria-live announcements for each move.
- UX-DR20: **Responsive layout** — Single CSS breakpoint at 640px. Mobile-first. Content well max-width 640px centered. Mobile: full-width, --space-6 gutter/top padding, no card shadow. Desktop: --space-12 top padding, --space-8 bottom padding, card shadow added.
- UX-DR21: **Focus ring** — 2px solid --accent (#2D3957), 2px offset, applied via :focus-visible only. Uniform across all interactive elements.
- UX-DR22: **Motion constraints** — Single --motion-duration 150ms, --motion-easing cubic-bezier(0,0,0.2,1). Applied only to drag-drop settle and dialog open/close. @media (prefers-reduced-motion: reduce) disables all motion.
- UX-DR23: **Button hierarchy** — 4 button roles: primary action (Add/Retry), cancel/safe, destructive (Clear-all), iconic in-row control (checkbox/handle/delete). All never disabled, never loading.
- UX-DR24: **Cookie disclosure page** — Static HTML at /cookies (or frontend/public/cookies.html). Plain-language description of the session cookie's purpose and scope.

### FR Coverage Map

- FR-001: Epic 2 — View current list of todos
- FR-002: Epic 3 — Completed todos visually distinguished
- FR-003: Epic 2 — List items in user-chosen order, new at top
- FR-004: Epic 2 — Empty-state message
- FR-005: Epic 2 — Loading state on cold-start fetch only
- FR-006: Epic 2 — Error state with retry on initial load failure
- FR-007: Epic 2 — Add a new todo via free-text
- FR-008: Epic 2 — Submit via Enter key and visible Add control
- FR-009: Epic 2 — Input auto-focused on page load
- FR-010: Epic 2 — Client-side validation (empty + max length)
- FR-011: Epic 3 — Toggle todo between completed and active
- FR-012: Epic 3 — Delete a single todo
- FR-013: Epic 3 — Clear all todos in a single action
- FR-014: Epic 4 — Reorder via drag-and-drop + keyboard semantics
- FR-015: Epic 3 — Clear-all confirmation dialog with Cancel default-focused
- FR-016: Epic 2 (add), Epic 3 (toggle/delete/clear-all), Epic 4 (reorder) — Optimistic UI on all CRUD actions
- FR-017: Epic 2 (add), Epic 3 (toggle/delete/clear-all), Epic 4 (reorder) — Rollback + per-item failure indication
- FR-018: Epic 2 (add), Epic 3 (toggle/delete/clear-all), Epic 4 (reorder) — Manual retry without re-entering data
- FR-019: Epic 2 — Backend assigns anonymous session cookie on first visit
- FR-020: Epic 2 — Backend persists todos keyed by session identifier
- FR-021: Epic 2 — Todo list restored on subsequent visit within ≥ 24 hours
- FR-022: Epic 3 — Clear-all does not invalidate session identifier
- FR-023: Epic 2 — Concurrent independent anonymous users, fully isolated
- FR-024: Epic 1 — Page title, meta description, favicon
- FR-025: Epic 1 — OpenGraph and Twitter Card meta tags
- FR-026: Epic 1 — noindex/nofollow meta declaration
- FR-027: Epic 1 — Deployable via single docker-compose up
- FR-028: Epic 1 — README with ≤ 10 minute install path
- FR-029: Epic 5 — End-to-end FR-to-code traceability

## Epic List

### Epic 1: Project Foundation & Deployable Shell
A reviewer (Marco) can clone the repo, run `docker-compose up`, and see a running app with proper page metadata. The full technical foundation — frontend (Vite + React + Tailwind), backend (Express + Prisma), database (PostgreSQL), Docker orchestration, and README — is in place for all subsequent development.
**FRs covered:** FR-024, FR-025, FR-026, FR-027, FR-028

### Epic 2: Core Todo Capture & Persistence
The defining user experience. A user opens the app, sees their todo list (or empty/loading/error state), adds todos via the auto-focused input (Enter or Add button) with client-side validation, and todos persist across sessions via anonymous cookie. Optimistic UI on add with inline failure recovery. Establishes the TanStack Query optimistic mutation pattern reused by all subsequent epics.
**FRs covered:** FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-023

### Epic 3: Todo Completion & Deletion
Users can mark todos complete (with strikethrough + dim + diagonal hairline signature), un-complete them, delete individual todos (no confirmation), and clear all todos via a confirmed destructive action dialog. Session identity survives clear-all. All actions are optimistic with inline failure recovery.
**FRs covered:** FR-002, FR-011, FR-012, FR-013, FR-015, FR-022

### Epic 4: Todo Reordering
Users can reorder their todo list via drag-and-drop on pointer devices with equivalent keyboard semantics on the drag handle (Space/Enter to lift, arrow keys to move, Space/Enter to drop, Escape to cancel). User-chosen order persists to the backend and restores on subsequent visits.
**FRs covered:** FR-014

### Epic 5: Quality Assurance & Launch Readiness
The system passes all quality gates — automated accessibility audit clean, cross-browser smoke tests at 7 viewport widths, performance benchmarks (TTI, FCP, CRUD latency), backend test coverage (≥ 80%), and full FR-to-code traceability — making it release-ready.
**FRs covered:** FR-029

---

## Epic 1: Project Foundation & Deployable Shell

A reviewer (Marco) can clone the repo, run `docker-compose up`, and see a running app with proper page metadata. The full technical foundation — frontend (Vite + React + Tailwind), backend (Express + Prisma), database (PostgreSQL), Docker orchestration, and README — is in place for all subsequent development.

### Story 1.1: Project Scaffold & Docker Compose Deployment

As a reviewer,
I want to clone the repo and run `docker-compose up` to see a running application,
So that I can verify the project is deployable and start evaluating it within 10 minutes.

**Acceptance Criteria:**

**Given** the repo is cloned and .env.example is copied to .env
**When** I run `docker-compose up`
**Then** the `app` container (Node.js) and `db` container (postgres:17-alpine) both start successfully

**Given** the containers are running
**When** I open http://localhost:3001
**Then** I see the app shell rendered in the browser (a page with basic HTML content)

**Given** the backend starts
**When** it connects to PostgreSQL
**Then** Prisma migrations run automatically via the Docker entrypoint and the Todo table is created with all schema fields (id, sessionId, text, completed, sortOrder, createdAt, updatedAt)

**Given** I am a developer who has never seen this project
**When** I read the README
**Then** I find step-by-step instructions covering prerequisites, setup, and running the app locally, completable in ≤ 10 minutes

**Given** the application is running
**When** I check the configuration
**Then** all environment-specific values (DATABASE_URL, PORT, NODE_ENV, COOKIE_SECRET, COOKIE_SECURE) are sourced from environment variables with sensible development defaults

### Story 1.2: Page Metadata & Design System Foundation

As a visitor sharing the app URL,
I want the page to have proper metadata and a cohesive visual foundation,
So that link previews display correctly and the app has a professional, consistent appearance from the start.

**Acceptance Criteria:**

**Given** the page is loaded
**When** I inspect the HTML head
**Then** I find a `<title>` ("todo-bmad"), `<meta name="description">`, and a `<link rel="icon">` (favicon)

**Given** the page URL is shared on a social platform
**When** the platform fetches metadata
**Then** OpenGraph (`og:title`, `og:description`, `og:type`) and Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`) meta tags provide a clean preview

**Given** a search engine crawls the page
**When** it reads the meta tags
**Then** it finds `<meta name="robots" content="noindex, nofollow">`

**Given** the app is loaded
**When** I inspect the CSS
**Then** Tailwind CSS is configured with all design tokens: 10 color custom properties (--bg, --surface, --border, --text-primary, --text-secondary, --text-tertiary, --hairline, --accent, --warning, --warning-bg), 4 type sizes (--text-xs 13px, --text-sm 14px, --text-base 16px, --text-lg 19px), 7 spacing tokens, --radius-base 6px, single shadow token, --motion-duration 150ms, --motion-easing, and focus ring (2px solid --accent, 2px offset via :focus-visible)

**Given** the app is loaded
**When** text renders
**Then** IBM Plex Sans (weights 400 and 500) loads via `<link rel="preload">` with `font-display: swap` and falls back to the system-font chain

**Given** the app is loaded on a mobile viewport (< 640px)
**When** I view the page
**Then** content is full-width with --space-6 horizontal gutter and --space-6 top padding

**Given** the app is loaded on a desktop viewport (≥ 640px)
**When** I view the page
**Then** content is centered in a 640px max-width well with --space-12 top padding and --space-8 bottom padding

**Given** the app shell renders
**When** I see the page
**Then** the Wordmark "todo-bmad" appears top-left of the content well as an `<h1>` in --text-lg, font-weight 500, --accent color

**Given** motion is applied
**When** the user has `prefers-reduced-motion: reduce` enabled
**Then** all 150ms motion is disabled

---

## Epic 2: Core Todo Capture & Persistence

The defining user experience. A user opens the app, sees their todo list (or empty/loading/error state), adds todos via the auto-focused input (Enter or Add button) with client-side validation, and todos persist across sessions via anonymous cookie. Optimistic UI on add with inline failure recovery. Establishes the TanStack Query optimistic mutation pattern reused by all subsequent epics.

### Story 2.1: Backend Session Middleware & Todo API

As a user,
I want the backend to identify me anonymously and manage my todos,
So that my data persists across visits without creating an account.

**Acceptance Criteria:**

**Given** a new visitor makes their first request
**When** the backend processes the request
**Then** it generates a UUIDv4 session identifier and sets it as an HttpOnly, SameSite=Lax, Path=/, Max-Age=7776000 (90 days) cookie (Secure flag when COOKIE_SECURE=true)

**Given** a returning visitor makes a request with an existing session cookie
**When** the backend processes the request
**Then** it reads the session ID from the cookie and uses it to scope all data queries

**Given** a valid session exists
**When** I call GET /api/todos
**Then** the backend returns `{ todos: Todo[] }` with all todos for that session, ordered by sortOrder, each containing id, text, completed, sortOrder, createdAt, updatedAt

**Given** a valid session exists
**When** I call POST /api/todos with `{ text: "buy bread" }`
**Then** the backend creates a new todo with sortOrder placing it at the top, returns `{ todo: Todo }` with status 201

**Given** I submit a POST /api/todos with empty text or whitespace-only text
**When** the server validates the request
**Then** it returns 400 with `{ error: { code: "VALIDATION_ERROR", message: "Todo text cannot be empty" } }`

**Given** I submit a POST /api/todos with text exceeding 1024 characters
**When** the server validates the request
**Then** it returns 400 with `{ error: { code: "VALIDATION_ERROR", message: "Todo text cannot exceed 1024 characters" } }`

**Given** two different users with different session cookies
**When** each calls GET /api/todos
**Then** each sees only their own todos — complete isolation between sessions

**Given** the backend encounters an unhandled exception or returns a 5xx response
**When** the error occurs
**Then** it is logged to stdout/stderr with request path, hashed session ID, and stack trace

**Given** Helmet.js is configured
**When** the backend serves any response
**Then** standard HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.) are present

### Story 2.2: Todo List Display with Empty, Loading & Error States

As a user,
I want to see my todo list when I open the app, with clear feedback for empty, loading, and error conditions,
So that I always know the state of my data.

**Acceptance Criteria:**

**Given** the app loads and the initial data fetch is in progress
**When** the list region renders
**Then** it shows "Loading…" in --text-tertiary, --text-base (no skeleton, no spinner), with aria-live="polite"

**Given** the initial fetch returns an empty list
**When** the list region renders
**Then** it shows "No todos yet — add one above." in --text-tertiary, --text-base, top-aligned where the list would render

**Given** the initial fetch returns todos
**When** the list region renders
**Then** todos are displayed as a `<ul>` with each todo in a `<li>` card: --surface bg, 1px --border, --radius-base 6px, padding --space-3/--space-4, gap --space-2 between items

**Given** the viewport is ≥ 640px (desktop)
**When** todo cards render
**Then** they show a subtle box-shadow (0 1px 2px rgba(26,24,21,0.06))

**Given** the viewport is < 640px (mobile)
**When** todo cards render
**Then** they have no box-shadow (border alone provides dimensionality)

**Given** the initial fetch fails (backend unreachable, network error, 5xx)
**When** the list region renders
**Then** it shows "Couldn't load your todos." in --text-secondary with a Retry button, role="alert", Retry has aria-label="Retry loading todos"

**Given** the error state is shown
**When** the user clicks Retry
**Then** the fetch re-fires and the list region returns to loading state, then resolves to empty/populated/error

**Given** todos are returned
**When** the list renders
**Then** items appear in the order stored by sortOrder (newest at top by default per FR-003)

### Story 2.3: Todo Input, Validation & Optimistic Add

As a user,
I want to type a todo and press Enter to add it instantly with validation feedback,
So that I can capture thoughts as fast as I can think without waiting for the server.

**Acceptance Criteria:**

**Given** the page loads
**When** the input field renders
**Then** it is automatically focused, has placeholder "What needs doing?", aria-label="New todo", and is never disabled

**Given** the input field is focused
**When** I type "buy bread" and press Enter
**Then** the new todo appears at the top of the list within 50ms (optimistic insert), the input clears, and the input retains focus — ready for the next entry

**Given** a new todo is optimistically inserted
**When** the POST request succeeds in the background
**Then** the optimistic item is silently reconciled with the server response (visually identical)

**Given** a new todo is optimistically inserted
**When** the POST request fails (4xx, 5xx, network error)
**Then** the affected row shows failure indication: --warning-bg background, rgba(140,90,26,0.25) border, ⚠ warning glyph, "Couldn't save —" message in --text-sm --warning, and an inline retry button (--accent, underlined), with role="status"

**Given** a failed item is showing failure indication
**When** I click the inline retry button
**Then** the POST re-fires; on success the row returns to normal state; on failure the failure state persists

**Given** I press Enter on an empty or whitespace-only input
**When** validation runs
**Then** an inline message "Add some text first." appears below the input in --warning, --text-sm, with aria-live="polite"; the input retains focus and is cleared

**Given** I press Enter with text exceeding 1024 characters
**When** validation runs
**Then** an inline message "Max 1024 characters — please shorten." appears below the input; the input retains focus and preserves my text for editing

**Given** a validation message is visible
**When** I start typing again
**Then** the validation message disappears immediately

**Given** I click the "Add" button (right of input on desktop) instead of pressing Enter
**When** the click event fires
**Then** it triggers the same add logic as Enter — identical behavior

**Given** I add ten items in rapid succession
**When** each Enter is pressed
**Then** each item appears at the top within 50ms, POSTs resolve independently per item, and if item #3 fails only item #3 shows failure state — the others are unaffected

---

## Epic 3: Todo Completion & Deletion

Users can mark todos complete (with strikethrough + dim + diagonal hairline signature), un-complete them, delete individual todos (no confirmation), and clear all todos via a confirmed destructive action dialog. Session identity survives clear-all. All actions are optimistic with inline failure recovery.

### Story 3.1: Toggle Todo Completion

As a user,
I want to mark a todo as complete or un-complete with a single click,
So that I can track what I've done.

**Acceptance Criteria:**

**Given** the backend is running
**When** I call PATCH /api/todos/:id with `{ completed: true }`
**Then** the backend updates the todo's completed field and returns `{ todo: Todo }` with the updated state

**Given** a todo is in active state
**When** I click the checkbox
**Then** within 50ms: the checkbox fills with --accent + white checkmark, the text gets line-through + --text-secondary color, and the diagonal hairline appears across the card (1px --hairline at -12deg, spanning card width, behind text, aria-hidden="true")

**Given** a todo is in completed state
**When** I click the checkbox again
**Then** within 50ms: the checkbox un-fills, strikethrough is removed, text color restores to --text-primary, and the diagonal hairline disappears

**Given** a todo is toggled
**When** the toggle completes
**Then** the todo stays in its current list position — sort order is stable across toggle

**Given** the PATCH request fails after optimistic toggle
**When** the error response arrives
**Then** the row shows per-item failure indication (--warning-bg, warning glyph, "Couldn't save —" with inline retry) and the optimistic visual state persists until retry or un-toggle

**Given** the checkbox component renders
**When** I inspect it
**Then** it is an 18×18px rounded square (4px radius), 1.5px --text-tertiary border, with `role="checkbox"`, `aria-checked`, and contextual `aria-label` ("Mark complete: [todo text]" / "Mark incomplete: [todo text]"), hit area expanded to 44×44px via ::before

**Given** the checkbox is focused via keyboard
**When** I press Space
**Then** it toggles the completion state (same as click)

### Story 3.2: Delete Single Todo

As a user,
I want to delete a todo with one click,
So that I can remove items I no longer need.

**Acceptance Criteria:**

**Given** the backend is running
**When** I call DELETE /api/todos/:id
**Then** the backend deletes the todo and returns `{ success: true }`

**Given** I call DELETE /api/todos/:id with an ID that doesn't belong to my session
**When** the server processes the request
**Then** it returns 404 with `{ error: { code: "NOT_FOUND", message: "Todo not found" } }`

**Given** a todo is visible in the list
**When** I click the × delete button
**Then** the item disappears from the list within 50ms (optimistic removal), remaining items reflow naturally, and focus moves to the next item in the list (or to the input if it was the last item)

**Given** the DELETE request fails after optimistic removal
**When** the error response arrives
**Then** the item re-appears in its original position with failure indication (--warning-bg, warning glyph, "Couldn't delete —" with inline retry)

**Given** the delete button renders
**When** I inspect it
**Then** it is a × glyph in --text-tertiary, transparent background, with `aria-label="Delete: [todo text]"`, hit area 44×44px on touch viewports

**Given** no confirmation dialog
**When** I click delete on a single todo
**Then** the deletion happens immediately — no "Are you sure?" modal (modal reserved for clear-all only)

### Story 3.3: Clear All Todos with Confirmation & Footer

As a user,
I want to clear all my todos at once with a safety confirmation, and see a cookie disclosure link,
So that I can start fresh without accidentally losing everything, and understand what data the app stores.

**Acceptance Criteria:**

**Given** the list has one or more todos
**When** the footer renders
**Then** it shows a cookie disclosure link ("About cookies", left-aligned, --text-xs, --text-tertiary, underlined) and a "Clear all" button (right-aligned, destructive styling: --surface bg, 1px --warning border, --warning text)

**Given** the list is empty
**When** the footer renders
**Then** only the cookie disclosure link is visible; the "Clear all" button is hidden

**Given** the list has todos
**When** I click "Clear all"
**Then** a modal dialog opens (Radix Dialog) with: title "Clear all todos?" (--text-lg Medium), body "This will delete all [N] todos. This cannot be undone." (dynamic count, --text-base, --text-secondary), Cancel button (default-focused) and "Clear all" button (--warning border + text, visually less prominent)

**Given** the dialog is open
**When** I click Cancel, press Escape, or click outside
**Then** the dialog closes, the list is unchanged, and focus returns to the "Clear all" button in the footer

**Given** the dialog is open
**When** I click the "Clear all" confirm button
**Then** the dialog closes, the list empties immediately (optimistic), empty state appears, and DELETE /api/todos fires in the background

**Given** the backend is running
**When** the DELETE /api/todos request is processed
**Then** it deletes all todos for the session, returns `{ success: true }`, and the session cookie remains valid (FR-022)

**Given** the clear-all DELETE request fails
**When** the error response arrives
**Then** the list region shows a recoverable error "Couldn't clear — try again" with retry, and todos are restored from the server

**Given** the cookie disclosure link exists
**When** I click "About cookies"
**Then** I am taken to a static page (/cookies or cookies.html) with a plain-language description of the session cookie's purpose, scope, and that no tracking or analytics data is collected

**Given** the dialog is open
**When** I inspect accessibility
**Then** the dialog has role="dialog", aria-modal="true", aria-labelledby (title), aria-describedby (body), focus trap, and focus restore on close

---

## Epic 4: Todo Reordering

Users can reorder their todo list via drag-and-drop on pointer devices with equivalent keyboard semantics on the drag handle (Space/Enter to lift, arrow keys to move, Space/Enter to drop, Escape to cancel). User-chosen order persists to the backend and restores on subsequent visits.

### Story 4.1: Drag-and-Drop & Keyboard Reorder with Persistence

As a user,
I want to reorder my todos by dragging them or using keyboard shortcuts,
So that I can prioritize my list the way I prefer and have that order remembered.

**Acceptance Criteria:**

**Given** the backend is running
**When** I call PATCH /api/todos/reorder with `{ orderedIds: ["id3", "id1", "id2"] }`
**Then** the backend updates the sortOrder of each todo to match the provided order and returns `{ success: true }`

**Given** a todo card renders
**When** I inspect the drag handle
**Then** it is a six-dot glyph in --text-tertiary, always visible on every viewport (Direction A), with `aria-label="Reorder: [todo text]. Press space to lift, arrow keys to move, space again to drop."`, hit area 44×44px on touch viewports

**Given** the drag handle is visible
**When** I hover over it on desktop
**Then** the glyph color shifts to --text-secondary and the cursor changes to grab

**Given** I press my pointer on the drag handle
**When** I begin dragging
**Then** the cursor changes to grabbing, the row gains elevated shadow (0 4px 12px rgba(26,24,21,0.12)), and `aria-grabbed="true"` is set

**Given** I am dragging a row
**When** I move my pointer
**Then** the row follows the pointer continuously and other rows visually displace to show the insertion point

**Given** I am dragging a row
**When** I release the pointer
**Then** the row drops into the new position with a 150ms settle motion (--motion-easing), shadow returns to normal, and PATCH /api/todos/reorder fires in the background

**Given** the PATCH reorder request succeeds
**When** reconciliation completes
**Then** there is no visible change — the optimistic order is already correct

**Given** the PATCH reorder request fails
**When** the error response arrives
**Then** the row visibly returns to its original position with a 150ms motion and a brief inline failure indication ("Couldn't move —" with inline retry)

**Given** I Tab to a drag handle
**When** the handle gains focus
**Then** it shows the 2px --accent focus ring at 2px offset

**Given** a drag handle is focused
**When** I press Space or Enter
**Then** the row enters "lifted" state (elevated shadow, subtle moved indicator), arrow keys are intercepted, and aria-live announces "Row lifted: [todo text]. Use arrow keys to move."

**Given** a row is in lifted state
**When** I press ↓
**Then** the row swaps position with the row below and aria-live announces "Moved to position [N] of [M]."

**Given** a row is in lifted state
**When** I press ↑
**Then** the row swaps position with the row above and aria-live announces "Moved to position [N] of [M]."

**Given** a row is in lifted state
**When** I press Space or Enter
**Then** the row drops at its current position, lifted state ends, and aria-live announces "Row dropped at position [N]."

**Given** a row is in lifted state
**When** I press Escape
**Then** the row returns to its original position, lifted state ends, and aria-live announces "Move cancelled. Row returned to original position."

**Given** the user has `prefers-reduced-motion: reduce` enabled
**When** a drag settle or reorder occurs
**Then** the 150ms motion is disabled; the position change is instant

**Given** I reorder todos and close the tab
**When** I return to the app the next day
**Then** the list is displayed in the order I chose — sortOrder is persisted and restored

---

## Epic 5: Quality Assurance & Launch Readiness

The system passes all quality gates — automated accessibility audit clean, cross-browser smoke tests at 7 viewport widths, performance benchmarks (TTI, FCP, CRUD latency), backend test coverage (≥ 80%), and full FR-to-code traceability — making it release-ready.

### Story 5.1: Backend Test Coverage & Code Quality

As a developer,
I want the backend to have comprehensive tests and pass all code quality checks,
So that persistence logic is reliable and the codebase meets the project quality bar.

**Acceptance Criteria:**

**Given** the backend test suite runs
**When** I execute `npm test` in the backend directory
**Then** all tests pass, covering: session middleware (cookie creation, existing cookie reading, session isolation), all 6 route handlers (GET, POST, PATCH toggle, PATCH reorder, DELETE single, DELETE all), input validation (empty, whitespace, over-length), error responses (404, 400, 500), and error handler logging

**Given** the test suite completes
**When** I check code coverage
**Then** line coverage is ≥ 80% on `backend/src/routes/` and `backend/src/middleware/`

**Given** the backend codebase
**When** I run the linter
**Then** zero warnings are produced

**Given** the backend codebase
**When** I run the TypeScript type checker in strict mode
**Then** zero type errors are produced

**Given** the backend is running with data
**When** the backend process restarts (container restart)
**Then** zero data is lost — all todos are intact on restart (PostgreSQL durability)

**Given** the data retention requirement (NFR-015)
**When** I inspect the project
**Then** a `scripts/cleanup-stale-sessions.ts` script exists that deletes sessions with no activity in 90 days, and the README documents the TTL policy

### Story 5.2: Accessibility Audit & Cross-Browser Verification

As a user with accessibility needs or a non-standard browser,
I want the app to pass automated accessibility checks and work across all supported browsers and viewports,
So that the app is usable for everyone on every device.

**Acceptance Criteria:**

**Given** the deployed application
**When** I run an automated axe-core or Lighthouse accessibility audit on all page states (loading, empty, with active items, with completed items, with failed items, with dialog open)
**Then** zero failures are reported

**Given** the app is loaded
**When** I perform all CRUD actions using keyboard only (Tab, Space, Enter, arrow keys, Escape)
**Then** every action is completable without a mouse: add (Enter), toggle (Space on checkbox), delete (Enter on delete button), reorder (Space to lift, arrows to move, Space to drop), clear-all (Enter on Clear all, Tab to confirm)

**Given** any interactive element
**When** it receives keyboard focus via Tab
**Then** a visible 2px --accent focus ring at 2px offset appears via :focus-visible

**Given** the OS-level `prefers-reduced-motion: reduce` is enabled
**When** I use the app
**Then** all 150ms motions (drag settle, dialog open/close) are disabled and the app remains fully functional

**Given** the deployed application
**When** I test on the last 2 versions of Chrome, Firefox, Safari, and Edge
**Then** the canonical flow (add → toggle → delete → reorder → clear-all) works correctly in each browser

**Given** the deployed application
**When** I sweep viewports at 320 / 375 / 414 / 768 / 1024 / 1440 / 1920 px
**Then** zero broken layouts, zero horizontal scroll, all text legible, and touch targets ≥ 44×44px on viewports ≤ 768px

**Given** the app is loaded on an iOS device
**When** I tap the input field
**Then** no zoom-on-focus occurs (root font size ≥ 16px on mobile per NFR-021)

### Story 5.3: Performance Verification & FR Traceability

As a reviewer,
I want to verify the app meets performance targets and every FR traces to code,
So that the BMAD methodology demonstration is complete and credible.

**Acceptance Criteria:**

**Given** the deployed application
**When** I run a Lighthouse mobile profile audit on broadband
**Then** time-to-interactive is ≤ 1.5s and first contentful paint of the list region is ≤ 800ms on warm cache

**Given** the deployed application
**When** I measure CRUD endpoint latency
**Then** p95 is ≤ 200ms on localhost for all endpoints

**Given** the app is running
**When** I perform any CRUD action (add, toggle, delete, reorder, clear-all)
**Then** the local UI updates within 50ms of the input event (optimistic UI)

**Given** the project artifacts
**When** I review the FR-to-code traceability
**Then** every FR (FR-001 through FR-029) is referenced by ≥ 1 story, and every story is referenced by ≥ 1 implementing commit, navigable in ≤ 3 hops

**Given** the project
**When** I check for artifact completeness
**Then** PRD, architecture document, epics list, stories, and retrospective all exist and are non-empty

**Given** the frontend codebase
**When** I run the linter and type checker
**Then** zero warnings and zero type errors are produced
