# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] Timeline cover image implementation

## Scope / Success Criteria
- Timeline cover image can be uploaded, saved, and rendered reliably on timeline surfaces.
- Cover image behavior is stable across desktop and mobile breakpoints.
- Existing timeline routes/integrations remain intact.
- No placeholder/mock data is introduced.
- Site Control/Timeline admin flow for cover image stays clear and actionable.

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [ ] Audit existing timeline image fields + where cover image should be sourced/rendered.
- [ ] Define accepted image constraints (formats, size guidance, crop behavior, fallback behavior).
- [ ] Implement/update upload + persistence flow for timeline cover image.
- [ ] Wire cover image rendering in timeline header/surfaces.
- [ ] Validate create/edit flows and ensure no regressions to timeline loading.
- [ ] Validate desktop + mobile rendering behavior.

## Current Status Snapshot
- Home page broken-events workflow: complete for audio/image/video auto-reporting + Open Event + historical Deleted status handling.
- Home hub baseline remains stable (Search/My Creations/Friends List/Popular/Your Page progress preserved).
- Current implementation focus moved to timeline cover image.

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

### Archived from Home broken-events implementation
- [x] Logs tab with Broken Events vertical sub-tab implemented.
- [x] Home auto-reporting for media failures now includes audio, image, and video paths.
- [x] Open Event action in Logs > Broken Events opens EventPopup for review.
- [x] Deleted-event handling improved: stale home auto-reports for removed events are ignored and intentional deletions can retain historical log status.

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

