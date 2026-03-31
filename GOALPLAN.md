# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] Profile page implementation — Phase 1 (NEW CURRENT FOCUS)
  - [ ] Finalize profile page visual hierarchy and layout system.
  - [ ] Complete profile settings and profile-adjacent dialog styling consistency pass.
  - [ ] Ensure profile actions/reporting/settings flows remain behaviorally unchanged while UI is standardized.
  - [ ] Validate mobile/desktop responsiveness for all profile surfaces.
  - [ ] Phase 1 lock: Home init preference from Profile Settings (`popular|home`, default `popular`) persisted to DB + cache.
  - [ ] Phase 1 lock: Birthday input includes year; age used for backend policy gating only (no public age display).
  - [ ] Phase 1 lock: Single profile image upload flow (no duplicate systems) powering both circular avatar behavior and trading-card portrait metadata.
  - [ ] Phase 1 lock: Keep dotted-line avatar upload UI treatment in Profile Settings.
  - [ ] Phase 1 lock: Profile FAB share wiring uses existing trading-card share flow.
  - [ ] Phase 1 lock: One user color preference (native color input) reused across profile identity surfaces (including avatar border color).

## Scope / Success Criteria
- Profile page is fully implemented with clear section hierarchy and stable interactions.
- Profile surfaces are behaviorally consistent (edit/save/report/auth-related profile flows unchanged unless explicitly planned).
- New profile capabilities are validated across desktop and mobile breakpoints.
- Existing routes/integrations remain intact (including auth, profile settings, and report submission paths).
- No placeholder/mock data is introduced.
- Profile visual language follows established glass-form and settings-page styling standards.

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [ ] Phase 1A — Data contract: add/confirm user-preference fields for `home_initial_tab` (`popular|home`), `date_of_birth`, and `user_color` with DB persistence.
- [x] Profile Modules compartmentalized form flow in Profile Settings: title/description moved into dedicated form dialog opened by Add Module/Edit Module actions.
- [x] Rich-text token expansion baseline in active rich surfaces now includes `~eventId` references (`~113`) alongside `@`, `#`, `i-`, and `www.`.
- [ ] Phase 1A — Cache contract: mirror the same preferences in local cache for fast startup hydration (DB + cache required).
- [ ] Phase 1B — Profile Settings controls: add Home init preference toggle/select with only `popular|home` options.
- [ ] Phase 1B — Profile Settings controls: add birthday input (with year) and persist without rendering age publicly.
- [ ] Phase 1B — Profile Settings controls: add native HTML color input for single user identity color preference.
- [ ] Phase 1C — Unified image workflow: merge trading-card portrait controls into existing profile avatar uploader so one upload flow serves both outcomes.
- [ ] Phase 1C — Preserve existing dotted-line upload UI and existing circular avatar behavior.
- [ ] Phase 1D — Home boot behavior: initialize home tab from cached/DB-backed preference (`popular` default).
- [ ] Phase 1D — Profile share behavior: wire profile FAB share to existing trading-card share capability.
- [ ] Phase 1E — Color consumer rollout audit: apply user color preference to known identity surfaces (including profile avatar border and user cards) and catalog remaining gaps.
- [ ] Phase 1F — Regression + responsive validation across profile/home surfaces.

### Profile implementation pillars (new major active TODOs)
- [~] Profile Modules Framework: reusable module system for profile surfaces (target reuse of Community Info Cards patterns where applicable).
  - [x] Module display now renders in its own profile section below the main username/bio container and constrained to the same max width.
  - [x] Module management UI moved from profile page into Profile Settings as its own section.
  - [x] Profile module display now renders rich-text chips for `@`, `#`, `i-`, `www.`, and `~eventId` token patterns.
  - [x] Decision lock: keep only `Texts` as active selectable module type for now (legacy `Info Card` values normalize to `Texts`).
  - [x] `Texts` modules now render conversational bubbles with alternating lighter, theme-aware color treatment while preserving existing Info Card styling.
  - [x] Profile page module sections now use type-based titles and type-separated containers (no mixed-type container when multiple types exist).
  - [x] Profile Settings floating save control aligned to standard settings-page SAVE FAB pattern (portal-mounted fixed action state), with module changes persisted through main Save FAB flow.
  - [x] Singleton guard baseline added for future `Mailbox` and `Conspiracy Board` module types (max one each when enabled).
  - [x] Texts-first redesign pass: module-entry CRUD removed from Profile Settings in favor of generalized Texts module controls (enabled state + 10-item retention mode `manual|fifo`).
  - [x] Profile page Texts feed now supports profile-side text submission and owner-only deletion controls, with visibility gated by module enablement.
  - [x] Text bubble alignment now maps by author role (owner entries left, visitor entries right) and header label auto-renders as `USERNAME Says`.
  - [x] Added dedicated profile-texts API surface for read/add/delete against profile owner Texts module while persisting in passport preferences (`profile_modules`).
  - [x] Rich-token click behavior normalized: `@`, `#`, `i-`, and links now open in new tabs by default; `~event` references remain in-page for event popup/navigation behavior.
  - [x] Username policy hardened to reject whitespace in signup and username-change flows (frontend validation + backend enforcement for register/profile update/required username change).
  - [ ] Public profile module read path for non-owner viewers (if product chooses to expose modules publicly) needs explicit API contract.
- [ ] Mailbox / Letters: profile-level letter sending/receiving flow with moderation-safe baseline behavior.
- [ ] Theory Board (final in this sequence): standalone profile module tool with detective corkboard identity.
  - [ ] Architecture lock: Theory Board must be implemented as its own standalone module system (avoid TimelineV3-style scope creep into unrelated page responsibilities).
  - [ ] Visual lock: framed corkboard shell remains fixed; inner corkboard is the interactive canvas.
  - [ ] Interaction lock (V1): drag canvas, click corkboard to zoom in, double-click to zoom out.
  - [ ] Node source lock (V1): owner can add nodes by Event ID from profile-side drawer/palette.
  - [ ] Node rendering lock (V1): event nodes render as timeline-style event hover cards on the corkboard; card click still opens EventPopup.
  - [ ] Ownership lock: only profile owner can add/edit/delete/reposition nodes; visitors are view-only (drag/zoom allowed).
  - [ ] Pin mechanic lock: each node has a visual random-color tac pin at top-middle; dragging the pin moves the card.
  - [ ] Link mechanic lock: yarn-style edges between nodes with slight weighted droop aesthetic.
  - [ ] Node uniqueness rule: each grid cell is unique, but event IDs are not globally unique-enforced (same event may be pinned in multiple cells if user chooses).
  - [ ] Boundary visual lock: board workspace uses a perforated "ENDLINE" boundary with a one-cell visual buffer around occupied cells.
  - [ ] Auto-edge/workspace expansion lock: when node graph extends outward (ex: drag/add from M25 to N25), boundary auto-expands to keep one-cell buffer (ex: L24-N26 -> L24-O26).
  - [ ] Node deletion UX lock: use explicit tac-pin menu/icon action for delete (no destructive double-click delete baseline).
  - [ ] Canvas behavior lock: non-static reactive workspace; frontend owns presentation/activity, backend stores board state in structured/grid-like coordinates.
  - [ ] Scale guardrails (V1): max 50 nodes per Theory Board.
  - [ ] Moderation extension idea: add report-verdict option to disable user modules for a duration or indefinitely.
  - [ ] Mobile scope note: postpone full mobile editing to V2; evaluate universal fullscreen mode (available to owner and visitors) as likely V1 accessibility affordance.

### Profile ideation queue (locked into Phase 1)
- [x] Popular vs Home tab preference toggle.
- [x] Birthday input (with year; age for backend gating only, no public display).
- [x] Share capability with trading card via profile FAB.
- [x] Single user color preference input for identity surfaces.

### Home page polish tracker (Mar 2026)
- [ ] Hero banner slide expansion
  - [ ] Expand slide content so each supported slide type uses available media/cover imagery when present.
  - [ ] Keep graceful fallback visuals when no image is available.
- [ ] Hub container light-mode visual adjustment
  - [ ] Apply hero-family gradient background styling to left and right hub containers in light mode.
  - [ ] Verify readability/contrast for cards, chips, and text over updated gradients.
- [ ] FAVORITE tab implementation (phased)
  - [ ] Timeline-card favorite action: add star toggle above Open Timeline CTA.
  - [ ] Persist favorite timeline per-user.
  - [ ] FAVORITE tab timeline summary surface: trading card, title/banner, follower count.
  - [ ] Include optional timeline extras when available: action cards, quote, status.
  - [ ] Add right-side scroll region for events tied to selected favorite timeline.

### Home page UX refinement tracker (Mar 2026)
- [x] FAVORITE tab parity pass: right-hub scroll tracking + left-hub scroll-up and LOAD MORE support + favorite post reveal batching.
- [ ] FAVORITE tab: add CREATE POST CTA (when favorite timeline exists) wired to EventFormDialog with favorite timeline preselected.
- [ ] Hero Welcome slide settings: add toggle between manual timeline ID and auto-select top timeline by members/followers.
- [ ] Event Spotlight of the Day settings: add mode for top-voted event constrained to current-day publish date.
- [ ] Promote Home hero "Create Timeline" form styling into site-wide form/input baseline guidance and apply progressively.

### Hashtag cover implementation tracker (Mar 2026)
- [x] Decision: hashtag settings authority = SiteOwner + SiteAdmin (same authority at this level).
- [x] Decision: use dedicated hashtag settings flow (not random timeline image selection).
- [x] Add FAB gear sub-action entry for hashtag settings (role-gated).
- [x] Add hashtag settings dialog scaffold (description + portrait cover upload/pan/zoom + save).
- [x] Include hashtag timeline in FAB trading/share card portrait cover rendering.
- [x] Validate end-to-end save + refresh behavior across timeline page and Home timeline-card surfaces.

## Current Status Snapshot
- Home page broken-events workflow: complete for audio/image/video auto-reporting + Open Event + historical Deleted status handling.
- Home hub baseline remains stable (Search/My Creations/Friends List/Popular/Your Page progress preserved).
- Timeline cover implementation is now complete across community, personal, and hashtag surfaces.
- Hashtag settings workflow now includes role-gated FAB gear (SiteOwner/SiteAdmin), description editor, portrait upload/framing, save flow, and Home timeline-card portrait usage.
- Form styling baseline rollout is now implemented across core targeted forms/dialogs (EventFormDialog, HashtagSettingsDialog, PersonalAccessPanel, Login, Register, RequiredUsernameChangePage, Profile report dialog, ProfileSettings baseline surfaces).
- Current execution window: Profile page implementation.

## Implementation Learnings / Nuances (Mar 2026)
- Home timeline-card consistency depends on both rendering and data shaping.
  - Shared timeline card renderer is reused across Home tab timeline sub-tabs.
  - A prior mismatch came from Your Page timeline objects being rebuilt without all cover/framing fields; preserving full timeline fields fixed this.
- Personal timeline portrait framing parity now follows the same renderer path used by other Home timeline lists.
- TimelineV3 is carrying broad responsibilities; new hashtag settings were introduced as a self-contained dialog module so they can be extracted later.
- Cache-version bumps are sometimes required when timeline object shape changes, to prevent stale session-cached cards from masking fixes.
- Cloudinary video 404 console noise can be amplified by aggressive fallback source retries.
  - Keep original full Cloudinary URL as primary source when available.
  - Avoid deriving extra .mp4/.webm/no-extension variants from the same Cloudinary ID in that case.

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
- [x] Investigate slow loading for Home > POPULAR and YOUR PAGE tabs (identify bottlenecks + solutions)
- [ ] NSFW filter
- [x] Profile page implementation (existing page needs full build-out) — CURRENT BIG MAIN FOCUS
- [ ] # hashtag chip voting system
- [ ] make a home page submission box
- [x] sharing link system
- [ ] consider timeline deletion capability (requirements + UX)
- [ ] reorganizing community admin page action card settings under INFO CARDS umbrella
- [ ] odds and ends. things like user count on landing page, community timelines getting an image background option.
- [ ] update the members page and admin page buttons to FAB
- [x] what's the color behind the light theme description box in EventPopups? i love it. can we have that color be the light theme container background color standard now? instead of this harsh bright white? exception would be for light-theme EventPopups and other color coordinated things of their own.
- [ ] audit website , looking for any signs of possible inflation in frontend or backend that can be migrated to DB repo
- [ ] define exact fallback-image rules for news/link events and improve image preview reliability across event cards, hover cards, and event popups


## Completed
### Archived from recent Community Action Cards work
- [x] Phase 2 refinements for Community Action Cards (vote reset behavior, animation blink fix, Day of Action redesign)
- [x] Phase 3 extension of existing status-message system with `bronze_action`, `silver_action`, `gold_action`
- [x] Action status landscape popup polish (medal icon behavior + tally/progress footer order)
- [x] Non-member action-status popup variant (blurred card with overlay: "Oops! you're not a member")
- [x] Validate threshold-not-met action-status footer behavior (shows current tally/progress)

### Archived from Pending TODOs
- [x] Update/improve remark cards look
- [x] Personal timeline cover image implementation (portrait upload/framing + Save flow + Home/FAB/share parity)
- [x] Timeline cover image implementation complete (community + personal + hashtag settings/surfaces)
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

