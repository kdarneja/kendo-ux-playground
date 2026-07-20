# Session summary — kendo-ux-playground

_Last updated: 2026-07-20_

## Committed & pushed to `main`

1. **Alignment-Map Windows (StackedWindows.tsx)** — commit `660ccc0`
   - Zip / HCP / Accounts windows open to a compact ~250px height (~4-5 rows), rest scrolls inside.
   - Summary window caps its height so its bottom sits above the tallest bottom window (no overlap).
2. **Alignment-Map Windows** — commit `212583a`
   - Color swatch merged into the Territory ID column; standalone Color ID column removed.
   - Summary window made resizable.
   - Sort + column-menu filtering + column resizing on all four grids.
3. **Edit Product Roles (new page)** — commit `8d13f9d`
   - Spec prototype for the PRD. Single dialog, no secondary modal; each role holds at most one inline property via expand/collapse.
   - Route `/edit-product-roles`, added to smoke test.
   - Dialog closed by default; starts with no roles assigned (shows full add → expand → set-property workflow). Roles: Configurator, Administrator, User, NonProductionUser (Impersonator removed per KD).

## Uncommitted (working tree) — NOT yet committed/pushed

Two design-system changes are done and browser-verified, but KD hasn't given the go-ahead to commit:

- **Grey canvas / white cards** — Home page and App Visualizations page background = `#F1F1F1`; Home launcher cards = white. Literal hex stopgap until the ThemeBuilder Kendo theme lands.
- **App Visualizations sub-view nav** — replaced the Example 1/2/3 `TabStrip` with a navy filled `DropDownList` (the set pattern for in-page sub-view navigation). Popup highlights the active item navy. Removed unused TabStrip import + `.av-tabs` CSS.

Files dirty: `src/index.css`, `src/pages/AppVisualizations.tsx`, `src/pages/Home.tsx`.

## Open items / notes

- **KD to deliver** a Kendo theme built in ThemeBuilder. Then replace the literal `#F1F1F1` / navy / white values with theme tokens across Home, App Visualizations, and the navy DropDownList sub-view pattern.
- **Edit Product Roles PRD open questions still unresolved** (flagged to eng): confirm-before-remove when a role has a property set; Key format validation; whether removals save immediately or only on Update.
- **Mock vs PRD conflict on Edit Product Roles**: mock showed "2 properties" on collapsed rows; PRD says one property max (confirmed with dev). Built to the PRD — collapsed rows show `Key · Value` or "No property set".
- Stray untracked `1alias` file keeps appearing (captured ssh-add output); excluded from every commit. `rm 1alias` to clean up.

## Verify

`pnpm dev` (:5173), then `pnpm verify` (Playwright smoke test across all routes). All routes passing as of last run.
