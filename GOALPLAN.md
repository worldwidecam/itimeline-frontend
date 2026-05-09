# GOALPLAN — iTimeline Frontend

## Main Goal
Rewire frontend to new TypeScript Cloudflare backend, leaving NO FEATURE behind.

---

## Current Status (April 23, 2026)

### What We're Doing
currently moving into the **Profile System Audit** after fully standardizing the Timeline experience (Banner branding, video previews, and favorites persistence). Making sure all meaningful function is updated to this new backend. no loss of context and logic.

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

### Audit Methodology
When auditing each feature/endpoint:
1. **Frontend calls** → reveal the "contract" that was working
2. **New backend** → may have invented different names/structures
3. **Case-by-case decision**:
   - Update frontend to new backend naming, OR
   - Keep frontend naming, adapt backend to match
4. **Goal**: Find the path of least resistance for each integration point

## Page Audit Checklist
### ✅ Completed Pages
- [x] **Landing Page** (`/`) - Logout, badge settings, auth parity fixed
- [x] **Login Page** (`/login`) - Auth flow verified, Goblin mode working, UX redesigned for share-positive
- [x] **Register Page** (`/register`) - Password policy fixed, redundant login removed, guest mode guards added

### 🔲 Pages to Audit
- [ ] **Required Username Change** (`/account/required-username-change`) - Forced username update flow - endpoint added ✅
- [x] **Home Page** (`/home`) - Feed loading, timeline lanes, FAB, MAKE A POST
- [x] **Timeline View** (`/timeline-v3/:id`) - Event display, voting, posting, interactions - All 3 timeline types verified. Banner branding standardized with dynamic icons. ✅
- [x] **Personal Timeline** (`/timeline-v3/:username/:slug`) - Private timeline access - Resolve + viewer access verified. ✅
- [x] **Timeline Members** (`/timeline-v3/:id/members`) - Member list, join/leave - Banner branding + user_color fix applied. ✅
- [x] **Timeline Admin Panel** (`/timeline-v3/:id/admin`) - Settings, moderation, reports - Banner branding + action cards fix. ✅
  - [x] **Settings Tab** - Timeline info, privacy, membership approval, posting restrictions, cover image. ✅
    - **Fixes Applied**:
      - HTTP method: `PUT` → `PATCH` for visibility endpoint
      - Backend returns `privacy_changed_at` for cooldown tracking
      - Cooldown aligned: 7 → 10 days (frontend was source of truth)
      - Cooldown error now shows specific "X days left" message to user
      - Event list endpoint now checks timeline visibility (private events protected)
      - Share event now checks source timeline visibility (prevents leaking private content)
    - **Currently Testing**: Private timeline toggle (on/off), cooldown enforcement, visibility propagation
  - [x] **Manage Members Tab** - Active/pending/blocked members, promote/demote, block/unblock ✅
  - [x] **Manage Posts Tab** - Pending/reviewing/resolved reports, accept, resolve, escalate ✅
  - [x] **Cards Tab**:
    - [x] **Info Cards** - CRUD for info cards with rich text editor, drag-to-reorder ✅
    - [x] **Status Cards** - Status message type toggle (Good/Bad News, Bronze/Silver/Gold Action), header/body text ✅
    - [x] **Quote Card** - Inspiration quote text and author fields ✅
    - [x] **Action Cards** - Gold/Silver/Bronze actions with title, description, due date, threshold requirements ✅
- [x] **Profile (Self)** (`/profile`) - Own profile display, editing - user_color already in UserSelfDTO ✅
- [x] **Profile (Guest)** (`/profile/guest`) - Guest profile view - report functionality removed (no user to report) ✅
- [ ] **Profile (User)** (`/profile/:userId`) - Other user profiles, visibility checks - user_color in UserDTO ✅
  - *Note regarding User Access Lock*: When clicking a reporter link directing to a user profile, access was incorrectly blocked by a generic, unstyled private lock page stating that an access key is needed. This user account was public. Further, attempting to modify account access parameters within the user settings panel did not write to the backend properly.
- [ ] **Profile Settings** (`/profile/settings`) - Avatar, bio, preferences, music - user_color save verified ✅
- [ ] **Site Control** (`/site-control`) - Admin list, reports, site settings - user_color added to site-admins ✅
  - *Intricacies regarding Report Duplicate Locking*: 
    - Active State (Pending/Reviewing): If a ticket matching the timeline ID, user ID, or event ID is active, prevent all subsequent reports across ALL users. Display a specific snackbar stating that a report is already in progress.
    - Resolved State (Safeguard Tag): If a ticket was resolved using the "Safeguard" action, block subsequent reports on that ID for the specified duration.
- [ ] **Share Pages** (`/share/timeline/:id`, `/share/profile/:id`) - Backend-rendered trading cards - OG meta tags verified ✅

### Redirect/Lock Pages - Verified
- [x] **SiteControlLockView** - Non-admin access to Site Control - UI only, no API calls
- [x] **PrivateTimelineLock** - Non-member access to private community - UI only
- [x] **BlockedFromCommunity** - Blocked user access to community - UI only
- [x] **BannedTimelineLock** - Banned user access to timeline - UI only
- [x] **CommunityLockView** - Generic community restriction - UI only
- [x] **MembershipGuard** - Role-based access guard for admin/members pages - Route guard

## Profile Page Audit - Fixes Applied ✅
### Fix 1: User Report Endpoint Mismatch
- **Problem**: Frontend called non-existent `POST /api/v1/reports/users/:id` with wrong payload
- **Expected**: Backend uses `POST /api/v1/reports` with `{ subject_type, subject_id, reason, details }`
- **Fix**: Updated `submitUserReport()` in `api.js` to use correct endpoint and payload structure
- **Files**: `itimeline-frontend/src/utils/api.js:853-871`

### Fix 2: Guest Profile Report Button
- **Problem**: Guest profile page showed "Report" button for logged-in users, but there's no actual user to report (guest is hardcoded)
- **Expected**: No report functionality on guest profile page
- **Fix**: Removed report button, dialog, and all related state/handlers from `GuestProfilePage.js`
- **Files**: `itimeline-frontend/src/components/GuestProfilePage.js`

### All Profile Endpoints Verified ✅
| Feature | Endpoint | Status |
|---------|----------|--------|
| Get user profile | `GET /users/:id` | ✅ |
| User search | `GET /users/search` | ✅ |
| Profile access check | `GET /users/:id/profile-access` | ✅ |
| Profile access with key | `POST /users/:id/profile-access` | ✅ |
| Get user music | `GET /users/:id/music` | ✅ |
| Profile texts (guestbook) | `GET/POST/DELETE /users/:id/profile-texts` | ✅ |
| Own profile hydrate | `GET /profile/hydrate` | ✅ |
| Own music | `GET /profile/music` | ✅ |
| Update profile | `PATCH /users/me` | ✅ |
| Update username | `PATCH /users/me/username` | ✅ |
| Update music | `PATCH /users/me/music` | ✅ |
| Profile modules | `PUT /profile/modules` | ✅ |
| Event report | `POST /timelines/:id/reports` | ✅ |
| Timeline report | `POST /reports/timelines/:id` | ✅ |
| User report | `POST /reports` | ✅ Fixed |

## Community Timeline Audit - Issues Found 🔍
*Current auditor: Testing as a moderator of a community timeline*

### Issue 1: Delete Button on Tagged Events (Not Created on Timeline) ✅ FIXED
- **Problem**: Mod sees delete option in ellipsis menu for events that were only TAGGED to the timeline, not created on it
- **Expected**: Should only see delete option for events actually created on this timeline
- **Location**: Event card ellipsis menu / Event popup
- **Fix**: Added `isEventCreatedOnCurrentTimeline` check - mods can only delete events created on their timeline

### Issue 2: Missing Creator Timeline Tag on Timeline Page Event Cards ✅ FIXED
- **Problem**: Event cards on timeline page don't show creator timeline tag in top-right corner (unlike home page cards)
- **Expected**: Event cards should be standardized - show creator timeline tag consistently
- **Location**: Timeline page event cards (RemarkCard, NewsCard, MediaCard)
- **Fix**: Backend `EventDTO` now includes `timeline_name`, `timeline_type`, and `timeline_slug`. `toEventDTO` fetches origin timeline data. Frontend `EventOriginTimelineBadge` already used these fields and will now display correctly.

### Issue 3: Mod Can Promote/Demote Other Members ✅ FIXED
- **Problem**: As a mod, can see promote/demote buttons for active members in Manage Members tab
- **Expected**: Only Admins (not Mods) should be able to promote/demote members
- **Location**: Admin Panel > Manage Members > Active Members tab
- **Fix**: Added `canChangeRoles` check requiring role to be 'admin', 'creator', or 'siteowner'

### Issue 4: "Block from Community" Button Visible on SiteOwner ✅ FIXED
- **Problem**: Can see "Block from Community" button on SiteOwner's member listing
- **Expected**: SiteOwner should be unblockable - button should be hidden or disabled
- **Location**: Admin Panel > Manage Members > Active Members (SiteOwner row)
- **Fix**: Added `isSiteOwner` check to block button visibility logic

### Issue 5: Settings Sub-Tab Needs "Admin Access Only" State ✅ FIXED
- **Problem**: Settings sub-tab in admin page is accessible to mods
- **Expected**: Settings should be "Admin Access Only" - block mods from entering this sub-tab
- **Location**: Admin Panel > Settings tab
- **Fix**: Settings tab now hidden for non-admins; fallback lock message shown if accessed directly

### Issue 6: Moderator Cannot Remove Regular Members ✅ FIXED
- **Problem**: As a mod, trying to remove a regular member from community fails with 403 "Insufficient timeline role"
- **Expected**: Moderators should be able to remove regular members (not admins/mods)
- **Location**: Backend `src/routes/members.ts` - DELETE endpoint required `admin` role
- **Fix**: Changed requirement from `admin` to `moderator`, added check that mods can only remove regular members (not other mods/admins)
- **Files**: `itimeline-backend/src/routes/members.ts`

### Issue 7: Settings Tab Save Fails with 400 Bad Request ✅ FIXED
- **Problem**: Toggling "Require membership approval" and saving settings fails with 400 Bad Request
- **Expected**: Settings should save successfully
- **Location**: Frontend `AdminPanel.js` settings save + Backend `timelines.ts` PATCH endpoint
- **Root Cause**: Frontend sent `cover_portrait_image_url` but backend schema expects `cover_portrait_key`; strict schema rejected unknown fields
- **Fix**: Frontend now sends correct field names (`cover_portrait_key`, `cover_landscape_key`) using new `extractKeyFromUrl()` helper; only includes fields with values
- **Files**: `itimeline-frontend/src/components/timeline-v3/community/AdminPanel.js`

### Issue 8: Status Message Save Fails with 400 Bad Request ✅ FIXED
- **Problem**: Saving settings triggers second error: `PUT /status-message 400 Bad Request`
- **Expected**: Status message should save if provided
- **Location**: Frontend `AdminPanel.js` status message save + Backend `actions.ts` PUT endpoint
- **Root Cause**: Frontend sent `status_header` and `status_body` but backend expects `header` and `body`; strict schema rejected unknown fields
- **Fix**: Updated field names to match backend schema (`header`, `body`, `is_active`); added guard to only send if header has content (backend requires min 1 char)
- **Files**: `itimeline-frontend/src/components/timeline-v3/community/AdminPanel.js`

### Issue 9: Action Cards Save Fails with 400 Bad Request ✅ FIXED
- **Problem**: Saving settings triggers third error: `PUT /actions 400 Bad Request`
- **Expected**: Action cards should save, including cleared/inactive ones
- **Location**: Frontend `api.js` + Backend `actions.ts` PUT endpoint
- **Root Cause**: Backend schema required `title: z.string().min(1)` but frontend sends empty title `''` when clearing an action (with `is_active: false`)
- **Fix**: Backend now allows empty titles (`z.string().max(200)`) to support cleared/inactive actions; also added `reset_votes` to schema
- **Files**: `itimeline-backend/src/routes/actions.ts`

### Issue 10: Pending Membership Flow Broken - Field Name Mismatch ✅ FIXED
- **Problem**: User clicks "Request to Join" on timeline with membership approval ON; gets "Successfully joined" message but should get "Your request has been submitted for approval"; UI doesn't show pending state; after refresh, back to join state
- **Expected**: 
  - User should see "Request pending approval" message
  - UI should switch to pending state (button changes to pending)
  - User should appear in admin "Pending Requests" tab
  - After refresh, user should still see pending state (not need to request again)
- **Location**: Multiple frontend files + backend API + cache layers
- **Root Cause**: MULTIPLE ISSUES:
  1. **Frontend bug**: Checked `role === 'pending'` but backend returns `role: 'member'`, `status: 'pending'`. The `role` is permission level (member/moderator/admin), while `status` is membership state (active/pending/blocked).
  2. **Backend bug**: `/api/v1/membership/timelines/:id/status` endpoint did NOT return `status` field at all!
  3. **Cache bug**: localStorage cache didn't persist or restore `is_pending`/`status` fields
- **Files Fixed**:
  - `itimeline-frontend/src/components/timeline-v3/community/CommunityMembershipControl.js` (line 134)
  - `itimeline-frontend/src/hooks/useJoinStatus.js` (lines 56, 155, persist fn)
  - `itimeline-frontend/src/components/timeline-v3/TimelineV3.js` (lines 2673, 2795, 4303 MUI tooltip)
  - `itimeline-frontend/src/utils/api.js` (checkMembershipStatus cache read/write)
  - `itimeline-backend/src/routes/legacy.ts` (membership status endpoint - added status field)

### Issue 11: Members List Shows Pending Users as Members ✅ FIXED
- **Problem**: Members page shows pending user as member; timeline page shows count as 2 but members page shows 3 (includes pending user); admin members tab also shows pending user as member; admin pending tab is empty
- **Expected**: Members list should only show active members by default; pending users should only appear in pending tab
- **Location**: Backend `members.ts` GET /timelines/:id/members endpoint
- **Root Cause**: API endpoint defaulted `status` to `null` (returns ALL members including pending/blocked) instead of defaulting to `'active'` only
- **Fix**: Changed default status from `null` to `'active'` so public members list only shows active members
- **Files**: `itimeline-backend/src/routes/members.ts`

### Issue 12: Header Button and navFAB Not Synchronized ✅ FIXED
- **Problem**: When user clicks join in header button, navFAB doesn't update to pending immediately; only after refresh do they sync
- **Expected**: Clicking join in either location should immediately update both buttons to pending state
- **Location**: `useJoinStatus` hook - used by both components but instances don't communicate
- **Root Cause**: Join action waited for API response + refresh before broadcasting state; no immediate optimistic update
- **Fix**: 
  - Added BroadcastChannel for cross-component sync (base infrastructure)
  - Added **optimistic pending state**: immediately set `isPending=true` and broadcast BEFORE API call
  - Other components receive broadcast instantly and update their UI
  - After API confirms, refresh and broadcast confirmed state
  - On error, revert optimistic state and broadcast revert
- **Files**: `itimeline-frontend/src/hooks/useJoinStatus.js`

### Issue 14: Join Button Sync Asymmetry (navFAB → Header Not Working) ✅ FIXED
- **Problem**: When clicking navFAB join, header button didn't update; but header → navFAB worked. Asymmetric sync.
- **Expected**: Both directions should sync immediately regardless of which button is clicked
- **Location**: `TimelineV3.js` and `CommunityMembershipControl.js` 
- **Root Cause**: Both components had their own `handleJoinCommunity` functions that directly called API instead of using `useJoinStatus` hook's `join` function. The hook's `join` has optimistic updates + BroadcastChannel, but components weren't using it.
- **Fix**: 
  - `TimelineV3.js`: Changed `handleJoinCommunity` to use `joinFromHook()` instead of direct API call
  - `CommunityMembershipControl.js`: Extracted `join: joinFromHook` from hook and used it instead of direct API call
  - Both components now benefit from optimistic updates and immediate cross-component sync
- **Files**: 
  - `itimeline-frontend/src/components/timeline-v3/TimelineV3.js`
  - `itimeline-frontend/src/components/timeline-v3/community/CommunityMembershipControl.js`

### Issue 15: Blocked Members Tab Verification ✅ VERIFIED WORKING
- **Location**: Admin Panel "Blocked Members" tab
- **Backend**: `GET /api/v1/timelines/:id/blocked-members` returns `{ data: [...] }` ✓
- **Frontend**: `AdminPanel.js` correctly handles `response?.data` format ✓
- **API**: `getBlockedMembers()` in `api.js` calls correct endpoint ✓
- **Status**: Wiring correct. User confirmed: "it seems to be working based off my tests so far"

### Issue 16: Leave Button Lacks Role Protections ✅ FIXED
- **Problem**: Any member could leave, including SiteOwner, community creator, or sole admin - leaving community orphaned
- **Expected**: 
  - SiteOwner cannot leave any community (emergency access)
  - SiteAdmin cannot leave any community (site-level access)
  - Last admin cannot leave without promoting another admin first
- **Root Cause**: Backend `leave()` function had zero role checks
- **Fix**:
  - Backend: Added `countActiveAdmins()` repo function to count active admins
  - Backend `leave()` now checks:
    1. If userId === 1 (SiteOwner) → Forbidden
    2. If user is SiteAdmin → Forbidden  
    3. If user is admin and adminCount <= 1 → Forbidden
  - Frontend: Added `adminCount` state and `canLeave` logic
  - Frontend: Leave button hidden for SiteOwner with tooltip "SiteOwner cannot leave communities"
  - Frontend: Leave button disabled for only-admin with tooltip "Promote another member to admin before leaving"
- **Files**:
  - `itimeline-backend/src/repos/membership.ts` (countActiveAdmins)
  - `itimeline-backend/src/services/members.ts` (leave function protections)
  - `itimeline-frontend/src/components/timeline-v3/community/CommunityMembershipControl.js`

### Issue 17: SiteAdmin Role Chip Not Implemented ✅ FIXED
- **Problem**: SiteAdmin users don't get a superseding role chip like SiteOwner does; they appear as regular admin/moderator/member
- **Expected**: SiteAdmin should have their own chip (deep blue) below SiteOwner (green) in hierarchy
- **Root Cause**: 
  - Backend `toMembershipDTO` only checked for `userId === 1` (SiteOwner)
  - Membership status endpoint didn't return siteadmin role
  - Frontend role color functions didn't handle 'siteadmin'
  - MemberRole enum was missing 'siteadmin' value
- **Fix**:
  - Added 'siteadmin' to MemberRole enum (hierarchy: member < moderator < admin < siteadmin < siteowner)
  - Updated ROLE_RANK in members.ts and events.ts
  - Updated membership status endpoint to return 'siteadmin' role for SiteAdmin users
  - Updated `toMembershipDTO` (via status endpoint logic)
  - Added siteadmin case to all frontend `getRoleColor` functions (deep blue #1565c0)
  - SiteOwner: Forest green (#2e7d32), SiteAdmin: Deep blue (#1565c0)
- **Files**:
  - `itimeline-backend/src/shared/enums.ts` (MemberRole)
  - `itimeline-backend/src/services/members.ts` (ROLE_RANK)
  - `itimeline-backend/src/services/events.ts` (ROLE_RANK)
  - `itimeline-backend/src/routes/legacy.ts` (membership status endpoint)
  - `itimeline-frontend/src/components/timeline-v3/community/AdminPanel.js`
  - `itimeline-frontend/src/components/timeline-v3/community/MemberListTab.js`

### Issue 13: Pending Members Not Showing in Admin Panel ✅ FIXED
- **Problem**: User stuck in limbo: pending on timeline page, but admin "Pending Requests" tab shows empty; user can't re-request join (buttons disabled), admin can't approve/deny
- **Expected**: Pending users should appear in admin "Pending Requests" tab with approve/deny buttons
- **Location**: Backend/Frontend response format mismatch
- **Root Cause**: TWO ISSUES:
  1. Backend returns `{ data: [...] }` but AdminPanel checked for `response.pending_members` (wrong key)
  2. Backend `toMembershipDTO` didn't include `requested_at` field that frontend expects for pending members display
- **Fix**: 
  - AdminPanel now checks `response.data` first (correct key from backend)
  - Backend `toMembershipDTO` now includes `requested_at: row.joinedAt` for pending member timestamps
- **Files**: 
  - `itimeline-frontend/src/components/timeline-v3/community/AdminPanel.js` (line 2932)
  - `itimeline-backend/src/services/members.ts` (toMembershipDTO function)

### Mobile UX Observations (Not Audit-Critical)
- Horizontal scroll bleed on landing page (grey space visible)
- Timeline carousel not swipeable on mobile
- Landing badge bubble/tail connection not seamless on mobile
- navFAB z-index needs to be highest

## Landing Page Audit - Fixes Applied ✅
### Bug 1: Logout Token Persistence
- **Issue**: HTTP-only cookies not cleared on logout → refresh re-authenticates user
- **Root Cause**: Frontend `logout()` didn't call backend endpoint (JS can't delete HTTP-only cookies)
- **Fix**: Added `await api.post('/api/v1/auth/logout')` before local cleanup
- **Files**: `AuthContext.js`, `Navbar.js`, `GuestHubFiller.js`

### Bug 2: Landing Badge Settings Not Saving
- **Issue**: Badge text/enabled settings not persisted from Site Control page
- **Root Cause**: Backend `/site-settings/landing-rotator` used strict schema rejecting all fields except `items`
- **Fix**: Expanded endpoint to handle all landing settings (badge_text, badge_enabled, home_hero, toolbar_led, etc.)
- **Files**: `itimeline-backend/src/routes/site-settings.ts`
- **Note**: Default `badge_enabled` is now `false` (user must explicitly enable)

## Auth Parity Bug (Found During Audit) ✅ FIXED
- **Issue**: Frontend had hardcoded `Number(user.id) === 1` as SiteAdmin/SiteOwner fallback
- **Locations**: `Navbar.js:295`, `SiteControlPage.js:3265,3275`, `TimelineV3.js:1155`
- **Backend**: No such fallback - only checked `site_admins` table
- **Result**: User ID 1 could view/access Site Control but could not save (403)
- **Fix Applied**: Added bootstrap SiteOwner fallback in backend:
  - `authz.ts` - `requireSiteAdmin` and `requireTimelineRole` middlewares
  - `passport.ts` - `hydrate` function returns bootstrap role
  - `auth.ts` - `/auth/me` endpoint returns bootstrap role
  - `legacy.ts` - `/api/v1/admins/site` includes bootstrap SiteOwner in admin list
- **Security**: Only User ID 1 with email `brahdyssey@gmail.com` gets auto-SiteOwner

## Login/Register Audit - Fixes Applied ✅
- **Issue 1**: Password policy mismatch
  - Frontend required 6 chars, backend (prod) requires 12 chars
  - **Fix**: `Register.js:63` now requires 12 chars minimum
  - **Note**: Existing accounts unaffected - policy only enforced at registration
- **Issue 2**: Redundant double-login on register
  - `AuthContext.register()` called `login()` after successful register
  - Backend already sets cookies and returns access_token
  - **Fix**: Now just calls `/auth/me` to fetch user data (saves 1 API roundtrip)
- **Issue 3**: Guest mode passport fetch errors
  - `HomePage.fetchYourPageData()` called `syncUserPassport()` for guests
  - Backend `/profile/hydrate` returns 403 for guests (correct)
  - **Fix**: Added `isGuest` guard to prevent passport calls for guests
- **Issue 4**: Login page UX not share-positive
  - Old design: Big login form first, small guest option below
  - Implied "you must login" rather than "you can view as guest"
  - **Fix**: Redesigned Login page with equal-weighted options:
    - Header: "Choose Your Path"
    - Login card (collapsible): "Login First" → expands to show form
    - Prominent "OR" divider
    - Goblin Mode card (unchanged): "view-only as a guest"

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [x] Fix logout token persistence
- [x] Fix landing badge settings saving
- [x] Fix auth parity: Backend bootstrap SiteOwner for User ID 1 + email check
- [x] Bootstrap SiteOwner appears in admin list on Site Control page
- [ ] Verify redirect pages (non-admin → locked view, guest → appropriate page)
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
