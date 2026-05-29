# PRD — Manage Views Dialog

## Context
Map-based territory-alignment tool for biopharma commercial teams. A **view** is a saved snapshot of the map state the user was editing (their work-in-progress). Today this is split across three toolbar buttons opening four dialogs (Save View, Manage Views, Get Views/Views, Rename). Consolidate all of it into **one** dialog launched from a single **Manage Views** button.

## Goal
One dialog that lets a user save the current map state as a new view, and load / rename / delete any saved view.

## Scope & rules
- **Save** always creates a **new** view. No overwrite.
- Editing a view is limited to **rename** only.
- Views are **private** to the user (no sharing in v1).
- Typical count 5–20 (design for more; list scrolls).
- No real map thumbnails in v1 — name + saved date only.

## Functional requirements

### 1. Save current view (top of dialog)
- Section labeled "Save current view".
- Text input ("Name this view…") + **Save** button.
- Save is **disabled** while the field is empty/whitespace.
- Enter key in the field = Save.
- On save: prepend a new view (name + today's date) to the top of the list, clear the input, show a confirmation toast ("Saved '<name>'"), and mark the new view as the loaded/active one.

### 2. Saved views list
- Header "Saved views (N)".
- Each row: view **name** (bold), subtext "Saved <date>", a **Load** button, and hover actions for **Rename** (pencil) and **Delete** (trash).
- Empty state when no views exist.
- List scrolls; save bar and footer stay fixed.

### 3. Load
- Clicking **Load** marks that row as the active view (green "Loaded" badge) and shows a toast ("Loaded '<name>'").
- Only one view is "loaded" at a time.
- (Open question — see below — whether to warn on unsaved current-map changes.)

### 4. Rename (inline — no second dialog)
- Click the name (or the pencil) → name becomes an inline text input, prefilled + selected.
- **Enter** commits, **Escape** cancels, blur commits.
- Empty rename is ignored (keeps old name).

### 5. Delete (inline confirm)
- Trash icon → row shows inline "Delete? **Yes** / **No**" (no separate modal).
- **Yes** removes the row + toast ("Deleted '<name>'"); if it was the loaded view, clear loaded state.
- **No** cancels.

### 6. Dialog chrome
- Header "Manage views" + close (×).
- Footer with a Close button.

## State model
```
View = { id: string, name: string, saved: string /* display date */, createdAt: number }
DialogState = {
  views: View[],            // newest first
  draftName: string,
  loadedId: string | null,
  renamingId: string | null,
  confirmDeleteId: string | null,
}
```
Persist `views` (localStorage in the prototype; real API on the backend).

## Interactions / edge cases
- Disable Save on empty/whitespace name.
- Allow duplicate names (dates disambiguate) — or warn; product to confirm.
- Rename/delete affordances reachable by keyboard, not hover-only, for a11y.
- Toasts auto-dismiss (~2s).

## Out of scope (v1)
- Sharing / permissions / ownership column.
- Overwriting an existing view.
- Editing anything other than the name.
- Real map thumbnails.
- Folders / tags / search (revisit if count routinely > 20).

## Open questions for SME
1. Should **Load** warn when the current map has unsaved changes?
2. Real upper bound on view count? (drives whether we need search/folders)
3. Are views ever shared, or strictly private?

## Acceptance criteria
- All four legacy functions (Save, Load/Go, Rename, Delete) are reachable from this one dialog; the three old toolbar buttons collapse to one "Manage Views".
- Save disabled when empty; creates a new dated row at top.
- Rename happens inline (no second dialog); Enter commits, Esc cancels.
- Delete requires an inline confirm.
- Load shows which view is active; one at a time.

## Reference
Working prototype: `Manage Views Interactive.html` (React, single file) — mirrors all behavior above.
