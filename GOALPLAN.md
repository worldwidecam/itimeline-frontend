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

## Authentication & Session (7 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/auth/register - TS has: password policy (12+ chars), HIBP check, argon2id hash, reserved username blocklist, blocklist check, JWT cookies
- [x] POST /api/v1/auth/login - TS has: constant-time dummy verify, lockout after 10 failures, moderation suspension check, JWT cookies
- [x] POST /api/v1/auth/refresh - TS has: token rotation, moderation check
- [x] POST /api/v1/auth/logout - TS has: token blocklist (KV), cookie clearing
- [x] POST /api/v1/auth/validate → GET /api/v1/auth/me - TS returns: user DTO, moderation state, site admin role
- [x] POST /api/v1/guest/session - TS has: guest JWT with 24h TTL, no refresh token
- [x] POST /api/v1/auth/required-username-change → PATCH /api/v1/users/me/username - TS clears moderation flag after change

## Profile & User Management (10 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/profile/update → legacy.ts multipart form (avatar upload, bio, visibility, access_key)
- [x] GET /api/v1/profile/music → profile.ts (returns user's music settings)
- [x] POST /api/v1/profile/music → profile.ts (updates music_url, music_platform, music_media_key)
- [x] DELETE /api/v1/profile/music → profile.ts (clears music settings)
- [x] GET /api/v1/users/:id → users.ts (key-gated profile visibility check)
- [x] GET /api/v1/users/:id/music → users.ts (respects profile visibility)
- [x] GET /api/v1/users/:id/profile-access → users.ts (checks if viewer can access)
- [x] POST /api/v1/users/:id/profile-access → users.ts (access with key in body)
- [x] GET /api/v1/users/lookup → users.ts (site-admin only, resolves identifier to user)
- [x] GET /api/v1/users/:id/profile-texts → users.ts (guestbook-style texts with visibility check)

## Follow System (8 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/users/following → follow.ts (paginated list, cursor-based)
- [x] GET /api/v1/users/followers → follow.ts (paginated list, cursor-based)
- [x] POST /api/v1/users/:id/follow → follow.ts (self-follow blocked, user existence check)
- [x] DELETE /api/v1/users/:id/follow → follow.ts
- [x] GET /api/v1/timelines/following/hashtags → legacy.ts (filters followed timelines to hashtag type)
- [x] POST /api/v1/timelines/:id/follow → follow.ts (banned timeline check, follow_kind: watch|follow)
- [x] DELETE /api/v1/timelines/:id/follow → follow.ts
- [x] GET /api/v1/timelines/:id/follow-status → follow.ts (returns is_following, follow_kind, followed_at)

## Timeline CRUD (8 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timeline-v3 → legacy.ts + timelines.ts (list public timelines, filters banned, cursor pagination)
- [x] POST /api/v1/timeline-v3 → timelines.ts (create timeline, name blocklist check, auto-admin, auto-follow)
- [x] GET /api/v1/timeline-v3/:id → legacy.ts + timelines.ts (readable check: banned, private visibility)
- [x] PUT /api/v1/timeline-v3/:id → PATCH /api/v1/timelines/:id (admin role required, cover image, quote settings)
- [x] DELETE /api/v1/timeline-v3/:id → timelines.ts (admin role required)
- [x] GET /api/v1/timeline-v3/name/:name → GET /api/v1/timelines/by-slug/:slug (slug-based lookup)
- [x] POST /api/v1/timelines/merge → legacy.ts + admin.ts (SiteOwner only, moves events, marks source as merged)
- [x] DELETE /api/v1/timelines/:id → timelines.ts (admin role required)

## Timeline Events (8 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timeline-v3/:id/events → legacy.ts (paginated, respects timeline visibility)
- [x] POST /api/v1/timeline-v3/:id/events → events.ts (member check, posting restrictions, rate limit)
- [x] GET /api/v1/timeline-v3/:id/events/:eventId → events.ts (event lookup by ID)
- [x] PATCH /api/v1/timeline-v3/:id/events/:eventId → events.ts (creator/admin/site-admin, edit_locked support)
- [x] DELETE /api/v1/timeline-v3/:id/events/:eventId → events.ts (creator/admin/site-admin)
- [x] POST /api/v1/timeline-v3/:id/add-event/:eventId → legacy.ts (copy event to another timeline)
- [x] POST /api/v1/events/:id/votes → events.ts (promote/demote, rate limit)
- [x] DELETE /api/v1/events/:id/votes → events.ts (remove vote)

## Event Voting (4 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/events/:id/vote → POST /api/v1/events/:id/votes (promote/demote)
- [x] DELETE /api/v1/events/:id/vote → DELETE /api/v1/events/:id/votes (remove vote)
- [x] GET /api/v1/events/:id/votes → not implemented (votes counted in event DTO)
- [x] GET /api/v1/events/spotlight/top-voted-today → events.ts (returns top voted event of the day)

## Membership System (7 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timelines/:id/members → members.ts (paginated, status filter, SiteOwner synthetic)
- [x] GET /api/v1/membership/timelines/:id/members → GET /api/v1/timelines/:id/members
- [x] POST /api/v1/membership/timelines/:id/join → POST /api/v1/timelines/:id/members/requests (auto-approve or pending)
- [x] GET /api/v1/membership/timelines/:id/status → GET /api/v1/timelines/:id/members/me
- [x] POST /api/v1/timelines/:id/members/:userId/approve → PATCH with action=approve (moderator+)
- [x] POST /api/v1/timelines/:id/members/:userId/deny → PATCH with action=deny (moderator+)
- [x] DELETE /api/v1/timelines/:id/members/:userId/remove → members.ts (admin only)

## Action Cards (7 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timelines/:id/actions → actions.ts (lists all actions with vote counts)
- [x] POST /api/v1/timelines/:id/actions → legacy.ts stub (use PUT)
- [x] PUT /api/v1/timelines/:id/actions → actions.ts (upsert by type: bronze/silver/gold)
- [x] PUT /api/v1/timelines/:id/actions/:actionId → actions.ts (update specific action)
- [x] DELETE /api/v1/timelines/:id/actions/:actionId → DELETE /api/v1/timelines/:id/actions/:type
- [x] GET /api/v1/timelines/:id/actions/:type → actions.ts (get action by type)
- [x] POST /api/v1/timelines/:id/actions/:type/vote → actions.ts (vote on action)

## Info Cards (6 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timelines/:id/info-cards → info-cards.ts (lists all cards)
- [x] POST /api/v1/timelines/:id/info-cards → info-cards.ts (admin only)
- [x] GET /api/v1/timelines/:id/info-cards/:cardId → not implemented (use list)
- [x] PUT /api/v1/timelines/:id/info-cards/:cardId → PATCH /api/v1/timelines/:id/info-cards/:cardId
- [x] DELETE /api/v1/timelines/:id/info-cards/:cardId → info-cards.ts (admin only)
- [x] PATCH /api/v1/timelines/:id/info-cards/reorder → info-cards.ts (ordered_ids array)

## Personal Timelines (6 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/timelines/personal → timelines.ts (creates private personal timeline)
- [x] GET /api/v1/timelines/personal/mine → timelines.ts (lists user's personal timelines)
- [x] GET /api/v1/personal-timelines/resolve → legacy.ts (resolve by username + slug)
- [x] GET /api/v1/timelines/:id/viewers → viewers.ts (admin only, paginated)
- [x] POST /api/v1/timelines/:id/viewers → viewers.ts (admin only, add viewer)
- [x] DELETE /api/v1/timelines/:id/viewers/:userId → viewers.ts (admin only)

## Timeline Quote (2 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/timelines/:id/quote → timelines.ts (returns quote text, author, is_custom)
- [x] PUT /api/v1/timelines/:id/quote → PATCH /api/v1/timelines/:id/quote (admin only)

## Passport & Preferences (5 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/user/passport → passport.ts (hydrated user state with memberships, moderation, preferences)
- [x] POST /api/v1/user/passport/sync → passport.ts (force refresh from DB)
- [x] PUT /api/v1/user/preferences → users.ts (theme, home_init_tab, email_blur, dark_mode)
- [x] POST /api/v1/users/:id/profile-texts → users.ts (guestbook-style texts)
- [x] DELETE /api/v1/users/:id/profile-texts/:textId → users.ts (owner or target only)

## Share Pages (2 endpoints) - ✅ REBUILT
- [x] GET /share/timeline/:id - Trading card visual with QR code, cover positioning, type chip
- [x] GET /share/profile/:id - Trading card visual with QR code, private profile access key form

## Uploads & Media (3 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/upload → POST /api/v1/uploads/media (R2 storage, magic-byte sniffing, 100MB limit)
- [x] GET /uploads/:path → R2 signed URL generation via mediaKeyToUrl()
- [x] GET /static/uploads/:path → same as above

## URL Preview (1 endpoint) - ✅ VERIFIED
- [x] POST /api/v1/url-preview → url-preview.ts (OG scraping, cached)

## Site Stats & Health (3 endpoints) - ✅ VERIFIED
- [x] GET /api/v1/site-stats/user-count → health.ts (cached user count)
- [x] GET /api/health → GET /api/v1/health (version, time)
- [x] GET /api/health-check → GET /api/v1/health/deep (site admin only, DB/KV ping)

## Legacy/Deprecated (may not need migration)
- [ ] GET /api/timeline/:id (old timeline endpoint)
- [ ] GET /api/timeline/:id/posts (old posts endpoint)
- [ ] POST /api/timeline/:id/posts (old post creation)
- [ ] GET /api/posts (old all posts list)
- [ ] POST /api/posts (old post creation without timeline)
- [ ] POST /api/post/:id/promote-vote (old voting system)
- [ ] GET /api/users/:id/events (old user events endpoint)

## Guest Mode Implementation - ✅ VERIFIED
- [x] POST /api/v1/guest/session → auth.ts (guest JWT with 24h TTL, no refresh token)
- [ ] Guest mode route guards (frontend)
- [ ] Goblin redirect page for blocked destinations

## Reports & Moderation (10 endpoints) - ✅ VERIFIED
- [x] POST /api/v1/reports → reports.ts (user report creation)
- [x] GET /api/v1/reports → reports.ts (user's own reports, site admin sees all)
- [x] GET /api/v1/reports/:id → reports.ts (report detail)
- [x] PATCH /api/v1/reports/:id/resolve → reports.ts (site admin only)
- [x] PATCH /api/v1/reports/:id/status → reports.ts (site admin only)
- [x] PATCH /api/v1/reports/:id/escalate → reports.ts (site admin only)
- [x] GET /api/v1/timelines/:id/reports → legacy.ts (moderator+, timeline-specific)
- [x] POST /api/v1/timelines/:id/reports → legacy.ts (event report submission)
- [x] POST /api/v1/timelines/:id/reports/:reportId/accept → legacy.ts (status → reviewing)
- [x] POST /api/v1/timelines/:id/reports/:reportId/resolve → legacy.ts (warn/remove/delete event)

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
