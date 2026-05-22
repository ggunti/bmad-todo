# Story 1.2: Page Metadata & Design System Foundation

Status: done

## Story

As a visitor sharing the app URL,
I want the page to have proper metadata and a cohesive visual foundation,
So that link previews display correctly and the app has a professional, consistent appearance from the start.

## Acceptance Criteria

1. **Given** the page is loaded, **When** I inspect the HTML head, **Then** I find a `<title>` (`todo-bmad`), `<meta name="description">`, and a `<link rel="icon">` (favicon).

2. **Given** the page URL is shared on a social platform, **When** the platform fetches metadata, **Then** OpenGraph (`og:title`, `og:description`, `og:type`) and Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`) meta tags provide a clean preview.

3. **Given** a search engine crawls the page, **When** it reads the meta tags, **Then** it finds `<meta name="robots" content="noindex, nofollow">`.

4. **Given** the app is loaded, **When** I inspect the CSS, **Then** Tailwind CSS is configured with all design tokens: 10 color custom properties (`--bg`, `--surface`, `--border`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--hairline`, `--accent`, `--warning`, `--warning-bg`), 4 type sizes (`--text-xs` 13px, `--text-sm` 14px, `--text-base` 16px, `--text-lg` 19px), 7 spacing tokens, `--radius-base` 6px, single shadow token, `--motion-duration` 150ms, `--motion-easing`, and focus ring (2px solid `--accent`, 2px offset via `:focus-visible`).

5. **Given** the app is loaded, **When** text renders, **Then** IBM Plex Sans (weights 400 and 500) loads via `<link rel="preload">` with `font-display: swap` and falls back to the system-font chain.

6. **Given** the app is loaded on a mobile viewport (`< 640px`), **When** I view the page, **Then** content is full-width with `--space-6` horizontal gutter and `--space-6` top padding.

7. **Given** the app is loaded on a desktop viewport (`>= 640px`), **When** I view the page, **Then** content is centered in a 640px max-width well with `--space-12` top padding and `--space-8` bottom padding.

8. **Given** the app shell renders, **When** I see the page, **Then** the Wordmark `todo-bmad` appears top-left of the content well as an `<h1>` in `--text-lg`, font-weight 500, `--accent` color.

9. **Given** motion is applied, **When** the user has `prefers-reduced-motion: reduce` enabled, **Then** all 150ms motion is disabled.

## Tasks / Subtasks

- [x] Task 1: Implement page metadata and social tags in frontend shell (AC: 1, 2, 3)
  - [x] Update `frontend/index.html` title to `todo-bmad`
  - [x] Add non-empty `<meta name="description">` appropriate for the app
  - [x] Add OpenGraph tags: `og:title`, `og:description`, `og:type`
  - [x] Add Twitter tags: `twitter:card`, `twitter:title`, `twitter:description`
  - [x] Add robots directive: `noindex, nofollow`
  - [x] Keep favicon reference valid and unchanged unless broken

- [x] Task 2: Add typography loading contract for IBM Plex Sans (AC: 5)
  - [x] Add preload links for IBM Plex Sans 400 and 500 in `frontend/index.html`
  - [x] Ensure CSS uses `font-display: swap` (Google Fonts URL parameter or self-hosted `@font-face`)
  - [x] Define and apply fallback stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

- [x] Task 3: Establish design-token foundation in CSS/Tailwind layer (AC: 4, 9)
  - [x] Add all required CSS custom properties to `frontend/src/index.css` as canonical token source
  - [x] Implement single shadow token, radius token, and motion tokens
  - [x] Add uniform `:focus-visible` style with 2px accent ring and 2px offset
  - [x] Add `@media (prefers-reduced-motion: reduce)` rule to disable motion token effects
  - [x] Remove conflicting starter-template visual system tokens/styles

- [x] Task 4: Build app shell layout and wordmark using tokenized styles (AC: 6, 7, 8)
  - [x] Replace starter Vite demo UI in `frontend/src/App.tsx` with minimal app shell
  - [x] Render `todo-bmad` wordmark as semantic `<h1>` in the content well
  - [x] Ensure mobile-first layout defaults to full width with `--space-6` gutter/top spacing
  - [x] Add desktop breakpoint (`min-width: 640px`) for centered 640px well, `--space-12` top, `--space-8` bottom
  - [x] Keep implementation simple and avoid introducing todo-list functionality from Epic 2+

- [x] Task 5: Integrate Tailwind foundation without violating architecture boundaries (AC: 4)
  - [x] Install and configure Tailwind CSS tooling for Vite in `frontend/` if not already present
  - [x] Wire Tailwind import directives in `frontend/src/index.css`
  - [x] Ensure design tokens remain the source of truth and no ad-hoc magic values are introduced
  - [x] Keep changes isolated to frontend shell and styling scaffold only

- [x] Task 6: Verification and regression checks (AC: 1-9)
  - [x] Run frontend lint and type-check/build successfully
  - [x] Manually verify head tags in browser devtools
  - [x] Validate mobile/desktop layout at `< 640px` and `>= 640px`
  - [x] Validate `:focus-visible` ring on keyboard focus
  - [x] Validate reduced-motion behavior by simulating OS preference
  - [x] Ensure backend/API/Docker behavior from Story 1.1 remains unaffected

## Dev Notes

### Story Intent and Scope Guardrails

- This story is foundation-only: metadata + design tokens + shell layout + wordmark.
- Do not implement todo CRUD features, list states, optimistic mutations, or API wiring in this story.
- Keep API and database layers untouched unless required for build integrity.

### Technical Requirements (Must Follow)

- Frontend stack remains Vite + React + TypeScript.
- Styling foundation must be Tailwind CSS with CSS custom properties as token source.
- Preserve naming conventions:
  - React components: PascalCase
  - Non-component TS files: kebab-case
  - Named exports only (except `App`)
- Keep all environment-specific values in env vars; no production constants hardcoded.

### Architecture Compliance Requirements

- Follow established monorepo boundaries: frontend-only files for this story.
- Respect single-route SPA architecture (no router introduction).
- Keep component structure simple and consistent with upcoming Epic 2 component expansion.
- Keep accessibility-first conventions in place (`:focus-visible`, keyboard-visible interaction states).

### Library & Framework Requirements

- Use architecture-locked versions/patterns as baseline:
  - React 19.x, Vite 8.x, Tailwind 4.2.x+ compatible setup.
- New package additions should be minimal and frontend-scoped.
- Avoid introducing UI component libraries for this story; use hand-rolled shell markup/styling.

### File Structure Requirements

- Expected touched files (minimum):
  - `frontend/index.html` (metadata, preload links)
  - `frontend/src/App.tsx` (wordmark + shell)
  - `frontend/src/index.css` (tokens, base styles, layout utilities)
- Possible additional files:
  - `frontend/package.json` (Tailwind dependencies/scripts)
  - Tailwind config file(s) if required by chosen Tailwind v4 setup
- Do not create new top-level directories.

### Testing Requirements

- Validate acceptance criteria via manual checks and frontend build/lint gates.
- Ensure no regressions to Story 1.1 deployability:
  - `docker compose up` path remains valid
  - app still served at `http://localhost:3001`
- Add automated tests only if lightweight and directly beneficial; this story primarily requires UI/head verification.

### Previous Story Intelligence (Story 1.1)

- Docker + backend + frontend scaffold already exists and is stable; build on it, do not re-scaffold.
- Express 5 catch-all route syntax and Prisma 7 setup were already adjusted for compatibility; avoid touching backend internals.
- `frontend/index.html` currently has placeholder title and default favicon wiring from Vite template; this is the correct target for metadata updates.
- Current `App.tsx` and `index.css` still include verbose Vite starter UI/styles; replace them with minimal shell styles rather than layering on top.
- Story 1.1 completion noted local Docker E2E verification as environment-dependent; avoid introducing changes that require backend contract updates for this story.

### Git Intelligence Summary

- Recent commits indicate a two-step pattern: story document commit, then implementation commit and merge PR.
- Story 1.1 implementation touched many scaffold files; for Story 1.2 keep blast radius intentionally small and frontend-centric.
- Existing conventions prioritize explicit architecture notes in story docs and clear acceptance-driven task mapping.

### Latest Tech Information (Web-Verified on 2026-05-22)

- React latest stable is `19.2.6`; project currently uses `^19.2.5` and is compatible.
- Vite latest stable reported around `8.0.12+`; project currently uses `^8.0.10` and remains within same major line.
- Tailwind latest stable reported as `4.3.0`; architecture lock references `4.2.4`. Implement within architecture constraints unless an explicit upgrade decision is made.
- Developer guidance: prioritize architecture-locked consistency over opportunistic upgrades in this story.

### Risk & Anti-Pattern Prevention

- Do not leave default Vite demo artifacts in UI (`reactLogo`, `viteLogo`, counter interactions).
- Do not mix multiple token systems; new tokens should replace template variables as canonical styles.
- Do not add loading/disabled states to future Add interactions; UX explicitly forbids this behavior.
- Do not use magic numbers for spacing/type where tokenized values are specified.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.2)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (Technical Stack, Frontend Structure, Naming Conventions, Project Boundaries)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (Design token philosophy, responsive behavior, accessibility/focus rules)]
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-docker-compose-deployment.md` (previous story learnings and established structure)]

### Project Structure Notes

- No `project-context.md` file was found in this repository at story creation time.
- Use existing `_bmad-output` artifacts as source of truth for implementation boundaries and acceptance verification.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Workflow applied: `bmad-create-story` (`workflow.md`, `template.md`, `checklist.md`)
- Story source key resolved from user request: `1.2` -> `1-2-page-metadata-design-system-foundation`
- Implementation workflow applied: `bmad-dev-story` (`workflow.md`)
- Validation run: `cd frontend && npm run lint && npm run build` (pass)

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story includes architecture guardrails, previous-story intelligence, git pattern insights, and latest-tech notes
- Scope and anti-pattern boundaries explicitly documented to prevent over-implementation
- Implemented complete head metadata contract (title, description, OG, Twitter, robots) while preserving favicon wiring
- Replaced starter Vite UI with minimal shell and semantic `h1` wordmark using tokenized spacing and responsive well layout
- Added Tailwind v4 foundation (`tailwindcss`, `@tailwindcss/vite`) with CSS custom property tokens as source of truth
- Added IBM Plex Sans preload + stylesheet links with `display=swap` and system fallback chain in root typography
- Added global `:focus-visible` ring and reduced-motion override to disable motion/animation when user preference is set

### File List

- `_bmad-output/implementation-artifacts/1-2-page-metadata-design-system-foundation.md` (created)
- `frontend/index.html` (modified)
- `frontend/package.json` (modified)
- `frontend/package-lock.json` (modified)
- `frontend/src/App.tsx` (modified)
- `frontend/src/index.css` (modified)
- `frontend/vite.config.ts` (modified)

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-22 | Created Story 1.2 context file with comprehensive implementation guardrails | Story Agent |
| 2026-05-22 | Implemented Story 1.2 metadata, design-token foundation, shell layout, and Tailwind integration | Dev Agent |
