# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] DB REPOSITORY ALIGNMENT — Fixing the major issue where backend handles data internally instead of utilizing the iTimeline-DB repo.
- [ ] ANONYMOUS GUEST implementation — Paused (Partially implemented)

## Scope / Success Criteria
- Define Anonymous Guest product rules (capabilities, restrictions, conversion points, moderation/risk limits).
- Produce frontend-first implementation map (routes, guards, UI states, API touchpoints).
- Lock a minimal V1 scope before coding begins.
- Ensure public/non-private shared links are accessible without forced-login dead ends.
- Fix auth handoff so post-login continues to the originally requested destination.

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [ ] Audit backend `app.py` and `routes/` to identify all internal model definitions that should be in `iTimeline-DB`.
- [ ] Fully transition backend to use the `itimeline_db` package for ALL shared data structures.
- [ ] Sync and apply "staged" changes in `iTimeline-DB` to ensure the backend is actually using the latest repository state.
- [ ] Resolve the `db = None` initialization flaw in `iTimeline-DB` package so it can be reliably imported without fallbacks.
- [ ] (Guest Mode) Clean up the `api/auth/validate` and `sync` routes once the model transition is stable.

- [ ] Phase 1A — Data contract: add/confirm user-preference fields for `home_initial_tab` (`popular|home`), `date_of_birth`, and `user_color` with DB persistence.
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
- [ ] Phase 1G — Privacy settings ideation: define profile privacy toggle scope (what becomes private, who can view, and route/API implications).
- [ ] Anonymous Guest Ideation 1 — Define guest permissions matrix (view/search/follow/report/post/comment/vote).
- [ ] Anonymous Guest Ideation 2 — Define guest session model (ephemeral ID, storage, expiry, and conversion to account).
- [ ] Anonymous Guest Ideation 3 — Define guardrails/abuse prevention (rate limits, action gating, reporting constraints).
- [ ] Anonymous Guest Ideation 4 — Define UI language and route-level behavior for guest state across Home/Landing/Timeline.

### Profile implementation pillars (new major active TODOs)
- [ ] Profile Modules Framework follow-up: public profile module read path for non-owner viewers needs explicit API contract.
- [ ] Mailbox / Letters: profile-level letter sending/receiving flow with moderation-safe baseline behavior.
- [ ] Theory Board (final in this sequence): standalone profile module tool with detective corkboard identity.
  - [ ] Architecture lock: keep Theory Board as standalone module system.
  - [ ] Visual lock: framed corkboard shell fixed; inner corkboard remains interactive canvas.
  - [~] Infra dependency note: backend endpoints require iTimeline-DB migration `migrations/add_theory_board_tables.py`.
  - [~] Wheel zoom behavior validation: currently fullscreen-only by design; confirm this remains desired.
  - [ ] Node source lock (V1): owner can add nodes via text input; frontend parses/renders rich chips (@, #, i-, www/http) from cell payload.
  - [ ] Node rendering lock (V1): event nodes render as timeline-style event hover cards on the corkboard; card click still opens EventPopup.
  - [ ] Ownership lock: only profile owner can add/edit/delete/reposition nodes; visitors are view-only (drag/zoom allowed).
  - [ ] Pin mechanic lock: each node has a visual random-color tac pin at top-middle; dragging the pin moves the card.
  - [ ] Link mechanic lock: yarn-style edges between nodes with slight weighted droop aesthetic.

## Current Status Snapshot
- GOALPLAN has been slimmed to active/in-progress work only.
- Completed implementation context and milestones have been moved into README for long-term reference.
- Current execution window: Anonymous Guest ideation (with profile/home follow-ups remaining in queue).

## Learned / Required Systems Before Finalizing Remaining Home Tabs
- Add a user follow system (follow/unfollow + followed-users retrieval) to power FRIENDS LIST and later YOUR PAGE.
- Add a hashtag-follow system to support POPULAR/YOUR PAGE personalization signals.
- Defer new hashtag timeline UI behavior until follow-table migration is complete.
- Treat community membership as follow-equivalent for ranking/feed logic.
- Keep existing search visibility constraints as baseline policy (no private communities in discovery; no personal timeline content in search/popular pools).

## Pending TODOs ( larger tasks that are toward completing main goal )
- [ ] NSFW filter
- [ ] # hashtag chip voting system
- [ ] make a home page submission box
- [ ] consider timeline deletion capability (requirements + UX)
- [ ] reorganizing community admin page action card settings under INFO CARDS umbrella
- [ ] timeline theming architecture hardening (light + dark + future theme packages)
  - [ ] Final visual tuning pass under the new model (remaining light-mode micro-surfaces + interaction states).
- [ ] Anonymous Guest implementation (ideation → scope lock → phased rollout).
- [ ] audit website , looking for any signs of possible inflation in frontend or backend that can be migrated to DB repo
- [ ] define exact fallback-image rules for news/link events and improve image preview reliability across event cards, hover cards, and event popups
- [ ] Consolidate App.js and App.jsx — currently both files exist and both have been edited. The real active entry is App.js (loaded by index.js). App.jsx should be removed or merged to avoid split-brain confusion.
- [ ] MAJOR: Fix iTimeline-DB repository utilization. Backend is currently handling data internally, causing a "split-brain" where staged DB changes in the repo are ignored.


## Notes / Decisions
- Completed history/context has been migrated to README to keep GOALPLAN execution-focused.
- Community timeline membership counts as follow-equivalent.
- Priority alignment: continue reducing schema inflation by migrating durable contracts to iTimeline-DB when appropriate.
- POPULAR signal target: timeline popularity via membership/follow + post volume; post popularity via total votes.
- YOUR PAGE target feed: community posts from memberships + posts by followed users (excluding personal posts) + posts from followed hashtags.

## Anonymous Guest — Ideation Kickoff (V1 Draft)
- Product intent lock (Apr 2026): improve shareability by auto-entering a read-only guest account when non-authenticated users open share links.
- Naming lock: guest account label is **Goblin Mode**.
- Auth architecture direction (V1): frontend guest identity with backend guest JWT/claim checks; no dedicated DB user row required for initial launch.
- Entry-point lock (V1):
  - Auto-enter Goblin Mode for unauthenticated share/deep-link opens.
  - Auto-enter Goblin Mode for unauthenticated Home entry.
  - Add Goblin Mode CTA on Login and Register pages (`Goblin-Mode` block + `Enter as View-only` copy + `GUEST` button) that logs into Goblin Mode and routes to Home.
- Access allowlist (Goblin Mode):
  - Can view public timelines (hashtags + non-private community timelines).
  - Can view public event popups/content reachable from public surfaces.
  - Can view public profiles.
  - Can use search (view-only) and open external links visible from allowed content.
- Access denylist (Goblin Mode):
  - No post creation, no timeline creation, no joining memberships.
  - No promote/demote/member management actions; no friend/follow social actions.
  - No adding to personal timelines.
  - No reporting content.
  - FAB sub-actions should be hidden by default in Goblin Mode (possible exception: share/trading-card actions if safe).
- Privacy/guard behavior lock:
  - Goblin Mode must be blocked from private/community-restricted routes using lock-screen flow.
  - Introduce a dedicated Goblin redirect page for blocked destinations.
  - Private profile attempts in Goblin Mode should use Goblin redirect page (not private-profile access-key flow).
  - Redirect page CTAs: (1) go back, (2) go to Login/Register, (3) go Home.
  - Messaging must clarify: user may have access on their real account but is currently in Goblin Mode.
- Share-link behavior lock:
  1. Not logged in + destination public => auto-enter Goblin Mode and continue to destination.
  2. Not logged in + destination private/restricted => auto-enter Goblin Mode, then show Goblin redirect page.
  3. Already authenticated account => existing direct behavior.
- Auth handoff lock:
  - Cache full incoming URL while in Goblin Mode and resume it after login/register on real account.
  - If still unauthorized after auth, fallback to Home.
- UX parity lock:
  - No persistent Goblin banner is required.
  - Goblin Mode should feel close to a normal logged-in account except for restricted capabilities.
  - Exiting Goblin Mode is done via standard logout actions.

## System Map (List of Interactions)
- Current route baseline (frontend): `home`, `timeline-v3/*`, and `profile*` are behind `ProtectedRoute` in `src/App.js`.
- Goblin route-guard map (V1 draft):
  1. **Entry interceptor (pre-route)**
     - On app boot + route change, if unauthenticated and destination is public-eligible, mint/activate Goblin session and continue.
     - Preserve `returnTo` as full URL (path + query + hash).
  2. **Public-eligible routes in Goblin**
     - `/home` (read-only surfaces only)
     - `/timeline-v3/:id` and slug variants for public timelines only
     - `/profile/:userId` for public profiles only
  3. **Blocked in Goblin -> redirect page**
     - Private community timelines / membership-required timeline surfaces
     - Private profiles
     - Any write-capable or moderation surface (`/timeline-v3/:id/admin`, create/edit/report endpoints, etc.)
  4. **Auth handoff**
     - From Goblin redirect page CTA to login/register, complete normal auth, then consume `returnTo`.
     - If post-login authorization still fails, send user to `/home`.
- Phased implementation order lock (requested):
  1. Start with guest profile route work using **`/profile/guest`** as first implementation wedge.
  2. Then wire guest-aware profile guard behavior for `/profile/:userId` (public vs private).
  3. Then expand same guard contract to timeline and home surfaces.
