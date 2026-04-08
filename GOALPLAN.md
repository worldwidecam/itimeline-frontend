# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [x] Profile page implementation — Phase 1 (COMPLETE)

## Scope / Success Criteria

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
- [x] Home Hero Make-a-Post advanced search now preloads followed timeline candidates, filters to post-allowed timelines, and shows prefix + timeline type columns.
- [ ] Phase 1D — Profile share behavior: wire profile FAB share to existing trading-card share capability.
- [x] Personal timeline post-permission hardening: visitor view access no longer implies create-post access (FAB create action hidden for non-owner viewers; backend event-create now enforces owner/site-owner-only posting on personal timelines).
- [x] Community Admin privacy toggle pass: private/public switch now stages locally and only enforces via backend on `SAVE CHANGES` (warning + cooldown chip still respond immediately in UI); private-description copy updated to "Only approved members can view this Timeline".
- [x] Community Admin image-cover placement pass: Image Cover Select upload/preview/framing controls moved from upper Timeline Settings area into the dedicated lower `Image Cover Select` section.
- [x] Community Admin posting/tagging scope controls: added `Restrict Posting & Tagging` setting with `moderator|admin` minimum role, wired through timeline settings load/save payload and enforced in backend for both event create and timeline tagging (`add-event`) paths.
- [ ] Phase 1E — Color consumer rollout audit: apply user color preference to known identity surfaces (including profile avatar border and user cards) and catalog remaining gaps.
- [ ] Phase 1F — Regression + responsive validation across profile/home surfaces.
- [ ] Phase 1G — Privacy settings ideation: define profile privacy toggle scope (what becomes private, who can view, and route/API implications).

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
  - [x] Text bubble contrast refinement: dark-mode owner-side (left) bubble shifted to soft off-white with stronger black-edged text treatment for readability vs visitor bubble.
  - [x] Rich text readability follow-up: plain text segments now inherit bubble text color in Profile Texts, and `@user` chip label color is explicitly dark-mode-safe (prevents black-on-dark regression).
  - [x] Profile privacy v1 pass: Profile Settings now persists `profile_visibility` (`public|private`) and optional `profile_access_key` in passport preferences.
  - [x] Profile access gate baseline: profile route now calls `/api/v1/users/{id}/profile-access` and enforces private lock-screen flow with access-key submit for disallowed viewers.
  - [x] Access contract lock: private-profile bypass includes owner and users followed by owner (from `user_follow` relation); non-bypass viewers require valid access key.
  - [x] Added dedicated profile-texts API surface for read/add/delete against profile owner Texts module while persisting in passport preferences (`profile_modules`).
  - [x] Rich-token click behavior normalized: `@`, `#`, `i-`, and links now open in new tabs by default; `~event` references remain in-page for event popup/navigation behavior.
  - [x] Username policy hardened to reject whitespace in signup and username-change flows (frontend validation + backend enforcement for register/profile update/required username change).
  - [ ] Public profile module read path for non-owner viewers (if product chooses to expose modules publicly) needs explicit API contract.
- [ ] Mailbox / Letters: profile-level letter sending/receiving flow with moderation-safe baseline behavior.
- [ ] Theory Board (final in this sequence): standalone profile module tool with detective corkboard identity.
  - [ ] Architecture lock: Theory Board must be implemented as its own standalone module system (avoid TimelineV3-style scope creep into unrelated page responsibilities).
  - [ ] Visual lock: framed corkboard shell remains fixed; inner corkboard is the interactive canvas.
  - [x] Phase 0 scaffold: Profile Settings now includes Theory Board module enable/disable controls and persists in profile_modules.
  - [x] Phase 0 scaffold: Profile page renders Theory Board base corkboard + frame layer when enabled.
  - [x] Decision update: planned node input contract shifts from Event-ID-only to rich text cell input (chips for @, #, i-, www/http links).
  - [x] Hard switch complete: Theory Board node storage contract is now `cell_content` plain text (no `event_id` node payload contract).
  - [x] Persistence fix: theory_board module now survives profile refresh cycles (passport normalization + profile-text merge path preserve non-text modules).
  - [x] V1 polish: Theory Board module name is now user-configurable in Profile Settings and always displayed as `<Name> Board` on Profile.
  - [x] V1 polish: removed redundant inner Theory Board title; top strip now hosts starter controls.
  - [x] Visual-base pass: frame/cork styling tuned closer to real corkboard reference (wood grain frame + denser cork texture) for baseline sign-off.
  - [x] Interaction pass (V1 baseline): drag canvas, zoom controls, fullscreen toggle, and wrap-around cork texture movement.
  - [x] Fullscreen sizing refinement: fullscreen board now fills available viewport space more reliably.
  - [x] Initial-state framing: blank board now visually frames a single origin cell with perforated boundary cue.
  - [x] Recenter control: one-click recenter returns pan/zoom to origin-cell baseline.
  - [x] Top-strip action baseline: replaced placeholder copy with thumbtac `+Add` control and first-pin placement animation.
  - [x] Drag responsiveness pass: reduced pan lag by requestAnimationFrame-throttled board pan updates.
  - [x] Recenter pacing pass: recenter now eases into origin instead of snapping too quickly.
  - [x] Origin-cell visual simplification: removed translucent inner cell fill so perforation boundary remains primary baseline cue.
  - [x] Perforation bounds pass: boundary now expands to encapsulate all cells currently occupied by thumbtacs.
  - [x] Tack placement model pass: thumbtacs are now draggable; first tack is constrained to origin cell zone, subsequent tacks are free-placement across board space.
  - [x] Yarn styling pass: links shifted from dark line look toward segmented yarn-like strands with distance-aware weave cues.
  - [x] Adaptive zoom guardrail pass: zoom-out floor now adapts to occupied perforation bounds so full occupied workspace can remain viewable.
  - [x] Frame realism pass: outer wood frame darkened with layered grain overlays for less flat gradient appearance.
  - [x] Owner tac dash baseline: selecting a tac shows mini side dash with owner-only content input + delete control.
  - [x] Tac delete guardrail: origin tac cannot be deleted while non-origin tacs still exist.
  - [x] Tac content rendering baseline: text content renders as rich chips; pure event-reference content (`~id`) renders embedded event-style card preview with click-to-open EventPopup wiring.
  - [x] Toolbar cleanup pass: corrected label to `Thumb Tack`, removed icon backplate, and tightened icon/text spacing.
  - [x] Mini-dash interaction pass: Enter now submits + closes dash, Shift+Enter keeps newline behavior, and explicit submit arrow button added.
  - [x] Chip-only rendering polish: removed redundant outer content container when a tac payload is chip-only (non-event textless rich content).
  - [x] Pin/content alignment polish: content cards now sit closer so tack visually anchors to the content below.
  - [x] Add-tac placement refinement: new tacs now spawn at current viewport center (current board focus) instead of origin-biased placement.
  - [x] Mini-dash utility control: added non-destructive minimize button to close editor without deleting tac.
  - [x] Chip legibility refinement: added `solidChips` mode in RichContentRenderer and enabled it on Theory Board tac rendering for stronger pill backgrounds.
  - [x] Event reference card polish: `~id` cards now use timeline-like type strip + media/title/date preview composition for closer visual parity with marker hover cards.
  - [x] Interaction propagation fix: tac content cards now stop pointer-down propagation so chip clicks don't accidentally begin board pan.
  - [x] Mini-dash live chip indicator restored: input now shows active mention-type feedback while typing (`Tagging`, `Hashtag`, `Community`, `URL`, `Event`).
  - [x] Rich chip new-tab routing fix: mention chips now resolve app-relative routes to absolute URLs so new tabs no longer land on blank pages.
  - [x] Event preview reuse correction: Theory Board now reuses timeline event marker preview components (news/media/remark) instead of bespoke card recreation.
  - [x] Fullscreen EventPopup handoff fix: opening event references from fullscreen exits fullscreen first, then opens EventPopup in normal document context.
  - [x] Mini-dash indicator parity correction: switched from custom inline chip indicator back to existing RichEditor-style Popper + Paper detection cue pattern.
  - [x] Mention routing parity correction: RichContentRenderer now uses shared `getUserByUsername` + timeline-name fallback resolver (`/api/timeline-v3/name` and `/api/v1/timeline-v3/name`) for @/#/community chip targets.
  - [x] Community mention resilience: community chip resolution now retries with both bare name and `i-` prefixed name before failing.
  - [x] Fullscreen event-click behavior correction: removed forced fullscreen exit in Theory Board event-reference click handler; EventPopup now opens directly via existing callback path.
  - [x] Fullscreen chip interaction lock: Theory Board now passes `disableInteractions` to RichContentRenderer while fullscreen so rich chips are intentionally non-clickable in fullscreen mode.
  - [x] Yarn cut mode (owner): added scissors toolbar control to enter/exit cut mode; clicking a yarn segment now removes the connection.
  - [x] Yarn cut transition polish: cut yarn now plays a taut-to-limp drop/fade animation before final removal.
  - [x] Mini-dash yarn creation flow: added fourth mini-dash action button to start yarn from selected tack and complete by clicking a second tack.
  - [x] Create-yarn live preview: while in yarn-create mode, pending yarn endpoint now follows pointer until target tack is chosen.
  - [x] Toolbar order polish: fullscreen control restored to far-right position in Theory Board toolbar.
  - [x] Scissors UX polish: cut mode now auto-exits after a single yarn cut (re-arm by pressing scissors again).
  - [x] Mini-dash action layout polish: converted from one horizontal row to compact 2x2 action grid.
  - [x] Yarn-create icon polish: replaced hyperlink-like icon with a node-connection icon for clearer intent.
  - [x] Toolbar action relocation: moved `Add yarn` out of mini-dash and into top-right toolbar between scissors and fullscreen.
  - [x] Persistence integration (load): Theory Board now hydrates from `/api/v1/users/{id}/theory-board` snapshot on module mount/profile switch.
  - [x] Persistence integration (save): centered toolbar Save button now writes board state (nodes, yarn edges, viewport) to Theory Board backend endpoints.
  - [x] Save UX: dirty-state tracking added for pan/zoom/pins/yarn, with save feedback messaging (`Saving...`, `Board saved.`, and error states).
  - [x] Yarn persistence correction: removed auto-reseed fallback that reconnected links when yarn set became empty, so cut connections remain removed after save/reload.
  - [x] Storage-unavailable guardrail: when backend returns `503 Theory Board storage is unavailable`, module now surfaces explicit migration-needed feedback and disables Save to prevent repeated failing writes.
  - [~] Infra dependency note: Theory Board backend endpoints require DB tables (`theory_board`, `theory_board_node`, `theory_board_edge`) from iTimeline-DB migration `migrations/add_theory_board_tables.py`.
  - [x] Pin color decision pass: non-origin tacks now render with randomized palette colors (seeded) while origin-cell tack is always red.
  - [x] Content card sizing fix: tack content containers no longer clamp to cell-scaled dimensions, preventing paragraph/chip/event text clipping.
  - [x] V1 completion checkpoint: owner flow + viewer restrictions validated (viewers cannot add thumbtacks); Theory Board considered complete for current scope.
  - [~] Wheel zoom behavior: currently restricted to fullscreen mode by design; validate this UX choice with user after next pass.
  - [~] Pin/yarn motion baseline: gravity-style idle animation scaffold added for thumbtacs and yarn links; tune values after richer node rendering lands.
  - [ ] Node source lock (V1): owner can add nodes via text input; frontend parses/renders rich chips (@, #, i-, www/http) from cell payload.
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
- [x] Friends List right-hub now includes `Following` + `Followers` sub-tabs (both sourced from user-follow graph endpoints).
- [x] Friends List right-hub polish: added 🔥 tally chips for both sub-tabs and privacy disclaimer clarifying that users you follow can view your private profile.
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
- [x] Profile page implementation (existing page needs full build-out) — COMPLETE
- [ ] # hashtag chip voting system
- [ ] make a home page submission box
- [x] sharing link system
- [ ] consider timeline deletion capability (requirements + UX)
- [ ] reorganizing community admin page action card settings under INFO CARDS umbrella
- [ ] odds and ends. things like user count on landing page, community timelines getting an image background option.
- [x] update the members page and admin page buttons to FAB
  - [x] Members page now has community navigation/report FAB stack (Timeline/Members/Admin + Report).
  - [x] Admin page now has community navigation FAB stack (Timeline/Members/Admin) with dynamic upward shift when Save FAB appears.
  - [x] Shared FAB refinement pass: timeline marker icon adjusted (longer baseline + taller marker stem), report action moved to top-most slot, create action remains closest to main FAB with emphasized sizing, and current-page nav sub-button is hidden.
  - [x] Shared FAB visual parity pass: Timeline/Members/Admin buttons now use unified outlined glow styling with distinct accent colors and admin nav icon switched to gear/settings icon.
  - [x] Admin nav FAB accent tuned to lighter purple to separate from Timeline nav blue.
  - [x] Admin offset motion pass: shared FAB bottom-position changes now animate smoothly to match Save FAB fall-in movement.
  - [x] Final cleanup: removed CommunityDotTabs renders/imports from TimelineV3, Members, and Admin surfaces (legacy component now unreferenced/deprecated).
  - [x] NavFab consolidation pass: extracted generic `community/NavFab.js`, converted `CommunityNavFab` into a compatibility wrapper, and rewired TimelineV3 hashtag/personal/community FAB stacks plus Members/Admin usages to the shared NavFab primitive.
  - [x] Personal timeline FAB parity pass: owner-only `Access Panel` control moved from legacy inline header button into FAB as a gear/settings sub-action; non-community main FAB disable logic now respects personal-owner settings availability.
  - [x] Wrapper audit pass: verified no active `CommunityNavFab` imports remain in `src/`; completed hard cleanup by deleting `community/CommunityNavFab.js`.
- [x] what's the color behind the light theme description box in EventPopups? i love it. can we have that color be the light theme container background color standard now? instead of this harsh bright white? exception would be for light-theme EventPopups and other color coordinated things of their own.
- [ ] timeline theming architecture hardening (light + dark + future theme packages)
  - [x] Introduced shared timeline surface token map (`timelineSurfaceTheme`) to define canvas/shell/tool/panel/glass layers by mode.
  - [x] Rewired timeline route viewport + TimelineV3 shell/tool + EventList panel/filter layers to use shared surface tokens instead of scattered one-off mode conditionals.
  - [ ] Do full visual tuning pass for both light and dark under the new model (light is intentionally not treated as final yet).
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

