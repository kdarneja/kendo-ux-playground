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
4. **Grey canvas + DropDownList sub-view nav** — commit `3b00537`
   - Home and App Visualizations page background = `#F1F1F1` (literal hex stopgap until the ThemeBuilder Kendo theme lands); Home launcher cards = white.
   - App Visualizations: Example 1/2/3 `TabStrip` replaced with a navy filled `DropDownList` (the set pattern for in-page sub-view navigation); popup highlights the active item navy. Removed unused TabStrip import + `.av-tabs` CSS.
5. **Polish** — commit `1d0a0bb`
   - App Visualizations: view-changer bar made transparent so the whole page reads as one `#F1F1F1` canvas (no white strip behind the dropdown).
   - Home launcher cards: added `--kendo-elevation-1` shadow.
6. **Small Calendar restyle** — commit `63a5f94`
   - Page background `#F1F1F1`. Empty card placeholders now match the landing launcher cards (white, solid 1px border, 4px radius, `--kendo-elevation-1`, no data). Calendar widget: white background + `--kendo-elevation-1`.

**Established pattern:** grey `#F1F1F1` app canvas + white cards with `--kendo-elevation-1` + 1px `--border-container` + 4px radius. Now on Home, App Visualizations, and Small Calendar.

## Git authorship fix (this session)

- 24 commits (from `61f3327` to the old tip `5763b5e`) were authored by `KD <kd@resonata.health>`. Rewrote author + committer on all of them to `kdarneja <kd.singh@beghou.com>` via `git filter-branch`, then force-pushed. Trees byte-identical; only authorship changed. Hashes changed — other clones need `git reset --hard origin/main`.
- Backup branch `backup-before-author-fix` (old tip `5763b5e`, still resonata) kept locally, not pushed. Delete once no longer needed.
- **Root cause still open:** global git config is `KD <kd@resonata.health>`. This repo commits correctly only because it has a local override. KD works across both resonata and beghou, so he plans to empty the global identity (`git config --global --unset user.name/email` + `user.useConfigOnly true`) and/or set up `includeIf` per-folder identities. Not yet done.

Working tree clean (aside from the untracked `1alias`).

## Open items / notes

- **KD to deliver** a Kendo theme built in ThemeBuilder. Then replace the literal `#F1F1F1` / navy / white values with theme tokens across Home, App Visualizations, and the navy DropDownList sub-view pattern.
- **Edit Product Roles PRD open questions still unresolved** (flagged to eng): confirm-before-remove when a role has a property set; Key format validation; whether removals save immediately or only on Update.
- **Mock vs PRD conflict on Edit Product Roles**: mock showed "2 properties" on collapsed rows; PRD says one property max (confirmed with dev). Built to the PRD — collapsed rows show `Key · Value` or "No property set".
- Stray untracked `1alias` file keeps appearing (captured ssh-add output); excluded from every commit. `rm 1alias` to clean up.

## Verify

`pnpm dev` (:5173), then `pnpm verify` (Playwright smoke test across all routes). All routes passing as of last run.
