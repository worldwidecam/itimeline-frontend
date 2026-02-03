# GOALPLAN — EventMarkers Version 2 (2026-01-29)

## Main Goal
" I'm creating this major Todo for Event markers because the current system is fine but it has 2 major issues. the first issue is that now we have many more systems in play and the timeline was the first thing i made on this website so it is outdated now. the second issue is that it is just too slow! we need to ideate and come up with a new version way to visualize the event markers that is extremely easy to render so no matter if the user is on day view or all the way to year view, they all run and move smoothly. "

## Major TODO (Current Focus)

- EventMarkers Version 2 (Canvas, V1-like rungs)

## Scope / Success Criteria

- EventMarkers V2 must perform consistently across day/week/month/year/position views (no view-by-view divergence).
- Initial implementation starts in month view (dense + sparse test case) but is designed to be view-agnostic.
- success will be a smooth and responsive timeline that can handle many events without lagging. 
- also, this system needs to works just as well and better than the old system did! so we can reduce and remove some code from TimelineV3, so it can focus more closely on purely its own thing.

## Current Phase

- Canvas V2 rebuild (V1-like, no wave, thin rungs)

## Planned Phases

- Keep V1 DOM markers running in TimelineV3 while Canvas V2 is built in isolation.
- Canvas V2: render only thin rungs with V1 color palette; position by x-value only (no wave).
- Canvas V2: remove proximity height/offset logic; reintroduce only if visually necessary.
- Canvas V2: hover = brightness fade in/out (no growth).
- Canvas V2: selected state = beacon pulse upward (no height increase).
- Canvas V2: explore dense response as thinner + taller rungs (soundwave feel).
- Transition plan: remove/replace V1 features one at a time (e.g., remove proximity height) while swapping in V2, until V1 is fully removed.

## List of TODOs

- Replace V1 base rungs with Canvas V2 base rungs (keep selection behavior intact).
- Ensure Canvas V2 recomputes marker positions when switching view modes.
- Restore deselect behavior when clicking empty timeline space (Canvas overlay).
- Restore B-key toggle behavior (pressing B should deactivate Point B when active).
- Restore timeline scroll/drag movement (wheel + drag), currently only left/right buttons move.
- Audit V1 marker position calc and align Canvas V2 x positions (simplify + replicate in Canvas 2D).
- Wire Canvas V2 into TimelineV3 without a toggle once core visuals match V1 intent.
- Replace V1 hover behavior with Canvas V2 brightness fade.
- Replace V1 selected marker pulse with Canvas V2 upward beacon.
- Introduce dense response experiment (thin + taller) as a separate step.


## Completed

- Fully map current EventMarker system interactions (EventList, EventCounter, hover, selection, call/response).
- Remove proximity-based height changes from V1 markers (first incremental swap step).
## Notes / Decisions

- Restart Canvas V2 from scratch: mirror V1 marker behavior without DOM.
- No wave: render rungs only.
- Rungs should be thinner than V1 for a minimal look.
- No proximity height/overlap offsets in the first Canvas pass.
- Hover uses brightness fade (no scale or glow swell).
- Selected state uses an upward pulse (beacon) instead of height growth.
- Use V1 color palette (five event-type colors) and position rungs by x-value only.
- EventCounter remains the precision navigator for exact selection.
- Canvas rungs fade in only after loading completes; fade out before view/filter/back-to-present transitions (CSS opacity on canvas).
- Selected DOM marker line removed; selected preview card remains as DOM overlay while Canvas owns rungs.
- Preview card shifts toward [0] so the rung stays visible beside it.
- Canvas rung baseline aligned to the TimelineBar (y at 75% height).
- Selected pulse uses a small gap and sine-fade to avoid hard collisions and snapping.

## System Map (Current V1 Interactions)

- TimelineV3 renders EventMarker via visibleEvents and passes selection/handlers.
- EventMarker click -> TimelineV3.handleMarkerClick -> activates Point B, sets selectedEventId, syncs currentEventIndex.
- EventCounter uses currentEventIndex/onChangeIndex to drive selection; updates selectedEventId in TimelineV3.
- EventList listens to selectedEventId to scroll/focus cards; TimelineV3 sets selectedEventId in multiple flows (clicks, nav, view changes).
- Hover is local to EventMarker (no shared hover state).
- Proximity height/offset logic is currently disabled (incremental swap step).
