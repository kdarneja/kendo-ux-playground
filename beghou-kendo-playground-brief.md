# Beghou Kendo Playground — Bootstrap Brief

A single-file brief to hand to a Code CLI session. Goal: scaffold a Kendo React app called **"Kendo Playground"** as a kitchen sink and experimentation surface for KendoReact components. Every nav item is its own page that prototypes a UX idea — the home page is a card-based launcher that opens each prototype as if it were an Arc-portal sub-app.

---

## What this brief tells you to build

1. A React + Vite app titled **"Kendo Playground"**.
2. A persistent **AppBar** + **Drawer** chrome matching the Beghou Arc spec.
3. A **home page** that's a grid of cards — each card is a doorway into a UX prototype.
4. A small set of starter prototype pages (one per nav item), each a standalone page where Kendo components can be experimented with.
5. **Kendo React components only.** Full license is assumed — use any `@progress/kendo-react-*` package.

This is a playground, not a production app. The goal is rapid hit-and-trial with Kendo's component set, not a polished delivery. Code quality, naming, and structure should be just-good-enough to keep new prototypes easy to add.

---

## Stack

| Layer | Pick |
|---|---|
| Bundler | Vite |
| Framework | React 18+ |
| Language | TypeScript |
| Routing | `react-router-dom` |
| UI components | `@progress/kendo-react-*` (everything — full license) |
| Theme base | `@progress/kendo-theme-default` |
| License | `@progress/kendo-licensing` (activate via Telerik docs) |
| Font | Inter, via `@fontsource/inter` (weights 400 / 500 / 600 / 700) |
| Icons | Kendo's built-in icon set (`@progress/kendo-svg-icons`) |

---

## Token files (already in repo)

KD has dropped two JSON token files at the repo root:

- `beghou-color-tokens.json` — color tokens (brand, surface, neutral, border, semantic, focus ring, chart)
- `beghou-typography-tokens.json` — typography tokens (font family, weights, scale, component styles)

Read both files at app boot, expose them as a `theme` object, and **apply them as CSS custom properties** on `:root` after Kendo's base theme is loaded. The values in the JSON map directly to Kendo's `--kendo-color-*` and `--kendo-font-*` custom properties.

### Suggested theme bridge

Create `src/theme/applyBeghouTheme.ts` that:

1. Imports both JSON files.
2. Writes CSS custom properties at `:root` in the order Kendo expects (load **after** `@progress/kendo-theme-default/dist/all.css` so overrides win).
3. Exposes a typed `theme` object that components can import directly.

```ts
// Suggested mapping (extend as you go):
:root {
  --kendo-font-family: "Inter", system-ui, sans-serif;
  --kendo-font-size: 14px;
  --kendo-letter-spacing: 0;

  --kendo-color-primary: <colors.brand.navy.value>;
  --kendo-color-primary-hover: <colors.brand.navyHover.value>;
  --kendo-color-on-primary: <colors.brand.onPrimary.value>;

  --kendo-color-base: <colors.surface.app.value>;
  --kendo-color-surface: <colors.surface.card.value>;

  --kendo-color-success: <colors.semantic.success.main>;
  --kendo-color-warning: <colors.semantic.warning.main>;
  --kendo-color-error: <colors.semantic.error.main>;
  --kendo-color-info: <colors.semantic.info.main>;

  --border-form-input: <colors.border.formInput.value>;
  --border-container: <colors.border.container.value>;
  --border-emphasized: <colors.border.emphasized.value>;
}
```

Don't over-engineer the bridge. If the JSON token shape feels awkward to consume from the Kendo theme, flatten on read. The tokens are the source of truth, not the implementation.

---

## App chrome — AppBar + Drawer

The chrome is the entire reason this brief exists. KendoReact ships **`AppBar`** and **`Drawer`** components under the same names — expect to use them directly. The visual treatment below is **non-negotiable** — it has to look like an Arc app.

---

### AppBar

> **Kendo component:** `AppBar` from `@progress/kendo-react-layout`. Compose the inner layout (logo, divider, page identifier, icon group, avatar) yourself — Kendo's `AppBar` is a shell; the specific composition below is Beghou-Arc-specific.

Global top-of-page header. Anchors brand identity, page identification, and system-level actions (search, AI assistant, notifications, app switcher, settings, user account). Fixed to the top of the viewport, full width. Sits above the Drawer.

#### When to use

- As the global header on every Kendo Playground page.
- Always at the top of the viewport, always full width, always visible.

#### When NOT to use

- **Modal overlays or Dialog content.** Dialogs have their own titlebar.
- **Nested as a secondary toolbar.** Use Kendo's `Toolbar` for in-page action bars.

#### Structure

| Property | Value |
|---|---|
| Height | **56px** (Beghou override — typical AppBars default to ~46px; Arc uses 56px for more breathing room) |
| Background | `#FFFFFF` |
| Bottom border | 1px solid `rgba(2, 4, 52, 0.08)` (token: `border.container`) |
| Left padding | **0** — the leftmost 49px is reserved for the hamburger zone (see Anatomy below). |
| Right padding | 16px |
| Shadow | None |
| Position | Fixed top, full viewport width, z-index above Drawer |

#### Anatomy

AppBar has two clusters separated by flexible whitespace.

**Icon sizing rule:** All icons in the AppBar are **24×24px**, `#020434` (navy), single-weight stroke. This applies to the hamburger toggle, every right-cluster icon action (search, AI, bell, waffle, settings), and any future icon added to the AppBar. The user avatar is 32×32 (circular image, not a glyph icon) and is the single exception. Do not mix icon sizes within the AppBar.

**AppBar / Drawer column alignment:** The leftmost **49px** of the AppBar (matching the collapsed Drawer width below it) is reserved for the hamburger toggle. The hamburger's 32×32 hit area is **horizontally centered within this 49px zone** — its center sits at 24.5px from the AppBar's left edge, aligning with the column of icons in the Drawer. After the 49px zone, the rest of the left cluster (logo + divider + page identifier) begins. This alignment is what visually anchors the AppBar to the Drawer below — never apply generic horizontal padding to the AppBar's left edge that would push the hamburger out of this zone.

**Left cluster (fixed width, left-aligned):**

| Element | Treatment |
|---|---|
| Hamburger zone | 49px wide, full AppBar height. The Drawer toggle (hamburger icon `☰`) renders as a 32×32 hit area, horizontally centered in this zone. |
| Gap | 28px (after the 49px zone) |
| Logo / wordmark | For this playground: **"Kendo Playground"** as a 14px Inter Medium wordmark, `#020434`. (The production Beghou⬩ARC logo SVG is out of scope for this scaffold — see Out of scope.) |
| Gap | 24px |
| Vertical divider | 1px `rgba(2, 4, 52, 0.08)` (token: `border.container`), 32px tall, centered vertically (12px inset top and bottom). |
| Gap | 24px |
| Page identifier | 14px Inter Regular, `#020434`. Reflects the current route — pulls from `routes.ts` (e.g., "Home", "Grids", "Forms"). Single-line, truncates with ellipsis at 280px max. |

**Right cluster (fixed width, right-aligned):**

| Element | Treatment |
|---|---|
| Context selector (optional, OMIT for this playground) | DropDownList, Medium size (30px), **Solid variant** with `#EDF0FA` fill and 1px `rgba(2, 4, 52, 0.5)` (token: `border.formInput`) border. 14px Inter Regular `#020434`. Chevron right, navy, does not rotate. Displays current scope (e.g., "220000 - NATION"). Only rendered when the current app has a scoping context — **omitted in the Kendo Playground.** Documented here so it's available when needed. |
| Gap | 32px |
| Icon action group | Horizontal row of icon-only buttons, 32px gap between each. Per the icon sizing rule, icons are 24×24 navy. No button chrome (no background, no border) — clickable area is 32×32px, centered vertically (12px inset top and bottom within the 56px AppBar). Hover: `#EDF0FA` fill on the 32×32 hit area with 4px border radius. |
| Gap after last icon | 32px |
| User avatar | Circular, 32px, displays user's profile image. For the playground: solid navy circle with white **"KP"** initials (Kendo Playground). |

**Icon actions, in order (left to right):**

1. **Search** (magnifying glass) — opens global search. Placeholder in the playground.
2. **AI Assistant** (sparkle glyph) — opens AI assistant panel. **Optional** — only rendered when the current app supports AI assistance; omitted otherwise. Render as placeholder in the playground.
3. **Notifications** (bell) — opens notification drawer. When unread count > 0, displays a small red dot overlaid on the top-right of the bell icon (see Notification indicator below).
4. **App switcher** (9-dot waffle grid) — opens a Google-style app switcher listing the Arc apps available to the user. Placeholder in the playground.
5. **Settings** (gear) — opens the admin / settings area. Placeholder in the playground.

#### Context selector variant note

The context selector is the single place in Arc where DropDownList's **Solid** variant is used intentionally. Outline (Arc's default) would disappear against the white AppBar surface — the tinted `#EDF0FA` fill gives the pill a visible shape that reads as a scoped-context indicator. This is a documented local exception; Outline remains the default everywhere else. **The Kendo Playground omits the context selector** (no scoping needed), but if you re-introduce it later, use the Solid variant per this rule.

#### Notification indicator

When the user has one or more unread notifications, a small solid red dot appears overlaid on the bell icon. No number, no text — presence of the dot signals "something new," and the user clicks the bell to see what.

| Property | Value |
|---|---|
| Shape | Solid circle (dot) |
| Size | 14×14px |
| Fill | `#FF0000` (Error red) |
| Border | None |
| Position | Absolute, top-right corner of the bell icon, offset -4px top and -4px right so the dot overhangs the icon edge |
| Hidden when | Unread count is 0 |

This is deliberately simpler than the Kendo `Badge` component — no count, no "99+" rule, no text styling. The bell dot is an AppBar-specific indicator pattern. Red is used here (not Beghou Magenta) to keep magenta out of UI.

#### Page identifier behavior

- **Single page:** Shows the route's label from `routes.ts` (e.g., "Home", "Grids").
- **Breadcrumb path** (when a prototype renders nested screens): Shows path segments separated by " / " (e.g., "Grids / Custom Cells"). All segments at 14px Regular navy; no link styling on intermediate segments.
- **Truncation:** If the identifier exceeds 280px, truncate the middle of the path with ellipsis ("Grids / … / Custom Cells") or right-truncate the end, based on what keeps the leading segment readable.

#### Responsive behavior

At widths below 1024px:

- Page identifier truncates earlier (max 160px).
- Context selector, if present, collapses to an icon trigger that opens the dropdown as an overlay. (N/A in the playground since the context selector is omitted.)
- Icon action group is preserved in full — these are primary nav and do not hide.

Below 768px (mobile) is not yet specified — the playground is desktop-first.

#### AppBar anti-patterns

- ❌ Using a dark navy background for the AppBar. Arc's AppBar is white with a subtle bottom border — it recedes into the page. Solid navy chrome would make the app feel heavy.
- ❌ Adding page-level actions (Export, Filter, New) to the AppBar. Those belong in a page Toolbar below the AppBar, not in global chrome.
- ❌ Using Beghou Magenta anywhere in AppBar UI — including the notification dot, context selector highlight, hover states, or active indicators. The notification dot is Error red.
- ❌ Coloring icon actions anything other than `#020434`. No semantic coloring on global chrome icons, even for status.
- ❌ Showing the context selector when the current page has no scoping context. Omit entirely rather than showing an empty or placeholder dropdown.
- ❌ Making the logo or page identifier disappear below a width threshold. Both remain visible at all supported widths (≥1024px).
- ❌ Adding a shadow to the AppBar. The 1px bottom border is sufficient separation; a shadow would clash with Arc's subtle elevation scale.
- ❌ Replacing the hamburger toggle with a different icon. The `☰` is the canonical Drawer toggle across Arc.
- ❌ Using the Outline DropDownList variant for the context selector. Outline disappears against the white AppBar; Solid is the documented local exception.
- ❌ Mixing icon sizes within the AppBar. All icons are 24×24; the avatar is the only exception at 32×32.
- ❌ Replacing the notification dot with the Kendo `Badge` component. The bell indicator is intentionally a simple 14×14 red dot — no count, no text. Using `Badge` here would add count logic and text styling that the pattern deliberately avoids.

---

### Drawer

> **Kendo component:** `Drawer` from `@progress/kendo-react-layout`. Kendo's `Drawer` provides the collapsible/expandable shell + item-row rendering API. The visual treatment below is Beghou-Arc-specific — apply via CSS overrides on Kendo's drawer item slots.

Global left-side navigation drawer. Sits below the AppBar and lists the prototype pages available in the Playground. Toggles between collapsed (icons only) and expanded (icons + labels). Beghou-specific composition layered on top of Kendo's `Drawer` primitive.

> **Cross-library naming:** "Drawer" is the Kendo name for this component — and it happens to match the Arc spec's name directly. In other libraries this is sometimes called Sidebar, Side Navigation, or simply Navigation. For Kendo, just use `Drawer`.

#### When to use

- As the global navigation surface on every Playground page, paired with the AppBar above.

#### When NOT to use

- **In-page or sub-page navigation.** Use Kendo's `TabStrip` or a secondary nav pattern.
- **Inside modals, dialogs, or popovers.**
- **As a general-purpose list.** Drawer items are specifically page-level nav targets.

#### Structure

| Property | Value |
|---|---|
| Position | Fixed left, full viewport height below the AppBar |
| Collapsed width | **49px** |
| Expanded width | **241px** (default minimum width) |
| Background | `#FFFFFF` |
| Right border | 1px solid `rgba(2, 4, 52, 0.08)` (token: `border.container`) |
| Shadow | None when collapsed; backdrop pattern when expanded (see Overlay treatment) |

**Expanded width guidance:** 241px is the default minimum. It fits every current Playground page name without wrapping. If a new prototype's label wraps at 241px, widen the Drawer rather than truncating the label.

#### Drawer item

Every item in the Drawer — whether a top-level nav entry or the footer item — uses the same row structure.

| Property | Value |
|---|---|
| Width | Full Drawer width (49px collapsed, 241px expanded by default) |
| Height | 40px |
| Border radius | 0 (flush row, no rounded corners) |
| Inner padding | 8px vertical, 16px horizontal |
| Icon-to-label gap | 16px |
| Icon vector | 16×16, `#020434` |
| Icon container | 16-wide (icon center sits at x=24 from drawer's left edge, aligning with the hamburger center in the AppBar's 49px zone above) |
| Label | 14px Inter Regular (400), `#020434` |

**Icon sizing note:** Icons are 16×16 vectors inside a 16-wide container — intentionally compact because the Drawer holds a list of nav targets, not a launcher. Icon prominence is kept low.

#### Item states

| State | Background | Icon | Text | Border/Shadow |
|---|---|---|---|---|
| Normal (inactive) | `#FFFFFF` | `#020434` | `#020434` | None |
| Hover (inactive) | `#E8E8EC` (Neutral 100) | `#020434` | `#020434` | None |
| Focus (inactive, keyboard) | `#E8E8EC` | `#020434` | `#020434` | 2px inset box-shadow `#000000` |
| Active (selected) | `#020434` (solid navy) | `#FFFFFF` | `#FFFFFF` | None |
| Active + Hover | `#020434` (no change — active takes precedence) | `#FFFFFF` | `#FFFFFF` | None |
| Active + Focus | `#020434` | `#FFFFFF` | `#FFFFFF` | 2px inset box-shadow `#000000` |

**Active treatment:** The active item fills the full width of the row with solid navy — **no left-edge stripe or indicator line**. Same treatment in both expanded and collapsed states.

**Active state syncing:** When the URL matches a Drawer item's route, that item shows the Active (solid navy) state. Drive this from `react-router-dom`'s `useLocation()` and Kendo's `Drawer` `selected` prop or equivalent.

#### Footer item

A single special Drawer item is anchored to the bottom of the Drawer, separated from the main nav list by a horizontal divider. Persistent across both expanded and collapsed states. For the Playground, use **"Settings"** as the footer label (placeholder; no real settings page yet).

| Property | Value |
|---|---|
| Position | Bottom of Drawer, above the viewport's bottom edge |
| Divider above | 1px solid `rgba(2, 4, 52, 0.08)` (token: `border.container`), full Drawer width |
| Row structure | Same as any other Drawer item (40px height, 16px icon, 14px Regular label) |
| Label | "Settings" when expanded; icon-only when collapsed |

The footer item participates in the same hover, focus, and active states as the rest of the list.

#### Overlay treatment

When expanded, the Drawer overlays the page content (does not push content rightward) with a backdrop on the main content area, matching the Dialog pattern. Backdrop: `rgba(2, 4, 52, 0.6)` (navy at 60%).

Kendo's `Drawer` supports both push and overlay modes — **use overlay** (`mode="overlay"` or equivalent prop, depending on Kendo version).

#### Scrolling

The Playground currently has a small number of pages that fit the viewport. If the nav list ever overflows, the main nav area should scroll internally while the footer item stays anchored at the bottom. Not specified further until the case exists.

#### Drawer anti-patterns

- ❌ Using a left-edge stripe or indicator bar for the active item. Arc's active state is full-row solid navy.
- ❌ Wrapping item labels across two lines. Widen the Drawer instead.
- ❌ Using icon sizes other than 16×16 for Drawer items. Drawer icons are intentionally compact to support long nav lists.
- ❌ Using Beghou Magenta for active, hover, or focus states. Active is solid navy; hover/focus is `#E8E8EC`.
- ❌ Adding decorative separators between every item. The only divider is the one above the footer item.
- ❌ Pushing main content rightward when the Drawer expands. Arc's Drawer overlays content with a backdrop.
- ❌ Omitting the backdrop when the Drawer is expanded. The backdrop is part of the overlay pattern.
- ❌ Using the Drawer for in-page navigation (tabs, subsections). Drawer is for page-level nav only.
- ❌ Hiding the footer item in collapsed state. It remains visible as an icon.

---

## Routing & navigation

Use `react-router-dom`. Each Drawer item is a route. Suggested starter routes:

| Route | Drawer label | Page purpose |
|---|---|---|
| `/` | Home | The card-based launcher (see below) |
| `/grids` | Grids | Sandbox for Kendo Grid configurations, virtualization, custom cells |
| `/forms` | Forms | Sandbox for form inputs, validation, layouts |
| `/charts` | Charts | Sandbox for Kendo Charts (Sparkline, Stock, etc.) |
| `/scheduler` | Scheduler | Sandbox for Kendo Scheduler |
| `/editor` | Editor | Sandbox for Kendo Editor (rich text) |
| `/uploads` | Uploads | Sandbox for Upload + file management |

You can add more as you go — every new prototype gets its own route and Drawer item.

**Active state syncing:** When the URL matches a Drawer item's route, that item shows the Active (solid navy) state. Use `react-router-dom`'s `useLocation()` or `NavLink` for this.

---

## Home page — card-based launcher

The home page (`/`) is the entry point. It's a grid of Kendo `Card` components — one card per playground page. Clicking a card navigates to that page.

| Property | Value |
|---|---|
| Layout | CSS Grid, `repeat(auto-fill, minmax(280px, 1fr))`, 16px gap |
| Page padding | 24px |
| Page title at top | **"Kendo Playground"** as a 28px Inter Bold heading (`heading4` from `beghou-typography-tokens.json`) |
| Subtitle | "Each card opens a UX prototype — like an app inside the Beghou portal." 14px Inter Regular at 70% opacity. |

**Each card:**

| Property | Value |
|---|---|
| Component | Kendo `Card` with `CardHeader`, `CardBody`, `CardActions` |
| Background | `#EDF0FA` (Card Surface) |
| Border | 1px `rgba(2, 4, 52, 0.08)` |
| Border radius | 4px |
| Padding | 16px |
| Title | The page name (e.g., "Grids") — 16px Inter Regular navy (`componentStyles.cardTitle`) |
| Description | One short sentence explaining what's in that prototype |
| Action | A Text Button-style "Open →" link, navy text (`#020434`), no border, no fill |
| Click behavior | The whole card is clickable; navigates to the route |
| Hover | Subtle Elevation-2 shadow (`0 2px 8px rgba(2,4,52,0.07), 0 4px 12px rgba(2,4,52,0.06)`), cursor pointer |

The home page is the showcase — keep it visually clean and let the cards do the talking.

---

## Per-prototype page pattern

Every prototype page (route under `/`) follows the same skeleton:

```
┌──────────────────────────────────────────────────┐
│ AppBar (56px)                                    │
├──┬───────────────────────────────────────────────┤
│  │ Page content area                             │
│  │                                               │
│  │ ┌─ Page header                                │
│  │ │   Title (heading4, 28px Bold navy)          │
│  │ │   Subtitle (baseTextMD, 14px Regular,       │
│  │ │     navy at 70% opacity)                    │
│  │ └─                                            │
│  │                                               │
│  │ ┌─ Prototype area                             │
│  │ │   Free-form. Kendo components, any layout.  │
│  │ └─                                            │
│  │                                               │
│ D│                                               │
│ r│                                               │
│ a│                                               │
│ w│                                               │
│ e│                                               │
│ r│                                               │
│  │                                               │
└──┴───────────────────────────────────────────────┘
```

**Content area:**
- Background `#FFFFFF`
- Left margin: 49px (account for the collapsed Drawer)
- Top margin: 56px (account for the AppBar)
- Inner padding: 24px

**Page header per page:**
- Page title at the top — `heading4` (28px Inter Bold navy)
- One-line subtitle below — `baseTextMD` (14px Inter Regular navy at 70% opacity)
- 24px gap before the prototype area

After the header, the prototype is free-form. Drop in whatever Kendo components you're testing. Each prototype page is a separate file in `src/pages/`.

**Starter content for each prototype page:** a single "TODO" message ("Build the [name] prototype here.") is enough to get the routing working. Real prototypes get added as KD or the AI session dreams them up.

---

## Project structure

```
src/
  main.tsx                  # Entry — load Kendo theme + Beghou tokens
  App.tsx                   # Router + global chrome (AppBar + Drawer)
  theme/
    applyBeghouTheme.ts     # Reads color + typography JSON, writes :root CSS vars
    tokens.ts               # Typed re-export of the JSON tokens
  components/
    AppBar.tsx              # Beghou-style AppBar (per the spec above)
    Drawer.tsx              # Beghou-style Drawer (per the spec above)
  pages/
    Home.tsx                # Card-based launcher
    Grids.tsx               # Kendo Grid sandbox
    Forms.tsx               # Form input sandbox
    Charts.tsx              # Kendo Charts sandbox
    Scheduler.tsx           # Kendo Scheduler sandbox
    Editor.tsx              # Kendo Editor sandbox
    Uploads.tsx             # Upload sandbox
  routes.ts                 # Routes + Drawer item metadata (label, icon, path)
public/
  index.html
beghou-color-tokens.json    # Already in repo root
beghou-typography-tokens.json
```

The `routes.ts` file is the single source of truth for both routing and the Drawer's nav list. When you add a prototype page, add it to `routes.ts` and both the route and the Drawer item appear together.

```ts
// Suggested shape — adapt as you go
import { SVGIcon } from '@progress/kendo-react-common';
import {
  homeIcon, gridIcon, formIcon, chartLineIcon,
  calendarIcon, pencilIcon, uploadIcon,
} from '@progress/kendo-svg-icons';
import Home from './pages/Home';
import Grids from './pages/Grids';
// ...

export const routes = [
  { path: '/', label: 'Home', icon: homeIcon, component: Home },
  { path: '/grids', label: 'Grids', icon: gridIcon, component: Grids },
  { path: '/forms', label: 'Forms', icon: formIcon, component: Forms },
  { path: '/charts', label: 'Charts', icon: chartLineIcon, component: Charts },
  { path: '/scheduler', label: 'Scheduler', icon: calendarIcon, component: Scheduler },
  { path: '/editor', label: 'Editor', icon: pencilIcon, component: Editor },
  { path: '/uploads', label: 'Uploads', icon: uploadIcon, component: Uploads },
] as const;
```

---

## Boot order at app startup

1. Activate the Kendo license (`npx kendo-ui-license activate` once, before the dev server starts).
2. Import Inter font CSS (`@fontsource/inter/400.css` through `700.css`) at the entry.
3. Import Kendo's base theme: `import '@progress/kendo-theme-default/dist/all.css'`.
4. Apply Beghou tokens via `applyBeghouTheme()` — runs at module load, writes `:root` CSS vars after Kendo's CSS is in the DOM.
5. Mount `<App />`.

`App.tsx` renders the persistent chrome (AppBar + Drawer) and a `<Routes>` block that swaps the main content based on the route.

---

## Coding-agent instructions

If you're an AI session reading this brief to scaffold the app:

1. **Don't reach for non-Kendo libraries.** No MUI, no shadcn, no Mantine. Kendo only. If something is hard to do in Kendo, fall back to vanilla HTML/CSS — not another component library.
2. **Use the token JSON files as the source of truth for colors and typography.** Don't hardcode hex values if the token already exists.
3. **The AppBar and Drawer visual treatments are non-negotiable.** Match the spec exactly. The hamburger 49px zone, the 32×32 icon hit areas with `#EDF0FA` hover, the 56px AppBar height, the 49/241 Drawer widths, the full-row navy active state — all required.
4. **No magenta on UI surfaces.** The `beghou-color-tokens.json` has magenta in the brand block with a "BRAND ACCENT ONLY" usage note. Don't put magenta in the AppBar, icons, hover states, or anywhere a user can interact.
5. **Don't over-engineer.** Just-good-enough scaffolding. Prototype pages should start with a one-line "TODO" message — they get filled in later as the playground evolves.
6. **Add new prototype pages by editing `routes.ts`.** The home page launcher, the AppBar page identifier, and the Drawer nav list all derive from that one array.

When the scaffold is up, the goal is: run `npm run dev`, see a clean Arc-looking shell with an AppBar, a Drawer with 7 nav items, and a home page of 7 cards — each card opens to a near-empty prototype page with the right title + subtitle.

---

## What's out of scope for this scaffold

- Authentication, real user data, real notifications
- The Beghou⬩ARC logo SVG (use the "Kendo Playground" wordmark instead)
- The app switcher actually switching apps (it's a placeholder icon)
- Mobile/tablet breakpoints (desktop-first; below 1024px is acceptable to be janky)
- Hot-reloading the token JSON files (changes to the JSON require a dev-server restart for this round)
- Persistence — Drawer expand/collapse state doesn't need to survive a page reload
- Accessibility audit beyond what Kendo ships by default

Get the chrome looking right and the home page launching prototypes. Everything else follows.
