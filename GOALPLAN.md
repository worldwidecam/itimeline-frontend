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
- Implement baseline visual decoupling (static or wraparound line, no min/max marker width).
- Implement wraparound tick rendering (viewport + 1 buffer) with fixed spacing.
- Update left/right button logic and marker buffer assumptions after tick wrap changes.

## Completed
- (none yet)

## Notes / Decisions
- TimelineV3 currently does too much; scope should be timeline workspace + timeline only.
- Scan line was a temporary lighting proxy for vote dots; safe to remove now.
- Ongoing baseline split context:
  - Baseline can be static or wraparound; goal is no X translation and no reliance on min/max marker width.
  - Tick marks should wrap around (Pac-Man style) with fixed spacing; labels do NOT wrap and are computed separately.
  - Keep marker spacing constant across view modes to avoid cascading system changes.
  - Labels remain centered on baseline offset; initial render remains at coordinate [0] (current time), Back to Present resets to [0].
  - Coordinate system should support a variable initial anchor (e.g., render around [-57]) rather than always starting at [0].
  - Current buffer/markers (e.g., ±10) and left/right navigation may need recalibration after wraparound.
  - Anchor transitions should be smooth (use existing fade/transition phases; labels fade out/in during anchor changes).
  - Default initial anchor remains [0] (current time), with offset computed as 0 on initial load.
- Verbatim user notes (baseline/coordinate split):
  - "i left out the marker labels (including coordinate number labels)"
  - "scrolling doesn't work forever, and the 'left' 'right' buttons work a little longer but they still break eventually"
  - "the goal of splitting them into equally important but separate halves is for two reasons"
  - "the first reason is we can make the timeline work so much better and scroll infinitely. ESPECIALLY if we unlink coordinates from it."
  - "with Coordinates and coordinate labels its own separate logic, we could stop handling all the rendering logic weight all on reference point [0]."
  - "we can make it interchangeable. we can make scrolling faster when all these markers (and event markers) stop trying to catch up with every dramatic scroll."
  - "labels in the new system will be centered around current baseline offset , and first initial render of a timeline page will still be on point [0] , which will still mean today/this time. and 'back to present' button will still refresh onto [0]."
  - "of course we are keeping our special markers."
- Timeline structure analysis (current):
  - Baseline (TimelineBar) renders a single horizontal line sized to min/max markers and translates via timelineOffset.
  - TimeMarkers renders both tick lines and coordinate labels together, positioned from window.innerWidth/2 + value * markerSpacing and translated by timelineOffset.
  - HoverMarker uses the same center + markerSpacing math and translates with timelineOffset.
  - Left/Right buttons use smoothScroll to animate timelineOffset.
  - EventCounter uses currentIndex + filters to drive selection and carousel navigation, not baseline rendering.
  - View buttons (day/week/month/year) route through handleViewModeTransition with fade phases and state resets.
  - All of these live inside the TimelineV3 workspace container and share the same offset-based coordinate system.

## System Map (List of Interactions)
- TimelineV3 -> EventMarkers V2 Canvas (single source of event markers + vote dots)
- TimelineV3 -> Scroll/Drag input -> Timeline position

