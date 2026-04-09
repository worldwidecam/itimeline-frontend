# Timeline Theme Token Contract (v1)

This document freezes the timeline theming contract and naming so light/dark/future theme packages stay isolated.

## Purpose

Use semantic surface tokens instead of per-component mode conditionals.

Source of truth:
- `src/components/timeline-v3/timelineSurfaceTheme.js`

## Token Groups

### 1) Canvas (route viewport layer)
- `canvas`
- Owned by route wrappers in `App.js` (`timelineViewportSx`)
- Covers timeline, members, and admin routes.

### 2) Shell (top-level page card layer)
- `shell`
- `shellBorder`
- `shellBlur`
- Owned by page root container (TimelineV3 shell).

### 3) Tool (core timeline interaction area)
- `tool`
- `toolBorder`
- `toolBlur`
- Owned by timeline workspace container (track, markers, left/right controls).

### 4) Panel (event list container layer)
- `panel`
- `panelBorder`
- `panelBlur`
- Owned by EventList root panel.

### 5) Glass (sub-panel / accent controls)
- `glass`
- `glassBorder`
- `glassHover`
- Owned by lightweight filter/control blocks inside panels.

## Naming Rules (locked)

1. Tokens must be semantic (`canvas`, `shell`, `tool`, `panel`, `glass`) and not component names.
2. New themes can only change token values, not token meanings.
3. Component code should read tokens through `getTimelineSurfaceTheme(theme)`.
4. Avoid hard-coded mode checks (`theme.palette.mode === ...`) for timeline surfaces unless the value is intentionally non-token UI content.

## Layer Ownership Rules (locked)

1. Route wrappers own `canvas`.
2. Timeline page shell owns `shell`.
3. Timeline workspace owns `tool`.
4. EventList root owns `panel`.
5. EventList filter-type container owns `glass`.

## Dark Mode Reference Baseline (v1)

The current dark baseline is represented by `timelineSurfaceTheme.dark`.

Notable baseline decisions:
- Canvas uses the approved dark gradient.
- Shell border is seam-free (`transparent`) to avoid header collisions.
- Shell blur is `none` to avoid fixed-position FAB anchoring side-effects.
- Tool stays visually distinct and is treated as a protected high-priority surface.
- Panel border is seam-free (`transparent`) to match shell treatment.

## Audit Checklist (dark mode)

When changing timeline theming, verify these routes/states:

- Routes: Timeline, Members, Admin, Profile, Home
- States: default, loading, empty lists, dialogs open, lock screens, error boundaries
- Layout: desktop + mobile widths
- Positioning: floating FAB remains viewport-anchored
- Seams: no unintended borders crossing header controls

## Light Mode Baseline (in progress)

Light mode follows the same structural standard as dark mode:
- Canvas is gradient-first (not flat color) and is owned only by route wrappers.
- Shell/tool/panel/glass must remain visually separated from canvas for readability.

`hsl(41, 44%, 92%)` remains in scope as a light accent/reference for nested event-card container decisions, not as the route viewport canvas baseline.
