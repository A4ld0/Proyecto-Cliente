# AGENTS

## Figma Design System Rules

These rules apply to any Figma-driven UI work in this repository.

### Tech Stack And Architecture

- This project uses Angular 21, TypeScript, SCSS, standalone components, strict templates, and strict TypeScript settings.
- New route screens belong in `src/app/features/<feature>/pages/<page-name>/`.
- Shared reusable UI belongs in `src/app/shared/components/`.
- Layout wrappers belong in `src/app/layouts/`.
- Services belong in `src/app/core/services/`, constants belong in `src/app/core/constants/`, and shared interfaces belong in `src/app/interfaces/`.
- Follow the existing Angular component file triplet: `.component.ts`, `.component.html`, and `.component.scss`.
- Use PascalCase class names, kebab-case file and folder names, and the `app-` selector prefix.
- Prefer `ChangeDetectionStrategy.OnPush`, `inject()`, `signal()`, and `computed()` to match the current codebase.
- Do not introduce NgModules, path aliases, or a new state library for Figma-driven work.
- Use relative imports by default. Reuse the existing barrel export in `src/app/core/services/index.ts` when it already covers the service import you need.

### Routing And Data Flow

- Route pages are lazy loaded with `loadComponent` in `src/app/app.routes.ts`. Keep that pattern for new Figma-derived screens.
- Do not duplicate navbar or footer inside route pages. `src/app/layouts/main-layout/main-layout.component.html` already renders `<app-public-navbar />` and `<app-footer />`.
- Services typically return Observables. Resolve them in components with `firstValueFrom()` when you need imperative loading logic, as shown in the dashboard pages.
- Reuse interfaces from `src/app/interfaces/` and status or label maps from `src/app/core/constants/printlab.constants.ts` instead of redefining enums or labels locally.
- Keep user-facing copy in Spanish unless the requested feature clearly introduces another locale.

### Styling System

- Global app tokens and shared layout primitives live in `src/styles.scss`.
- Base product screens should reuse the existing CSS variables from `:root`, especially `--bg`, `--surface`, `--surface-strong`, `--border`, `--text`, `--muted`, `--brand`, `--brand-dark`, `--accent`, `--danger`, `--danger-soft`, and `--shadow`.
- IMPORTANT: For admin, client, auth, and other product screens, prefer the shared primitives already defined in `src/styles.scss` before creating one-off wrappers: `.page-shell`, `.page-header`, `.page-title`, `.panel`, `.split-layout`, `.grid-two`, `.cards-grid`, `.form-grid`, `.field`, `.field-full`, `.toolbar`, `.actions`, `.stack-sm`, `.button`, `.button-secondary`, `.button-ghost`, `.button-danger`, `.notice`, `.alert`, `.empty-state`, `.stat-card`, and `.status-chip`.
- IMPORTANT: Do not hardcode new product-screen colors if an existing token or shared class already covers the need. If a new value must be reused, promote it into `:root` in `src/styles.scss`.
- Use component-level SCSS files for custom styling. Do not switch Figma implementations to Tailwind, CSS-in-JS, or inline-style-heavy markup.
- This repo currently has three visual families that must stay distinct in Figma implementations:
- `Admin light`: uses the default light token set from `:root` for data-heavy back-office screens.
- `Client/Auth dark`: `client-shell` and `auth-shell` override the shared primitives with a dark surface, neon-lime accent, white typography, and darker glass panels while still reusing the same structural classes.
- `Marketing dark`: `landing-page`, `public-navbar`, and `app-footer` use a separate dark promotional language with black backgrounds, neon-lime accents, white text, muted gray supporting copy, and the `Staatliches` display font for high-impact headlines.
- Preserve those three families when translating Figma to code. Do not collapse admin, client/auth, and marketing into one shared color treatment just because they reuse some layout primitives.
- If a Figma change extends the client/auth dark system or the marketing system beyond a single component, extract repeated colors, spacing, or shadows into shared tokens instead of copying more raw hex values into multiple SCSS files.

### Angular Template And Component Conventions

- Use modern Angular template control flow such as `@if` and `@for` to match the rest of the repo.
- Prefer semantic HTML like `section`, `article`, `header`, `nav`, and `form`.
- Keep class names descriptive and aligned with the existing naming tone in the repo.
- Reactive forms should use `FormGroup`, `FormControl`, `Validators`, and the existing helpers in `src/app/core/utils/form-errors.util.ts`.
- For loading and error states, follow the existing signal-based pattern with `isLoading`, `errorMessage`, and template branches instead of inventing a new state shape.
- Reuse existing button, card, panel, and notice patterns before creating new visual primitives.
- If a Figma design implies a reusable building block that will appear across multiple features, place it in `src/app/shared/components/` instead of duplicating markup across pages.

### Figma MCP Workflow

Required flow for every Figma-driven task:

1. Run `get_design_context` for the exact node being implemented.
2. If the response is too large or truncated, run `get_metadata`, then re-run `get_design_context` only for the required nodes.
3. Run `get_screenshot` for the matching visual reference.
4. Treat the Figma MCP output as design intent, not final framework code.
5. Translate any React or Tailwind-oriented output into Angular standalone components, Angular template syntax, and this repository's SCSS conventions.
6. Reuse existing shared components and global primitives before creating new component files.
7. Validate visual parity, interaction states, and responsive behavior against the screenshot before marking the task complete.
- IMPORTANT: Do not copy Tailwind utility classes into this project. Convert them into repo SCSS and shared classes from `src/styles.scss`.
- IMPORTANT: Match the current Angular style: standalone `imports`, `ChangeDetectionStrategy.OnPush`, `inject()`, signals, and relative imports.

### Assets And Icons

- Store static project assets in `src/assets/`, grouped by feature when possible, for example `src/assets/landing/`.
- Reference assets with the same approach already used in the repo, such as `assets/...` or `/assets/...` depending on the component context.
- IMPORTANT: If Figma MCP returns a localhost asset source, use that source directly instead of creating placeholders.
- IMPORTANT: Do not add a new icon package just to match a Figma design. Prefer SVGs or assets provided by the Figma payload.
- If a logo, mark, or decorative shape is already built in markup and CSS, preserve or extend that approach before replacing it with a raster asset.

### Accessibility, Responsiveness, And Verification

- Preserve visible focus states and semantic button or link behavior.
- Add `aria-label` or equivalent accessible text for icon-only controls or ambiguous actions.
- Maintain strong contrast, especially on the neon-on-dark public surfaces.
- Match existing responsive behavior patterns around `1024px`, `980px`, `900px`, and `640px` before introducing new breakpoint logic.
- If a Figma change adds meaningful component logic, state transitions, or form validation, add or update the matching `*.spec.ts`. Pure visual restyles can skip test expansion when behavior is unchanged.
- Before marking work complete, run the relevant local verification for the scope of the change, typically `ng build` and targeted tests when logic changed.
