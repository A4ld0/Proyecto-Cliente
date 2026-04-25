# PrintLab Figma Library Plan

This document captures the v1 design-system library plan derived from the current Angular codebase in `src/`.

## Status

- The Figma library has not been created from this thread yet.
- Reason: the Figma MCP connection and write tools are not exposed in this session, so creation inside a Figma file is blocked for now.
- This plan is the approved starting point to execute once the Figma connector is available.

## Current Visual Inventory

The codebase currently contains three related but distinct visual families:

1. `Admin light`
   - Primary source: `src/styles.scss`
   - Feel: light workspace, teal brand, soft glass cards, data-heavy panels
   - Key colors: `#edf4f6`, `#ffffff`, `#12303a`, `#56707b`, `#0f766e`, `#0b4f4a`, `#f59e0b`, `#dc2626`

2. `Client/Auth dark`
   - Primary source: `src/styles.scss` under `.client-shell` and `.auth-shell`
   - Feel: dark product workspace, neon-lime accent, white copy, dark translucent panels
   - Key colors: `#010101`, `#121212`, `#ffffff`, `#b6b6b3`, `#ccf301`, `#9dbb00`, `#ff6b6b`

3. `Marketing dark`
   - Primary source: `src/app/features/landing/pages/landing-page/*`, `src/app/shared/components/navigation/public-navbar/*`, `src/app/shared/components/navigation/app-footer/*`
   - Feel: high-contrast landing experience, black backgrounds, neon-lime accents, strong display typography
   - Key colors: `#000000`, `#010101`, `#ffffff`, `#b6b6b3`, `#ccf301`

Typography already present in code:

- `Inter` for body, labels, forms, tables, and UI copy
- `Staatliches` for display headlines in dark client/auth and marketing experiences

Existing reusable UI patterns in code:

- Buttons: primary, secondary, ghost, danger
- Containers: panel, stat card, notice, alert, empty state
- Inputs: text input, select, textarea, invalid state
- Status indicators: base chip, warning chip, danger chip
- Layout primitives: page shell, page header, page title, form grid, cards grid, split layout, toolbar, actions stack
- Navigation: public navbar, footer
- Feature cards: request card, hero CTA areas

## Recommended Figma File Structure

Create the library file with this page order:

1. `Cover`
2. `Getting Started`
3. `Foundations / Color`
4. `Foundations / Typography`
5. `Foundations / Spacing`
6. `Foundations / Radius`
7. `Foundations / Effects`
8. `---`
9. `Components / Button`
10. `Components / Form Field`
11. `Components / Feedback`
12. `Components / Panel & Cards`
13. `Components / Status Chips`
14. `Components / Navigation`
15. `Components / Request Card`
16. `Components / Hero`
17. `Components / Layout Primitives`
18. `---`
19. `Utilities`

## Variable Architecture

Recommended collections for v1:

1. `Primitives`
   - Raw neutrals, teal scale, lime scale, amber scale, red scale
   - Single mode: `Value`

2. `Color`
   - Modes:
     - `Admin Light`
     - `Client Dark`
     - `Marketing Dark`
   - Semantic tokens only, aliased to `Primitives`

3. `Spacing`
   - Single mode: `Value`
   - Suggested scale: `4, 8, 12, 16, 20, 24, 32, 40, 48`
   - Legacy values in code should snap to the nearest approved token when building the library

4. `Radius`
   - Single mode: `Value`
   - Suggested tokens: `6, 8, 12, 16, 20, 24, pill`

5. `Effects`
   - Single mode: `Value`
   - Shadows, glass borders, hero glows

6. `Typography`
   - Single mode: `Value`
   - Font family, size, line height, letter spacing tokens for body and display ramps

### Color Token Proposal

Core semantic color tokens:

- `color/bg/app`
- `color/bg/panel`
- `color/bg/panel-strong`
- `color/bg/subtle`
- `color/text/primary`
- `color/text/secondary`
- `color/text/inverse`
- `color/border/default`
- `color/border/strong`
- `color/brand/primary`
- `color/brand/strong`
- `color/accent/default`
- `color/danger/default`
- `color/danger/soft`
- `color/success/soft`
- `color/status/warn`

Suggested mode behavior:

- `Admin Light` maps to the light teal workspace tokens
- `Client Dark` maps to the dark neon product workspace tokens
- `Marketing Dark` maps to the black/neon promotional tokens

### Typography Token Proposal

Text styles and matching variable groups:

- `display/hero`
- `heading/h1`
- `heading/h2`
- `heading/h3`
- `body/lg`
- `body/md`
- `body/sm`
- `label/md`
- `label/sm`
- `eyebrow`
- `table/header`
- `caption`

Style guidance:

- `display/hero` and dark-surface hero headlines use `Staatliches`
- All other UI copy uses `Inter`
- Uppercase condensed display treatments belong only to client/auth dark and marketing contexts

### Effect Style Proposal

- `shadow/admin/panel`
- `shadow/client/panel`
- `shadow/marketing/glow`
- `shadow/button/neon`
- `blur/glass/navbar`
- `blur/glass/panel`

## v1 Component Scope

Build components in this order:

1. `Button`
   - Variants: `Primary`, `Secondary`, `Ghost`, `Danger`
   - Modes supported through color variables instead of separate component trees
   - States: `Default`, `Hover`, `Disabled`

2. `Form Field`
   - Text input, select, textarea
   - States: `Default`, `Focus`, `Invalid`, `Disabled`
   - Slots: label, helper text, error text

3. `Feedback`
   - `Notice`, `Alert`, `Empty State`

4. `Panel & Cards`
   - `Panel`
   - `Stat Card`
   - `Auth Card`

5. `Status Chips`
   - `Default`, `Warn`, `Danger`

6. `Navigation`
   - `Public Navbar`
   - `Footer`

7. `Request Card`
   - Title, description, chips, footer metadata, actions

8. `Hero`
   - Hero copy block
   - Primary CTA
   - Highlight pill

9. `Layout Primitives`
   - `Page Header`
   - `Page Title`
   - `Cards Grid`
   - `Form Grid`
   - `Split Layout`

## Rules For The Figma Build

- Keep `Admin Light`, `Client Dark`, and `Marketing Dark` as separate visual contexts. Do not merge them into one generic theme.
- Reuse the same component API across contexts when structure matches; vary visuals with token bindings.
- Avoid introducing a fourth visual language unless the codebase changes first.
- Bind fills, strokes, text colors, gap, and radius to variables wherever practical.
- Keep marketing-only pieces like the hero and public navbar/footer separate from admin and client workspace components.
- Use `Inter` as the default UI font and reserve `Staatliches` for high-emphasis display use.

## Execution Plan Once Figma Is Connected

1. Inspect the target Figma file for existing pages, variables, styles, and naming conventions.
2. Create the six foundation collections listed above.
3. Create text and effect styles.
4. Build the page skeleton.
5. Create components one page at a time in the v1 order.
6. Validate each component with screenshot and metadata before continuing.

## Approval Scope

This plan is a good v1 target if the goal is:

- match the current product without redesigning it first
- build a reusable library from the UI that already exists
- keep room for future cleanup without blocking the first Figma library pass

If the next session has Figma connected, the next practical step is Phase 1: foundations creation.
