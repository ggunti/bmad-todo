---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain (skipped — low-complexity general domain)
  - step-06-innovation (skipped — no genuine innovation signals; project is intentionally non-novel)
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
status: complete
completedAt: 2026-05-01
inputDocuments:
  - _bmad-output/planning-artifacts/prd-input-draft.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
  otherInputs: 1
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
discoveryDecisions:
  mobileStrategy: responsive_web_only
  persistenceModel: backend_persistent_anonymous_cookie
  authentication: none_in_v1
visionInsights:
  purpose: learning_teaching_exercise
  purposeSubFlavor: c-i_bmad_methodology_demo
  vision: >-
    A small, complete, full-stack todo web app that demonstrates how to build a
    real product end-to-end — fast, clean, responsive — without the bloat of
    feature creep. The product is the medium; the methodology (BMAD) is the
    message.
  differentiator:
    - zero_friction_interaction
    - genuine_responsive_design
  coreInsight: >-
    A todo app's value isn't features — it's friction. Scope discipline is the
    primary virtue; the smallest possible app done well beats a feature-heavier
    one done poorly.
workflowType: prd
---

# Product Requirements Document - todo-bmad

**Author:** Guntter
**Date:** 2026-05-01

## Executive Summary

`todo-bmad` is a deliberately minimal full-stack todo web application built as the deliverable for an end-to-end demonstration of the BMAD agile-AI methodology. A single anonymous user can create, view, complete, and delete personal tasks; the backend persists each user's list under an anonymous browser cookie so todos survive across sessions without authentication. The first version intentionally excludes accounts, collaboration, prioritization, deadlines, and notifications — scope discipline is treated as a feature, not a limitation.

The target user of v1 is the project's own author and reviewers, not a market segment. Success is judged by whether the resulting product, codebase, and accompanying BMAD planning artifacts (PRD → epics → stories → code) demonstrate that the methodology produces a small, working, traceable system end-to-end. The implicit secondary audience is anyone evaluating BMAD as a process, who can read the artifacts and the code together as a worked example.

The problem being solved is methodological, not productivity. Most "build a todo app" tutorials skip everything that matters in real software (responsive design, error handling, persistence, traceability from requirement to code), and most BMAD walkthroughs skip everything that matters in real products (a working artifact at the end). This project closes both gaps by holding the product scope down so the full BMAD loop can be exercised in detail without the artifact becoming noise.

### What Makes This Special

The differentiator versus a typical 5-minute-tutorial todo app is execution quality on two specific axes, chosen as the bar to meet:

1. **Zero-friction interaction.** The list is visible immediately on page load with no perceptible wait; add, complete, and delete are reflected instantly in the UI; no spinner appears for any normal action. The user-experience contract is "open → see → act → done," and every other product decision serves it.
2. **Genuine responsive design.** The UI is intentional and pleasant on every viewport from small phone to wide desktop, not merely "doesn't break on mobile." Layout, type sizing, touch targets, and spacing are designed for each form factor rather than scaled.

The differentiator versus a typical BMAD methodology walkthrough is that the artifact at the end is a working, deployable, end-user-usable product — not just a stack of planning documents. The PRD, epics, stories, architecture, and code are all part of the same chain of evidence and remain traceable to one another.

**Core insight:** A todo app's value is not measured in features; it is measured in friction. The smallest possible product, executed well, beats a feature-heavier one executed poorly. The methodology being demonstrated only earns its keep if the product it produces honors that insight.

## Project Classification

| Dimension | Value |
|---|---|
| **Project Type** | `web_app` (responsive, full-stack, browser-only — no native or PWA in v1) |
| **Domain** | `general` (consumer / personal productivity; no regulated-industry constraints) |
| **Complexity** | `low` (CRUD on one entity; no auth; no integrations; intentionally minimal MVP) |
| **Project Context** | `greenfield` (no existing codebase, project documentation, or installed users) |
| **Mobile strategy** | Responsive web only |
| **Persistence model** | Backend-managed, durable across sessions, scoped by anonymous browser cookie (no authentication in v1) |
| **Primary purpose** | BMAD methodology demonstration (learning/teaching exercise — c-i) |

## Success Criteria

### User Success

The single anonymous user is the project's author and any reviewer who opens the deployed app. Success is binary on each of these and judged at v1 release:

- **First-visit task completion (no guidance):** A first-time visitor can complete all four core actions — view the list, add a todo, mark a todo complete, delete a todo — without reading any instructions, on first visit.
- **Perceived snappiness:** No user-visible spinner appears on add, complete, or delete. The UI reflects every CRUD action within 100 ms of input.
- **Cross-session continuity:** Closing the tab and reopening it (same browser, cookie intact) within 24 hours restores the full todo list.
- **Cross-device consistency of look-and-feel:** The app is usable and feels intentional on phone (320–414 px), tablet (768–1024 px), and desktop (1280 px+) widths — no broken layouts, no horizontal scroll, no microscopic touch targets.

### Methodology & Demonstration Success

Because the primary purpose is BMAD demonstration (c-i), the deliverable includes the artifact chain, not just the code. Success criteria for the methodology demo:

- **Artifact completeness:** PRD, architecture document, epics list, stories, and end-of-project retrospective all exist and are non-empty.
- **End-to-end traceability:** Every FR has a unique ID; each FR is referenced by ≥ 1 story; each story is referenced by ≥ 1 implementing commit. A reviewer can trace any FR to the implementing code in ≤ 3 hops.
- **Reproducible from artifacts:** A reviewer who has never seen the project can install and run the app locally from the README in ≤ 10 minutes on a stock dev machine.
- **Honest scope discipline:** Nothing outside the documented MVP scope appears in the v1 codebase. Out-of-scope items remain out of scope; if any are added, it is via an explicit, documented scope-change in the PRD.

### Technical Success

- **Initial load (cold cache, broadband):** Time-to-interactive ≤ 1.5 s on a mid-range device (Lighthouse mobile profile, broadband network).
- **List visible (warm cache):** First contentful paint of the list region ≤ 800 ms.
- **CRUD round-trip latency:** p95 ≤ 200 ms on localhost; p95 ≤ 500 ms on the deployed environment.
- **Optimistic UI:** All CRUD actions update the local UI immediately (within 50 ms of input) and reconcile silently with the server response. Server failure rolls back the optimistic update with a clear, non-blocking error indicator.
- **Persistence durability:** Zero data loss across a backend process restart during normal operation. After tab close + 24 h, 100% of todos restored on reopen with the same cookie.
- **Error handling:** Both client and server return clear, user-readable error states for network failure, server failure, and invalid input. No silent failures, no raw stack traces shown to the user.
- **Browser support:** Functional on the last 2 versions of Chrome, Firefox, Safari, and Edge. Verified manually before release.
- **Accessibility (automated baseline only):** Keyboard-only operation supports all CRUD actions; visible focus state on all interactive elements; semantic HTML; zero failures on an automated audit (axe or Lighthouse a11y). This is **not** a claim of full WCAG 2.1 AA compliance — only that the automated audit is clean.
- **Code quality bar:** Linter clean (zero warnings), type checker clean (zero errors), tests pass in CI; meaningful test coverage on backend persistence logic (specific % deferred to architecture step).

### Measurable Outcomes

| # | Outcome | Measurement | Threshold |
|---|---|---|---|
| SC-1 | First-visit task completion | Self-test by author + ≥ 1 reviewer | All four CRUD actions completed unaided |
| SC-2 | Perceived UI latency | Manual timing / DevTools Performance | < 100 ms from input to UI update on add/complete/delete |
| SC-3 | Cross-session restore | Manual test (close tab → reopen 24 h later) | 100% of todos restored |
| SC-4 | Responsive layout integrity | Manual viewport sweep at 320/375/414/768/1024/1440/1920 px | Zero broken layouts; zero horizontal scroll; touch targets ≥ 44×44 px on mobile |
| SC-5 | Initial load TTI | Lighthouse mobile profile, broadband | ≤ 1.5 s |
| SC-6 | CRUD latency p95 | Server logs / load test | ≤ 200 ms localhost; ≤ 500 ms production |
| SC-7 | Persistence durability | Backend restart test during normal use | Zero data loss |
| SC-8 | Accessibility (automated) | axe or Lighthouse a11y audit | Zero failures (not full WCAG AA) |
| SC-9 | Browser support | Manual smoke test on last 2 versions of Chrome/Firefox/Safari/Edge | All four browsers pass smoke test |
| SC-10 | Artifact completeness | File presence check | PRD, architecture, epics, stories, retrospective all present and non-empty |
| SC-11 | FR-to-code traceability | Manual review | Every FR ID resolves to ≥ 1 story; every story resolves to ≥ 1 commit; ≤ 3 hops to code |
| SC-12 | README install time | Reviewer test | App running locally via `docker-compose up` in ≤ 10 minutes |

## Product Scope

### MVP — Minimum Viable Product

The shippable v1. Everything below must work to call the product "done":

- View the list of todos (active + completed visible together; completed visually distinguishable from active).
- Add a new todo (free-text description; max 1024 characters; empty/whitespace-only submissions rejected).
- Toggle a todo's completion status.
- Delete a single todo.
- **Reorder todos** via drag-and-drop on pointer devices, with equivalent keyboard semantics on the drag handle. The user-chosen order is persisted to the backend and restored on subsequent visits. New todos default to the top of the list.
- **Clear-all-todos action** — a single user-initiated action (with confirmation dialog) that empties the user's todo list on the server. Does not invalidate the session cookie. Available from the main todo view.
- Persistence via backend, scoped by anonymous browser cookie, durable across sessions for ≥ 24 h.
- Empty state when no todos exist.
- Loading state on initial cold-start fetch only (no spinners on subsequent CRUD).
- Error state when backend is unreachable or returns failure (non-blocking, clear, recoverable).
- Responsive layout across phone / tablet / desktop.
- Modern-browser support (last 2 versions of Chrome, Firefox, Safari, Edge).
- Baseline accessibility (keyboard-operable, visible focus, semantic HTML, axe-clean — not full WCAG AA).
- **Deployable via Docker Compose** — application and any required services orchestrated in a single `docker-compose up` from the README. Reviewer install path target: ≤ 10 minutes.
- README that lets a reviewer run the app locally in ≤ 10 minutes.

### Growth Features (Post-MVP)

Items deferred from v1 but on the natural growth path. Listed for traceability; not committed:

- Real authentication (email/password or social) and per-account todos.
- Multi-device sync per authenticated account.
- Edit todo text after creation.
- Search / filter (active / completed / all).
- Bulk actions beyond clear-all (e.g., bulk complete, bulk delete by selection).
- Tags or simple categories.
- Keyboard shortcuts beyond the baseline.
- PWA installability with offline-first behavior.

### Vision (Future)

Long-horizon items, included only to bound the design conversation:

- Multi-user collaboration on shared lists.
- Deadlines, reminders, scheduled notifications.
- Recurring todos.
- Native mobile apps.
- Third-party integrations (calendar, email, chat).
- AI-assisted task capture, suggestion, or planning.

## User Journeys

### Persona 1 — Lina, the First-Time Visitor

**Profile:** A general internet user who landed on the deployed `todo-bmad` URL — from a friend, a portfolio link, or curiosity. She has no account anywhere on this site, no expectations, and no patience for setup.

**Story:**

- **Opening scene.** Lina opens the URL. Within ≤ 1.5 s she sees a clean page with a clear empty state ("No todos yet — add your first one") and a focused text input with an obvious "Add" affordance.
- **Rising action.** She types "buy bread" and hits Enter. The todo appears instantly in the list — no spinner. She types "call mom" → Enter. She clicks the checkbox next to "buy bread"; it's immediately styled as completed (strikethrough, dimmed). She clicks the × next to "call mom"; it disappears instantly.
- **Climax.** She didn't read any instructions. She didn't sign up. She didn't wait. She added, completed, and deleted todos in under 30 seconds.
- **Resolution.** She closes the tab, satisfied.

**Capabilities revealed:** view list, empty state, add todo (input focused on load, submit via Enter or button), optimistic UI, toggle complete, completed/active visual distinction, delete single todo.

### Persona 1 — Lina, Returning the Next Day

**Story:**

- **Opening scene.** Lina remembers she had a few things to track. She opens the same URL on the same browser the next morning.
- **Rising action.** Within ≤ 1.5 s the list loads with her remaining todos from yesterday plus one she added in the evening ("schedule dentist"). She didn't log in. She didn't recover anything.
- **Climax.** It just remembered. She marks "schedule dentist" complete after actually doing it.
- **Resolution.** She closes the tab again, this time with the small confidence that the app is reliable.

**Capabilities revealed:** anonymous-cookie session restoration, persistence durability across sessions (≥ 24 h), no-auth UX continuity.

### Persona 1 — Lina, Recovering from a Network Error

**Story:**

- **Opening scene.** Lina is on the train; her connection is flaky. She opens the app — the page loads but the list area shows a clear, non-blocking error state ("Couldn't load your todos — check your connection") with a Retry control.
- **Rising action.** She tries to add "pick up dry cleaning" anyway. The optimistic UI puts it in the list immediately. A moment later the backend save fails; the item is rolled back with a non-blocking inline message indicating the save failed and inviting her to try again when she's online. No modal, no app crash.
- **Climax.** Connection comes back. She re-attempts the action; the todo saves successfully this time.
- **Resolution.** No data lost. No confused error dialog. She trusts the app more than she did 30 seconds ago.

**Capabilities revealed:** cold-start error state with retry, optimistic-UI rollback on backend failure, non-blocking per-item failure indication, graceful degradation when the backend is unreachable.

### Persona 1 — Lina, Doing a Clean Slate

**Story:**

- **Opening scene.** Lina has accumulated 14 stale todos from a past project and wants a fresh list — without messing with browser settings.
- **Rising action.** She finds a "Clear all" action (subtle, in the list controls, not in the way of normal use). She clicks it. A confirmation dialog appears: "This will delete all 14 todos. This cannot be undone." Two buttons: Cancel (default focus) and Clear all.
- **Climax.** She confirms. The list empties to the empty state. The session cookie is unchanged — same session, just cleared content.
- **Resolution.** She starts over with a clean list.

**Capabilities revealed:** clear-all action with destructive-action confirmation dialog; data reset is decoupled from session reset (cookie persists, todos cleared).

### Persona 2 — Marco, the BMAD-Evaluating Reviewer

**Profile:** A senior engineer pointed at this project to evaluate whether the BMAD methodology actually produces real software. He has ~15 minutes. He's done dozens of these reviews and is skeptical of methodology demos that ship a slide deck and zero working code.

**Story:**

- **Opening scene.** Marco clones the repo and opens the README.
- **Rising action.** The README tells him exactly two things to do: (1) `docker-compose up`, (2) open the local URL. He runs the command. Within minutes the stack is up. He opens the browser, runs Lina's happy path himself in under 30 seconds — no friction.
- **Climax.** He flips back to the project files. PRD, architecture, epics, stories, retrospective — all present and substantive. He picks a random FR ID, follows it to a story, follows the story to an implementing commit, opens the commit, sees the actual code. Three hops.
- **Resolution.** Whether or not he buys BMAD as a methodology, he can't dismiss the artifact: it ran, it works, and the paper trail holds up.

**Capabilities revealed:** Docker Compose deployment, README runnability (≤ 10 min reviewer install path), FR-to-code traceability chain, artifact completeness. These are project-level deliverables, not product features — but they are real requirements the v1 must meet.

### Journey Requirements Summary

Capabilities surfaced by the journeys, organized by area. Each is formalized as one or more numbered FRs in the *Functional Requirements* section (FR-001 through FR-029).

| Capability area | What journeys imply |
|---|---|
| **List rendering** | Show all todos; visually distinguish completed vs active; empty state when none; loading state only on initial cold fetch; error state when backend is unreachable |
| **Add todo** | Free-text input, focused on load; submit via Enter or button; appears in list with optimistic UI; backend persists |
| **Toggle complete** | Single click/tap; instant visual update; backend persists |
| **Delete todo** | Single click/tap on delete control; instant removal; backend persists |
| **Clear all** | Discoverable but non-intrusive control; confirmation dialog (destructive-action pattern); backend empties the list; cookie unchanged |
| **Session & persistence** | Anonymous browser cookie identifies user; backend stores todos keyed by cookie; full list restored on next visit (≥ 24 h) |
| **Optimistic UI + rollback** | Every CRUD action updates UI within 50 ms; on backend failure the change is rolled back with a non-blocking inline indication + retry path |
| **Responsive design** | Usable layout on phone / tablet / desktop; touch targets ≥ 44 × 44 px on mobile; no horizontal scroll at any tested width |
| **Deployment & reviewability** | `docker-compose up` brings up the full stack; README provides install + run path in ≤ 10 min; FR → story → code chain is reviewable in ≤ 3 hops |

## Web App Specific Requirements

### Project-Type Overview

`todo-bmad` is a **single-page web application** with a client-side rendered SPA frontend and a JSON HTTP backend. There is one user-facing route (the todo list); no multi-page navigation, no client-side routing complexity, no server-rendered HTML beyond the initial app shell. The frontend communicates with the backend via a small JSON REST API. Sessions are identified by an HTTP-only anonymous cookie set by the backend on first visit.

Out of scope (per `web_app` skip-sections and project intent):

- Native device features (camera, geolocation, push notifications, etc.).
- CLI commands or non-browser interfaces.
- Multi-tab live synchronization (deferred to Growth).
- Service worker / offline-first behavior (deferred to Growth as PWA).

### Architecture Style — SPA, Not MPA

- **SPA** (single-page application): one HTML shell + JS bundle; all interactivity is client-side. CRUD actions hit the backend asynchronously and update the UI without page reloads.
- Rationale: SC-2 (input-to-UI < 100 ms with no spinner) requires asynchronous CRUD with optimistic UI, which is incompatible with a server-rendered MPA's full-page reload model.
- Server-side rendering (SSR) is **not required** for v1 (no SEO, no first-paint criticality beyond TTI ≤ 1.5 s).

### Browser Support Matrix

| Engine | Versions supported | Verification |
|---|---|---|
| Chromium (Chrome, Edge, Brave) | Last 2 stable major versions | Manual smoke test pre-release |
| Gecko (Firefox) | Last 2 stable major versions | Manual smoke test pre-release |
| WebKit (Safari, iOS Safari) | Last 2 stable major versions | Manual smoke test pre-release |

Out of support: IE 11, legacy Edge (EdgeHTML), Opera Mini, older mobile browsers. Samsung Internet is untested but expected to work as a Chromium derivative.

### Responsive Design

- **Breakpoint targets** (manual visual sweep before release): 320 px, 375 px, 414 px, 768 px, 1024 px, 1440 px, 1920 px.
- **Touch targets:** minimum 44 × 44 CSS pixels for any tap target on viewports ≤ 768 px wide.
- **Type sizing:** root font size ≥ 16 px on mobile (prevents iOS Safari zoom-on-focus for inputs).
- **No horizontal scroll** at any tested width.
- **Layout strategy:** mobile-first CSS; deliberate (not auto-scaled) layout decisions for each breakpoint range. The mobile layout is the canonical layout, with desktop adding generous whitespace, not added complexity.
- Specific design decisions (typography, color system, spacing scale, component sizes) are deferred to the UX design step.

### Performance Targets

Performance targets are defined in *Success Criteria* (SC-5, SC-6) and restated with IDs as NFR-001 through NFR-004; not duplicated here. Architecture decisions for this project type must demonstrably meet those targets.

JS bundle size and number of initial HTTP requests are intentionally not constrained at the PRD level; they are architecture-step concerns and will be governed by the framework choices made there, subject only to meeting the TTI and FCP targets cited above.

### SEO Strategy

Minimal — the app is a single-user session-bound CRUD UI with no public content. Requirements:

- `<title>` and `<meta name="description">` set with sensible default values (e.g., "todo-bmad — a minimal todo app").
- `<link rel="icon">` (favicon).
- OpenGraph and Twitter Card meta tags for clean link previews when the URL is shared (recommended, since this is also a portfolio piece).
- `<meta name="robots" content="noindex, nofollow">` — the page contents are user-specific UI, not content worth indexing.
- No sitemap, no structured data, no SEO-driven URL structure.

### Accessibility Level

Web-app-specific accessibility expectations, building on SC-8 and NFR-016 / NFR-017 / NFR-018:

- Semantic HTML (`<button>`, `<input>`, proper `<ul>` / `<li>` for the list, etc.); avoid div-soup.
- ARIA used only where semantic HTML is insufficient.
- Reorder mechanism (FR-014) provides keyboard semantics on the drag handle in addition to pointer-based drag-and-drop.

Quantitative accessibility targets and the "not full WCAG 2.1 AA" framing live in SC-8 and NFR-018; not duplicated here.

### Implementation Considerations

- **Frontend framework:** TBD in architecture step. Constraints: must support efficient rendering of an in-memory list, a small JS footprint, and good DX. (No specific framework named here on purpose — this is a PRD, not the architecture.)
- **Backend framework + data store:** TBD in architecture step. Constraints implied by SC-6, SC-7, and the deployment requirement: must run inside a container under Docker Compose, must persist durably across container restart, must respond to JSON requests with low latency.
- **Cookie:** posture defined in NFR-008 / NFR-009. The opaque session identifier is suggested to be a UUID or equivalent; final form is an architecture-step decision.
- **Multi-tab assumption:** v1 assumes one tab per user. A second tab opened simultaneously is not guaranteed to live-sync; reloading the tab fetches the current state. Multi-tab live sync is deferred to Growth.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP type:** **Experience MVP**, with a secondary platform-MVP element.

- *Experience MVP* (primary): The MVP delivers a single, polished interaction loop — open the app, see your todos, add/complete/delete instantly, come back tomorrow and they're still there. Quality of that loop is the deliverable. This is consistent with the differentiators (zero-friction interaction, genuine responsive design) and with the "purpose is methodology demo" framing — a polished MVP loop is what makes the demo credible.
- *Platform MVP* (secondary): The architecture is built so that the natural Phase 2 additions (real auth, multi-account todos, multi-tab sync) can layer on without rewriting the core data model or API surface. Anonymous-cookie scoping is chosen partly for this reason — the cookie value can later be replaced by an authenticated user ID with no schema change to the todo entities.

This is **not** a problem-solving MVP (there is no novel problem being solved — todo apps are a saturated category). It is **not** a revenue MVP (there is no revenue model). Calling it the wrong type of MVP would lead to wrong scope decisions later.

**MVP success contract** — the MVP is "done" when, simultaneously:

1. All twelve Measurable Outcomes (SC-1 through SC-12) are met.
2. Every item in the Product Scope > MVP list is implemented and reachable from the deployed UI.
3. Nothing outside that MVP list is implemented, except as an explicit, documented scope-change addendum to this PRD.

### Resource Posture

- **Team:** Solo developer (project author) with AI-agent assistance via the BMAD workflow.
- **Implication for scope:** No parallel work streams. Each epic/story is executed sequentially. This makes scope creep the single biggest schedule risk, because every added scope item directly extends the linear timeline.
- **Implication for quality bar:** The named differentiators (zero-friction UX, responsive design) are non-negotiable; everything not on the differentiator list defaults to "good enough to pass the success criteria, no further polish."

### Phased Roadmap

**Phase 1 — MVP.** See *Product Scope > MVP — Minimum Viable Product* for the feature list. Rationale: deliver the experience MVP loop end-to-end, prove the methodology produces a working artifact. This is the only phase committed in v1.

**Phase 2 — Growth (post-MVP).** See *Product Scope > Growth Features (Post-MVP)*. Not committed in v1. Listed for traceability so that architecture decisions in v1 don't accidentally close the door on these.

**Phase 3 — Vision (future).** See *Product Scope > Vision (Future)*. Strictly directional; informs nothing about v1 architecture other than "don't make it impossible."

### Risk Analysis & Mitigation

| Risk class | Specific risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **Scope creep** | Solo author adds "just one small feature" mid-build (edit-todo, filtering, tags, etc.), expanding linear timeline. | High | High | Strict adherence to the MVP success contract above. Any addition requires an explicit, documented scope-change addendum to this PRD before code is written. |
| **Technical — optimistic UI** | Optimistic UI + rollback is harder to get right than it looks under network-error conditions; bugs here directly hit SC-2 and the network-error journey. | Medium | Medium | Cover it with explicit acceptance criteria on the FRs; include a story specifically for the "save-failed rollback + retry" path; manual flaky-network testing pre-release. |
| **Technical — persistence durability** | Backend restart during development could appear to "lose" data; harder to debug if the failure is silent. | Medium | Medium | SC-7 explicitly tested by manual restart; backend writes use a durable store (filesystem-backed or DB-backed, decided in architecture); no in-memory-only stores in production config. |
| **Technical — responsive at extremes** | Layouts that look great at 375 px and 1440 px frequently break at 320 px or 1920 px. | Medium | Medium | Manual sweep at all 7 breakpoints from SC-4 is part of the release checklist; add automated viewport screenshot checks if cheap (architecture-step decision). |
| **Technical — framework rabbit-hole** | Solo dev gets deep into framework-comparison or build-tool tweaking; methodology demo stalls. | Medium | High | Architecture step is timeboxed; default to boring, well-known choices for both frontend and backend; defer all "shiny" tech choices to Phase 2 unless explicitly required by a Phase 1 success criterion. |
| **Methodology / demo (substitutes for "market" risk)** | The artifact chain (PRD → epics → stories → code) has gaps or contradictions; reviewer (Marco persona) can't actually trace from FR to code. | Medium | High | SC-10 and SC-11 are checked at release. Each story file is required to reference its source FR(s). Each commit message is required to reference its story. Pre-release retrospective explicitly audits one random FR end-to-end. |
| **UX polish overshoot** | Solo dev spends time polishing UI details (animations, micro-interactions, custom illustrations) that don't move the named differentiators. | Medium | Medium | "Good enough to pass success criteria" is the explicit default for everything not on the differentiator list. Any time spent on extra-polish must be justified against a specific success criterion. |
| **Resource — time drift** | Project loses momentum, sits half-built. | Medium | High | Sequential epics with explicit done criteria; smallest-possible MVP scope (already chosen) makes the finish line achievable. Phase 1 completion is the definition of "v1." |

## Functional Requirements

### Todo Viewing & List State

- **FR-001:** User can view their current list of todos in a single view (active and completed todos shown together in one list).
- **FR-002:** Completed todos are visually distinguished from active todos in the list.
- **FR-003:** List items appear in the order chosen by the user (see FR-014). New todos are inserted at the top of the list by default.
- **FR-004:** List shows an empty-state message when the user has no todos.
- **FR-005:** List shows a loading state during the initial cold-start fetch only — not during subsequent CRUD operations.
- **FR-006:** List shows an error state when the backend is unreachable on initial load, with a retry control.

### Todo Creation

- **FR-007:** User can add a new todo by entering free-text and submitting.
- **FR-008:** New-todo submission is supported via the Enter key and via a visible Add control.
- **FR-009:** New-todo input field is focused automatically on initial page load.
- **FR-010:** New-todo submissions are validated before being accepted: (a) empty or whitespace-only content is rejected with a clear, non-blocking inline message, and (b) content exceeding 1024 characters is rejected with a clear, non-blocking inline message indicating the limit.

### Todo Modification, Reordering & Deletion

- **FR-011:** User can toggle a todo between completed and active state.
- **FR-012:** User can delete a single todo.
- **FR-013:** User can clear all of their todos (active and completed) in a single action.
- **FR-014:** User can reorder their todos via drag-and-drop on pointer devices, with equivalent keyboard semantics on the drag handle (focus an item, Space/Enter to pick up, arrow keys to move, Space/Enter to drop). Specific UI affordances and visual treatment are defined in the UX design step.
- **FR-015:** Clear-all action requires explicit confirmation via a destructive-action confirmation dialog with non-destructive default focus (Cancel focused by default).

### Optimistic UI & Failure Handling

- **FR-016:** All CRUD actions (add, toggle, delete, reorder, clear-all) update the local UI immediately upon user input, without waiting for the backend response.
- **FR-017:** When a backend operation fails, the corresponding optimistic UI change is rolled back and the failure is surfaced to the user as a non-blocking, per-item (or per-action) indication.
- **FR-018:** User can manually retry a failed CRUD operation without re-entering data.

### Session & Persistence

- **FR-019:** Backend assigns each new visitor an opaque, anonymous session identifier persisted as an HTTP-only cookie on first visit.
- **FR-020:** Backend persists each user's todo list — including each todo's completion state and the user's chosen order — keyed by their session identifier.
- **FR-021:** User's todo list (with completion state and chosen order) is restored on every subsequent visit within the same browser, for at least 24 hours after last activity.
- **FR-022:** Clear-all action empties the user's stored todos but does not invalidate the session identifier.
- **FR-023:** Backend supports concurrent independent anonymous users; each user's todos are fully isolated from every other user's todos.

### Page Metadata & Shareability

- **FR-024:** Application page exposes a `<title>`, `<meta name="description">`, and favicon.
- **FR-025:** Application page exposes OpenGraph and Twitter Card meta tags for clean link previews when the URL is shared.
- **FR-026:** Application page declares `<meta name="robots" content="noindex, nofollow">`.

### Deployment & Reviewability (Project-Level)

- **FR-027:** System is deployable via a single `docker-compose up` invocation.
- **FR-028:** Project README documents a step-by-step install + run path completable in ≤ 10 minutes by a developer who has never seen the project.
- **FR-029:** Each FR in this PRD has end-to-end traceability to ≥ 1 implementing story and ≥ 1 implementing commit, navigable in ≤ 3 hops.

## Non-Functional Requirements

NFRs are intentionally selective — categories that don't apply to v1 are omitted (see *NFR Categories Intentionally Omitted* at the end of this section). Many NFRs cross-reference numeric thresholds already defined in *Success Criteria*; that section remains the single source of truth, and this section restates each constraint with an NFR ID for traceability.

### Performance

- **NFR-001 — Initial load time-to-interactive.** The deployed application must reach time-to-interactive within ≤ 1.5 s on a Lighthouse mobile profile, broadband network, on a mid-range device. *(Source: SC-5.)*
- **NFR-002 — List visibility.** The list region must reach first contentful paint within ≤ 800 ms on a warm cache. *(Source: Technical Success.)*
- **NFR-003 — CRUD round-trip latency.** All CRUD endpoints must respond at p95 ≤ 200 ms on localhost and p95 ≤ 500 ms in production. *(Source: SC-6.)*
- **NFR-004 — Optimistic UI latency.** Local UI updates for any CRUD action must occur within 50 ms of the user input event. *(Source: Technical Success.)*

### Reliability & Persistence

- **NFR-005 — Persistence durability.** Zero data loss across normal-operation backend process restart. *(Source: SC-7.)*
- **NFR-006 — Cross-session restore.** User's full todo list (with completion state and chosen order) must be restored on every subsequent visit within at least 24 hours of last activity. *(Source: SC-3.)*
- **NFR-007 — Graceful degradation.** When the backend is unreachable, the application must show a clear, non-blocking error state and allow the user to retry without a full page reload. *(Source: FR-006, FR-017, FR-018.)*

### Security

- **NFR-008 — Transport.** All production traffic must be served over HTTPS. The session cookie must be marked `Secure` in production.
- **NFR-009 — Cookie posture.** Session cookie must be `HttpOnly`, `SameSite=Lax`, and contain only an opaque, server-generated identifier (no PII, no client-readable data).
- **NFR-010 — Input handling (XSS).** All user-supplied todo text is stored and rendered in a way that prevents script injection: the server never concatenates user text into HTML; the client always treats stored todo text as data, not markup.
- **NFR-011 — CSRF protection.** State-changing API endpoints (POST/PATCH/PUT/DELETE) must be protected against cross-site request forgery. The `SameSite=Lax` cookie posture provides the baseline protection; whether an additional CSRF-token mechanism is required is decided in the architecture step based on the chosen framework's defaults.
- **NFR-012 — Server-side validation.** All input validation enforced on the client (FR-010: empty rejection, max length 1024) must also be enforced on the server. The client-side validation is for UX; the server-side validation is the authority.

### Privacy

- **NFR-013 — Data minimization.** The system stores only what is necessary: the opaque session identifier and the user's todo entities (text, completion state, order). No browser fingerprinting, no IP-address logging beyond standard server access logs, no analytics, no tracking pixels, no third-party scripts.
- **NFR-014 — Cookie disclosure.** The application must include a brief, plain-language disclosure of what the session cookie is and what it stores, accessible from a footer link or equivalent. (Not a full GDPR consent banner — the cookie is strictly functional/necessary, not analytics or marketing.)
- **NFR-015 — Data retention.** User todo data is retained as long as the session cookie is active and re-presented. Idle data older than **90 days** since last activity may be purged by the backend. The TTL must be documented in the README and architecture.

### Accessibility

- **NFR-016 — Keyboard operability.** Every CRUD action (add, toggle, delete, reorder, clear-all) is fully operable using a keyboard alone, including reorder via the documented keyboard semantics on the drag handle (FR-014). *(Source: SC-8.)*
- **NFR-017 — Visible focus.** All interactive elements must show a clearly visible focus state when focused, distinguishable from non-focused state. No `outline: none` without an equivalent visible alternative. *(Source: SC-8.)*
- **NFR-018 — Automated audit clean.** The deployed application must produce zero failures on an automated accessibility audit (axe-core or Lighthouse a11y). This is **not** a claim of full WCAG 2.1 AA compliance. *(Source: SC-8.)*

### Browser Compatibility

- **NFR-019 — Supported engines.** The application must function correctly on the last 2 stable major versions of Chromium-based browsers (Chrome, Edge, Brave), Gecko (Firefox), and WebKit (Safari, including iOS Safari). *(Source: SC-9.)*
- **NFR-020 — Viewport range.** The application must render and function across viewports from 320 px to 1920 px wide with no horizontal scroll; touch targets must be ≥ 44 × 44 CSS pixels on viewports ≤ 768 px. *(Source: SC-4.)*
- **NFR-021 — Mobile type-size minimum.** Root font size must be ≥ 16 px on mobile viewports to prevent iOS Safari zoom-on-focus for text inputs.

### Maintainability

- **NFR-022 — Linter clean.** The codebase must produce zero linter warnings in CI for both frontend and backend. *(Source: Technical Success.)*
- **NFR-023 — Type checker clean.** If a static type checker is used (decided in the architecture step), the codebase must produce zero type errors in CI. *(Source: Technical Success.)*
- **NFR-024 — Test coverage on persistence.** Backend persistence logic must have meaningful unit and/or integration test coverage. Specific percentage threshold deferred to the architecture step.
- **NFR-025 — Traceability hygiene.** Every story file references its source FR(s); every commit message references its story. *(Source: SC-11, FR-029.)*

### Observability

- **NFR-026 — Server error logging.** The backend must log all unhandled exceptions and 5xx responses with enough context (request path, session identifier hash if applicable, stack trace) to debug post-hoc. Logs are written to standard output / stderr (container-friendly).
- **NFR-027 — No client telemetry.** No analytics, no performance beacons, no third-party error-reporting services that send data off the user's machine. Client errors surface in the browser console only. (Deliberate, consistent with NFR-013.)

### Portability & Deployment

- **NFR-028 — Container-only deployment.** The application and any required services run as containers orchestrated by Docker Compose. The system must not require installing language runtimes, databases, or other dependencies directly on the host. *(Source: FR-027, FR-028, SC-12.)*
- **NFR-029 — Configuration via environment.** All deployment-environment-specific configuration (ports, secrets, persistence paths, etc.) must be settable via environment variables. No hardcoded production values in code.

### NFR Categories Intentionally Omitted

The following NFR categories are explicitly omitted, with rationale, so their absence is deliberate rather than an oversight:

- **Scalability.** v1 is a single-user-anonymous demo app with no expected high-concurrency usage. Beyond "supports modest concurrent demo traffic without collapsing" (covered implicitly by NFR-003), scalability is not a v1 concern. Will be revisited if this ever becomes a real product.
- **Internationalization (i18n) / localization (l10n).** v1 is English-only. Multi-language support is a Growth-tier item.
- **Disaster recovery / formal backup.** v1 is a personal-use demo. The backend must not catastrophically lose data on restart (NFR-005), but no formal backup, RPO, or RTO targets are required.
- **Integration / external APIs.** v1 has no external system integrations.
- **Regulatory compliance (HIPAA, PCI-DSS, SOX, FedRAMP, etc.).** No regulated data is handled.
- **High availability / SLA.** v1 is a demo; no formal uptime SLA. Best-effort availability only.
