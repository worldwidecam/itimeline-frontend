# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] Home page implementation (SEARCH + MY CREATIONS + FRIENDS LIST + HASHTAG FOLLOW complete; next: POPULAR + YOUR PAGE)

## Scope / Success Criteria
- Home page loads end-to-end with real data (no dead sections).
- Primary actions on home page are functional (navigation, core CTA flow, and key interaction blocks).
- Layout and behavior are stable across desktop and mobile breakpoints.
- Existing routes/integrations are preserved without breaking timeline entry points.
- Home route remains `/home` (target production URL: `i-timeline.com/home`).
- Remove dev-only Home sections (e.g., Media Uploader Test).
- Hero banner supports ellipsis catalog with auto-rotation every 2 minutes.
- No placeholder/mock data is introduced for Home v1.
- Left hub and right hub lock vertically under navbar; right hub scrolls internally.

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [x] Audit current Home page component, route wiring, and data dependencies.
- [ ] Define minimal shippable Home page behavior and section-level acceptance criteria.
- [ ] Implement missing functional sections and hook up real API-backed data.
- [ ] Validate mobile + desktop behavior and confirm no routing regressions.
- [ ] Build hero ellipsis catalog with v1 options: current hero + Timeline Spotlight of the Day; auto-rotate every 2 minutes.
- [x] Build left hub as vertical reference/tabs for right hub mode selection; first mode = TIMELINE SEARCH.
- [x] Build right hub as primary internal-scroll container driven by selected left hub mode.
- [x] Complete SEARCH hub tab (timeline/post/user search + users listing polish pass).
- [x] Complete MY CREATIONS tab (timelines/posts filter + smooth two-phase tab/sub-tab transition + loading-state handoff).
- [x] Stabilize and redesign REMARK card + REMARK popup typography/drop-cap alignment.
- [x] Implement HASHTAG FOLLOW system (persistence + API + UI controls) to support POPULAR and YOUR PAGE signals.
- [x] Complete follow-table ownership migration into iTimeline-DB (user_follow now; timeline_follow scaffold for hashtag watch/follow).
- [ ] Build POPULAR tab (replace placeholder tab; define ranking window + cards shown in right hub).
- [ ] Build YOUR PAGE tab (list timelines/posts from accounts the current user follows + followed hashtags).
- [x] Build FRIENDS LIST tab (reuse SEARCH users-card styling baseline; no search field, followed users only).

## Current Status Snapshot
- SEARCH tab: complete and stable.
- MY CREATIONS tab: complete and confirmed smooth by user after two-phase transition refactor.
- REMARK card + popup: style and UX significantly improved; popup drop-cap alignment issue fixed.
- FRIENDS LIST tab: complete (followed-users data + follow/unfollow via Actions menu confirmed by user).
- HASHTAG FOLLOW system: complete (DB migration + backend endpoints + TimelineV3 Watch button).
- Next feasible implementation: POPULAR tab, then YOUR PAGE feed composition.

## Learned / Required Systems Before Finalizing Remaining Home Tabs
- Add a user follow system (follow/unfollow + followed-users retrieval) to power FRIENDS LIST and later YOUR PAGE.
- Add a hashtag-follow system to support POPULAR/YOUR PAGE personalization signals. — COMPLETE
- Defer new hashtag timeline UI behavior until follow-table migration is complete; only catalog design decisions in GOALPLAN during this phase.
- Treat community membership as follow-equivalent for ranking/feed logic.
- Keep existing search visibility constraints as baseline policy:
  - no private communities in public discovery contexts
  - no personal timeline content in search/popular-style pools

## Pending TODOs ( larger tasks that are toward completing main goal )
- [x] Update/improve remark cards look
- [ ] NSFW filter
- [ ] Profile page implementation (existing page needs full build-out)
- [ ] # hashtag chip voting system
- [ ] make a home page submission box
- [ ] sharing link system
- [ ] reorganizing community admin page action card settings under INFO CARDS umbrella
- [ ] odds and ends. things like user count on landing page, community timelines getting an image background option.
- [ ] update the members page and admin page buttons to FAB
- [ ] what's the color behind the light theme description box in EventPopups? i love it. can we have that color be the light theme container background color standard now? instead of this harsh bright white? exception would be for light-theme EventPopups and other color coordinated things of their own.
- [ ] audit website , looking for any signs of possible inflation in frontend or backend that can be migrated to DB repo


## Completed
### Archived from recent Community Action Cards work
- [x] Phase 2 refinements for Community Action Cards (vote reset behavior, animation blink fix, Day of Action redesign)
- [x] Phase 3 extension of existing status-message system with `bronze_action`, `silver_action`, `gold_action`
- [x] Action status landscape popup polish (medal icon behavior + tally/progress footer order)
- [x] Non-member action-status popup variant (blurred card with overlay: "Oops! you're not a member")
- [x] Validate threshold-not-met action-status footer behavior (shows current tally/progress)

### Archived from Pending TODOs
- [x] Update/improve remark cards look
- [x] Home tab transition refactor: render/animation first, then async data fetch behind loading state
- [x] Update Profile Settings, Members Page, and Admin Page to match Site Control settings styling standard
- [x] reporting action cards
- [x] go back and fully implement action cards
- [x] Site admin page (timeline report tickets implementation) — COMPLETE
- [x] Community Action Cards refinement (Phase 2 + Phase 3 status work) — 

### Archived from previous Active sub-TODOs (Site admin page)
- [x] Ideation phase
- [x] site control page implementation
- [x] Global Reports: finish post tickets (remove Escalate button, add Resolve-Edit + Resolve-Delete)
- [x] Global Reports: build user tickets (data shape, UI, actions)
- [x] Global Reports: build timeline tickets (data shape, UI, actions)
- [x] Align lower-tier Community Admin report ticket styling with Site Control baseline
- [x] Timeline Ban Enforcement: banned timelines must be hidden from homepage timeline search, blocked from direct timeline access, and prevented from showing timeline chips on posts
- [x] Timeline Ban Impact Rules: define + enforce expected behavior for existing posts that originated from a now-banned timeline (visibility + timeline association handling)
- [x] Issue Warning Simplification: remove custom warning date input; keep duration as 3 days / 7 days / 10 days / INDEF
- [x] Issue Warning Scope Simplification: remove "mask targeted timeline content immediately" toggle and make scope selection itself control enforcement
- [x] General Warning Hardening: verify and fix general-warning journey end-to-end before expanding remaining warning options

- [x] Site Control + Community Admin report card baseline styling standardized (header order, grouped footer metadata, resolved verdict panel, type-accent borders)
- [x] Post ticket CTA refinement: View Event moved into Post Report Target container with resolved-delete exception preserved
- [X] for IMMEDIATE focus next time. i cannot click event markers on timelines. currently the drag mouse icon is overriding all clicking interactions.
- [x] Delete feature and logic (posts/events, creator + admin access)

- [x] Post-creation edit event option

- [x] Timeline motion dissipate: treat motion as zero-event state, pause event rendering during movement, and resume after settle delay.
- [x] Smoother timeline movement achieved via motion dissipate + delayed recompute.

## Notes / Decisions
- delete feature needs to be revisited once admin page is up
- edit feature needs to be revisted once admin page is up
- "delete post" button in community timeline > admin page > manage posts, needs to be revamped and changed to something regarding passing it higher to admin
- Site Control = higher tier: should retain all lower-tier actions, plus resolve-by-edit + resolve-by-delete actions (no Escalate button in Site Control).
- Escalation metadata already in reports: escalation_type, escalation_summary, escalated_by, escalated_at; timeline_id can map to community name; site admin pickup tracked via assigned_to when accepted for review.
- Home tabs implementation order: FRIENDS LIST first, then POPULAR, then YOUR PAGE.
- FRIENDS LIST definition: followed users only.
- FRIENDS LIST implementation status: complete and behavior confirmed (Actions menu, Follow/Unfollow, remove on unfollow).
- Community timeline membership counts as follow-equivalent.
- Next implementation priority: hashtag timeline follow system.
- Priority override: first migrate follow table ownership to iTimeline-DB to avoid backend schema inflation.
- Hashtag timeline header action decision (cataloged): replace legacy hashtag-only "Add Event" action with Follow/"Watch" (eye icon) once hashtag follow feature implementation starts.
- POPULAR signals target: timeline popularity via membership/follow + post volume; post popularity via total votes.
- YOUR PAGE target feed: community posts from memberships + posts by followed users (excluding personal posts) + posts from followed hashtags.

## System Map (List of Interactions)
- 

