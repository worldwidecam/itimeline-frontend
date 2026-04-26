# GOALPLAN — iTimeline Frontend

## Main Goal
Rewire frontend to new TypeScript Cloudflare backend, leaving NO FEATURE behind.

---

## Current Status (April 23, 2026)

### What We're Doing
Systematically modernizing the frontend by wiring all API calls from legacy routes (`/api/*`) to the new backend's modern routes (`/api/v1/*`). This ensures feature parity and makes remaining issues visible as actual bugs rather than incomplete integration.

### Mindset
- **Backend direction lock**: Cloudflare TypeScript stack is canonical
- **Migration objective**: Reach full feature/function parity on Cloudflare backend, then remove legacy compatibility code
- **Data ownership**: DB is durable source of truth; frontend storage is temporary cache/hydration only
- **Legacy data is NOT the objective**: Make new data work equally well, don't chase legacy compatibility

### What We've Done
- [x] **Frontend API wiring complete** - All active components updated to `/api/v1/*` routes
- [x] **Timeline type field** - Backend returns `timeline_type` alias
- [x] **Event creator info** - Backend returns `created_by_username` in EventDTO
- [x] **Creator user color** - Backend returns `created_by_user_color`, frontend UserAvatar wired
- [x] **Creator profile link** - Changed from `/profile/:id` to `/profile/:username`
- [x] **Timeline warning-state endpoint** - Exists in timelines.ts routes
- [x] **Membership status endpoint** - Added `/api/v1/membership/timelines/:id/status`
- [x] **Blocked members endpoint** - Added `/api/v1/timelines/:id/blocked-members`
- [x] **Reports endpoint** - Added `/api/v1/timelines/:id/reports`
- [x] **MAJOR: iTimeline-DB repository utilization** - Backend uses canonical package models

### What We Have Left To Do
- [ ] **Functional verification** - Test each feature end-to-end now that wiring is complete
- [ ] **Cloudflare provisioning** - Create D1/R2/KV resources for deployment
- [ ] **Clean up Cloudinary references** - Optional cleanup after verification
- [ ] **Remove legacy backend** - Only after full verification

### Where We Currently Are
systems check (DEEP AUDIT - line-by-line verification):

## Authentication & Session (6 endpoints)
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/refresh
- [ ] POST /api/v1/auth/logout
- [ ] POST /api/v1/auth/validate
- [ ] POST /api/v1/guest/session
- [ ] POST /api/v1/auth/required-username-change

## Profile & User Management (10 endpoints)
- [ ] POST /api/v1/profile/update (multipart form with avatar upload)
- [ ] GET /api/v1/profile/music
- [ ] POST /api/v1/profile/music
- [ ] DELETE /api/v1/profile/music
- [ ] GET /api/v1/users/:id
- [ ] GET /api/v1/users/:id/music
- [ ] GET /api/v1/users/:id/profile-access
- [ ] POST /api/v1/users/:id/profile-access
- [ ] GET /api/v1/users/lookup
- [ ] GET /api/v1/users/:id/profile-texts (just added - needs deep audit)

## Follow System (8 endpoints)
- [ ] GET /api/v1/users/following
- [ ] GET /api/v1/users/followers
- [ ] POST /api/v1/users/:id/follow
- [ ] DELETE /api/v1/users/:id/follow
- [ ] GET /api/v1/timelines/following/hashtags
- [ ] POST /api/v1/timelines/:id/follow
- [ ] DELETE /api/v1/timelines/:id/follow
- [ ] GET /api/v1/timelines/:id/follow-status

## Timeline CRUD (8 endpoints)
- [ ] GET /api/v1/timeline-v3 (list timelines)
- [ ] POST /api/v1/timeline-v3 (create timeline)
- [ ] GET /api/v1/timeline-v3/:id
- [ ] PUT /api/v1/timeline-v3/:id
- [ ] DELETE /api/v1/timeline-v3/:id
- [ ] GET /api/v1/timeline-v3/name/:name
- [ ] POST /api/v1/timelines/merge
- [ ] DELETE /api/v1/timelines/:id

## Timeline Events (8 endpoints)
- [ ] GET /api/v1/timeline-v3/:id/events
- [ ] POST /api/v1/timeline-v3/:id/events
- [ ] GET /api/v1/timeline-v3/:id/events/:eventId
- [ ] PATCH /api/v1/timeline-v3/:id/events/:eventId
- [ ] DELETE /api/v1/timeline-v3/:id/events/:eventId
- [ ] POST /api/v1/timeline-v3/:id/add-event/:eventId
- [ ] GET /api/v1/events/:id/resolve
- [ ] POST /api/v1/timeline/:id/check-promotions (legacy promotion system)

## Event Voting (4 endpoints)
- [ ] POST /api/v1/events/:id/vote
- [ ] DELETE /api/v1/events/:id/vote
- [ ] GET /api/v1/events/:id/votes
- [ ] GET /api/v1/events/spotlight/top-voted-today

## Membership System (6 endpoints)
- [ ] GET /api/v1/timelines/:id/members
- [ ] GET /api/v1/membership/timelines/:id/members
- [ ] POST /api/v1/membership/timelines/:id/join
- [ ] GET /api/v1/membership/timelines/:id/status
- [ ] POST /api/v1/timelines/:id/members/:userId/approve
- [ ] POST /api/v1/timelines/:id/members/:userId/deny
- [ ] DELETE /api/v1/timelines/:id/members/:userId/remove

## Action Cards (6 endpoints)
- [ ] GET /api/v1/timelines/:id/actions
- [ ] POST /api/v1/timelines/:id/actions (stub - use PUT)
- [ ] PUT /api/v1/timelines/:id/actions (upsert by type)
- [ ] PUT /api/v1/timelines/:id/actions/:actionId
- [ ] DELETE /api/v1/timelines/:id/actions/:actionId
- [ ] GET /api/v1/timelines/:id/actions/:type
- [ ] POST /api/v1/timelines/:id/actions/:type/vote

## Info Cards (5 endpoints)
- [ ] GET /api/v1/timelines/:id/info-cards
- [ ] POST /api/v1/timelines/:id/info-cards
- [ ] GET /api/v1/timelines/:id/info-cards/:cardId
- [ ] PUT /api/v1/timelines/:id/info-cards/:cardId
- [ ] DELETE /api/v1/timelines/:id/info-cards/:cardId
- [ ] PATCH /api/v1/timelines/:id/info-cards/reorder

## Personal Timelines (4 endpoints)
- [ ] POST /api/v1/timelines/personal
- [ ] GET /api/v1/timelines/personal/mine
- [ ] GET /api/v1/personal-timelines/resolve
- [ ] GET /api/v1/timelines/:id/viewers
- [ ] POST /api/v1/timelines/:id/viewers
- [ ] DELETE /api/v1/timelines/:id/viewers/:userId

## Timeline Quote (2 endpoints)
- [ ] GET /api/v1/timelines/:id/quote
- [ ] PUT /api/v1/timelines/:id/quote

## Passport & Preferences (4 endpoints)
- [ ] GET /api/v1/user/passport
- [ ] POST /api/v1/user/passport/sync
- [ ] PUT /api/v1/user/preferences
- [ ] POST /api/v1/users/:id/profile-texts (just added)
- [ ] DELETE /api/v1/users/:id/profile-texts/:textId (just added)

## Share Pages (2 endpoints) - **CRITICAL: VISUAL INTEGRITY LOSS FOUND**
- [ ] GET /share/timeline/:id - **NEEDS REBUILD** (rich trading card visual vs bare HTML)
- [ ] GET /share/profile/:id - **NEEDS REBUILD** (rich trading card visual vs bare HTML)

## Uploads & Media (3 endpoints)
- [ ] POST /api/v1/upload
- [ ] GET /uploads/:path (static file serving)
- [ ] GET /static/uploads/:path (static file serving alias)

## URL Preview (1 endpoint)
- [ ] POST /api/v1/url-preview

## Site Stats & Health (3 endpoints)
- [ ] GET /api/v1/site-stats/user-count
- [ ] GET /api/health
- [ ] GET /api/health-check

## Legacy/Deprecated (may not need migration)
- [ ] GET /api/timeline/:id (old timeline endpoint)
- [ ] GET /api/timeline/:id/posts (old posts endpoint)
- [ ] POST /api/timeline/:id/posts (old post creation)
- [ ] GET /api/posts (old all posts list)
- [ ] POST /api/posts (old post creation without timeline)
- [ ] POST /api/post/:id/promote-vote (old voting system)
- [ ] GET /api/users/:id/events (old user events endpoint)

## Current Focus / Main Parent TODO
- [ ] Functional verification - Page-by-page testing of all features



## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [ ] Test MAKE A POST button functionality
- [ ] Test timeline creation flows
- [ ] Test event posting with media uploads
- [ ] Test member management (join/leave/approve/deny)
- [ ] Test profile features (avatar, bio, preferences)


## Pending TODOs ( larger tasks that are toward completing main goal )
- [ ] NSFW filter
- [ ] (From Tangent Queue / Privacy Policy) Decide and enforce whether non-owner viewers may add hashtag/community associations from private personal events.
- [ ] (From Tangent Queue / Discoverability) Decide whether to add a “shared personal timelines” surface (for example: Shared With Me list/module) or intentionally keep link-only access.
- [ ] (From Tangent Queue / Media Merge Tooling) Ideate high-tier report decision feature for duplicate/redundant media events (choose surviving event ID and merge/retain associations safely).
- [ ] (From Tangent Queue / Execution Guard) Resume Guest Mode execution starting at: `(Guest Mode) Guest mode auto handling people visiting from links they were shared.`
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
