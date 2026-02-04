# GOALPLAN — TimelineV4 (2026-02-04)

## Main Goal
- Refactor TimelineV3 to focus on timeline workspace + timeline rendering only, with better performance and clear separation of systems.

## Major TODO (Current Focus)
- Clean up TimelineV3 responsibilities (reduce bundled systems, isolate markers/vote dots, deprecate legacy logic).
- Fix broken scrolling + dragging (wheel + drag do nothing while buttons still move timeline).
- Rework transition system for view/filter changes to be simpler and more reliable.

## Scope / Success Criteria
- TimelineV3 only owns timeline workspace + core timeline rendering.
- Scrolling and dragging work for users in all view modes.
- Event markers + vote dots use a single unified data source (Canvas/EventMarkers V2 only).
- Legacy/unused marker logic removed without regressions.
- Scan line loop removed safely (no visual regression to vote dot glow timing).
- Baseline + coordinate markers re-architected so baseline can be infinitely scrolling and coordinate numbers scroll alongside, not tied to a single render block.

## Current Phase
- Audit + plan: identify redundant systems in TimelineV3 and map replacements.

## List of TODOs
- Audit TimelineV3 for legacy marker systems and remove/deprecate them once confirmed unused.
- Unify event marker + vote dot source to Canvas/EventMarkers V2 only.
- Remove scan line loop; confirm vote-dot glow timing still feels right.
- Fix scrolling and dragging input handlers (wheel + drag) to update timeline position.
- Simplify transition system to reduce coupled state + flicker risk.
- Split baseline rendering from coordinate marker rendering (infinite baseline + scrolling labels).
- Investigate memoized visibleEvents reuse to avoid recomputation.

## Completed
- (none yet)

## Notes / Decisions
- TimelineV3 currently does too much; scope should be timeline workspace + timeline only.
- Scan line was a temporary lighting proxy for vote dots; safe to remove now.

## System Map (List of Interactions)
- TimelineV3 -> EventMarkers V2 Canvas (single source of event markers + vote dots)
- TimelineV3 -> Scroll/Drag input -> Timeline position

