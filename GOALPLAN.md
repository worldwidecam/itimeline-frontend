# Main Goal - Community Timeline Implementation

## Lean Plan (2025-10-10)

### Main GOAL
- Prepare application for production launch

### Sub GOALS (In Order)
1. ✅ Community timeline implementation (MOSTLY COMPLETE)
2. 🔄 Finish Community Timeline Implementation (CURRENT)
3. ⏳ Timeline Reference Point B System (NEXT - MAJOR)
4. ⏳ Promote/Demote Voting System
5. ⏳ Better Auth Migration (FINAL PRE-PRODUCTION)

### Current Sub GOAL
- Finish Community Timeline Implementation

### Current Goal within Sub GOAL
- Complete Settings Tab in Admin Panel

### CURRENT TODO
- [ ] Implement Settings Tab in Admin Panel
  - [ ] Timeline visibility settings (public/private/community)
  - [ ] Timeline name/description editing
  - [ ] Timeline deletion functionality
  - [ ] Other timeline configuration options

### QUALITY OF LIFE IMPROVEMENTS - COMPLETED (2025-10-10)
- ✅ Add "Under Review" visual indicator on event cards when status is 'reviewing'
- ✅ Add event type icons to Manage Posts report cards (color-coded)
- ✅ Update report reason chip colors (Blue/Orange/Red palette)
- ✅ Fix EventPopup grey border visual issue (removed subtle border artifacts)
- ✅ Redesign image media marker popover (moved title/date outside image preview)
- ✅ Fix EventCounter/Carousel filter synchronization (respects EventList type filter + no auto-scroll)
- ✅ Restore left border colors on Manage Posts report cards (status phase indicator)
- ✅ Update README with October 2025 improvements and current focus

### DEFERRED QUALITY OF LIFE (For Later)
- [ ] Add search/filter functionality to Manage Posts list
- [ ] Consider pagination controls for Manage Posts (currently loads all)
- [ ] Add loading states for report actions (Accept/Remove/Delete/Safeguard)
- [ ] Add favicon/site icon for branding

### NEXT MAJOR TODO (After Quality of Life)
- [ ] **Timeline Reference Point B System** ⭐ CRITICAL ARCHITECTURE CHANGE
  - **Problem**: Current system only tracks distance from point [0], causing issues:
    - Filter view switches lose user context (e.g., 8 hours in day view = 8 years in year view)
    - Clunky event marker movement
    - Poor scroll position memory across view changes
  - **Solution**: Dual reference point system:
    - **Point A**: Today's current date/time (absolute reference)
    - **Point B**: User's focus position relative to Point A (tracks distance from today, not from [0])
  - **Impact**: Fixes navigation, maintains context across filter views, smoother scrolling
  - **Complexity**: HIGH - Core timeline coordinate system refactor
  - **Priority**: NEXT after Quality of Life improvements

### COMPLETED TODO (2025-10-10)
- ✅ **Report System** - Complete end-to-end implementation:
  - Report button on all event types creates items in AdminPanel → Manage Posts tab
  - Manage Posts tab uses real API data (no mock data)
  - All three resolve actions implemented: remove, delete, safeguard
  - List refreshes and counts update after actions
  - Verdict requirement enforced
  - View Event button for investigation

### Production Roadmap

**Phase 1: Quality of Life** (Current - Est. 1-2 weeks)
- Polish existing features
- Fix minor UX issues
- Add missing loading states

**Phase 2: Timeline Reference Point B** (Next - Est. 2-3 weeks) ⭐
- Refactor core coordinate system
- Implement dual reference points
- Fix filter view context switching
- Optimize event marker movement

**Phase 3: Promote/Demote Voting System** (Est. 3-4 weeks)
- Reddit-style upvote/downvote toggle
- Vote aggregation and display
- Visual indicators (green/red dots, financial chart style)
- Database schema for votes
- Vote manipulation prevention

**Phase 4: Event Marker Scaling** (Est. 1-2 weeks)
- Optimize for 1000s of events
- Clustering/grouping when zoomed out
- Virtual rendering for visible markers only
- Performance testing

**Phase 5: Better Auth Migration** (Final - Est. 2-3 weeks) 🚢
- Migrate from Flask-JWT-Extended to Better Auth
- Database schema migration with user preservation
- Add 2FA, social OAuth
- Comprehensive testing
- **PRODUCTION LAUNCH** 🎉

### Notes for Current Context
- ✅ **Reporting System COMPLETE** (2025-10-10):
  - Report button across all event popups (Standard, Image, Video, Audio, News)
  - Manage Posts tab fully wired to real backend API
  - All three resolution actions implemented and working:
    - **Remove from Community** - Timeline-specific removal via blocklist
    - **Delete Post** - Global deletion (removes from ALL timelines)
    - **Safeguard Post** - Marks as reviewed/safe, dismisses report
  - Status workflow: Pending → Reviewing → Resolved
  - Real-time list updates after actions
  - Verdict requirement enforced for all actions
  - View Event button opens EventPopup for investigation

- Completed recently:
  - Members page with real API; roles promote/demote; remove/block/unblock
  - Join/Blocked gating with red banner
  - Quote system complete
  - CommunityLockView and AdminPanel access guards

- Backend endpoints (all working):
  - `GET /api/v1/timelines/{timeline_id}/reports` - List reports with pagination
  - `POST /api/v1/timelines/{timeline_id}/reports` - Submit report
  - `POST /api/v1/timelines/{timeline_id}/reports/{report_id}/accept` - Accept for review
  - `POST /api/v1/timelines/{timeline_id}/reports/{report_id}/resolve` - Resolve with action

---

# Main Goal - Community Timeline Implementation

## Concise Plan (2025-08-31)
- **Main goal**: Community timeline implementation
- **Finished recently**: Members page (active/blocked lists, roles, remove/block with real API) and quote system
- **Where we left off**: Admin Page — "Remove from community" button behavior and persistence
- **Today's task**: Validate end-to-end removal persistence
  - Call backend removal API (active under `/api/v1/timelines/{id}/members/{userId}`)
  - After success, call `POST /api/v1/user/passport/sync`
  - Clear/update caches so member stays removed after refresh, then re-fetch
- **Next 1–2 steps**: Add search/filter to members list; verify no mock fallbacks remain

### New Progress (2025-08-25)
- ✅ CommunityLockView integrated across community UI where appropriate
- ✅ AdminPanel access-loading guard added (skeleton shown during access check to prevent UI flash)
- ℹ️ No backend changes required for the above; frontend-only improvements

### Progress Today (alignment with Postgres passport)
- **Backend** now writes/reads passports from Postgres; endpoints are live: `GET /api/v1/user/passport`, `POST /api/v1/user/passport/sync`. `community_bp` is registered under `/api/v1` so the DELETE member route is active.
- **Frontend** is connected to backend; auth validate calls succeed; ready to drive passport sync after member removal.

### Next Minute Step — Remove Button
1) Keep current UI flow in `AdminPanel.js` → `removeMember(timelineId, userId)` and, on success, immediately call `syncUserPassport()`.
2) After sync resolves, invalidate relevant caches (`user_passport_*`, `timeline_members_*`) and re-fetch the member list.
3) Confirm that subsequent UI renders and fresh fetches exclude the removed member.

Mini-roadmap after this minute step:
- [ ] Add debug log in `removeMember` success path to record timelineId/userId and sync results
- [ ] Verify `getTimelineMembers(id)` excludes inactive members after refresh
- [ ] E2E: remove → sync → reload → remains removed (across tabs/sessions)

---

## Detailed history (archive)

## Sub Goal - Quote System ✅ COMPLETE

### ✅ Foundation Completed:
- [x] Review AdminPanel.js SettingsTab for quote logic
- [x] Review QuoteDisplay.js for quote display logic
- [x] Search for quote API functions in frontend and backend
- [x] Cross-reference API and backend for quote endpoints
- [x] Document and summarize current quote storage and update flow
- [x] Identify gaps for per-timeline quote isolation and persistence
- [x] Investigate misleading save notification for quote-only saves
- [x] Add refresh button to quote settings area in AdminPanel
- [x] Add `quote_text` and `quote_author` columns to Timeline model and database
- [x] (Re)implement quote refresh button in AdminPanel to populate JFK quote
- [x] Enumerate all frontend/backend elements that interact with quote fields and chart their current handling
- [x] Update save notification to "Settings Saved Successfully!"
- [x] Investigate and fix quote persistence bug (quote not saving or loading correctly)
- [x] Plan and implement safe, stepwise backend integration for per-timeline quote persistence
- [x] Add quote_text and quote_author columns to Timeline model and run safe migration
- [x] Monitor for negative side effects post-migration (timeline creation, login, quote save/load)

### 🎯 Foundation Status:
- ✅ **Quote refresh button implemented** - Populates JFK quote in AdminPanel
- ✅ **Database schema updated** - Timeline model now has quote_text and quote_author fields
- ✅ **Backend integration complete** - Quote endpoints can now persist data per timeline
- ✅ **Save notification fixed** - Shows "Settings Saved Successfully!"
- ✅ **No negative side effects** - Timeline creation, login, and core functionality intact

### 🎯 Quote System Status:
- ✅ **Quote visual UI polished** - Implemented artistic quote display with glass morphism, oversized quote marks, and shimmer effects
- ✅ **Quote display aesthetics improved** - Horizontal quote mark positioning, diamond separator, enhanced typography
- ✅ **Visual feedback implemented** - Save states and loading indicators working
- ✅ **Quote system complete** - All core functionality implemented and polished

## Current Sub Goal - Admin Page Implementation

### 🎯 Admin Page Focus:
Significant progress has been made on the Admin Panel implementation. The member management functionality is now complete with real API integration, replacing all mock data with functional backend endpoints.

### 📌 Today's Progress (2025-08-11)
- [x] Active Members on Admin page now retrieves REAL user info from backend (no mock data in this view)
- [x] Unified avatar fallback across app using `UserAvatar` (Navbar, Admin Panel, Members list, event cards/popups, profile pages)
- [x] Fixed initials sizing to scale proportionally with avatar size
- [x] Removed legacy fallback URLs and inline color overrides where found

### ✅ Completed Admin Page Tasks:
- [x] **Manage Members Section** - ✅ COMPLETE - Comprehensive member management functionality implemented
  - [x] Member list display with roles and status
  - [x] Member role management (promote/demote)
  - [x] Member removal functionality
  - [x] Member blocking/unblocking
  - [x] Real API integration with backend endpoints
  - [x] Loading states and error handling
  - [x] Confirmation dialogs for sensitive actions
  - [x] Snackbar notifications for user feedback
  - [x] Tabs for active and blocked members
  - [x] Fixed all syntax errors preventing frontend compilation

### 📋 Remaining Admin Page Tasks:
- [ ] **Manage Members Section** - Enhancement features
  - [ ] Bulk member actions
  - [ ] Member search and filtering
- [ ] **Settings Tab Enhancement** - Complete admin settings functionality
- [ ] **Manage Posts Tab** - Implement post moderation features
- [ ] **Admin Dashboard** - Overview and analytics
- [ ] **Search for and remove mock data from AdminPanel fallback/frontend code**
  - Note: Active Members now uses real data; verify no mock fallbacks remain in other Admin tabs/paths
- [ ] Clean up any unused `Avatar` imports and archive unused legacy components (`old_components/`)
- [ ] Profile Settings: add user avatar fallback color picker (store preference locally; unify with `UserAvatar`)

### 🔍 **AdminPanel Status Update:**

- **Active Members view**: now shows REAL data via `getTimelineMembers(id)` with proper avatars and roles
- **Members list (community page)**: continues to show REAL data and now shares the same avatar fallback
- **Remaining concern**: verify other Admin tabs/edge paths have no mock fallbacks

### ✅/🛠 Member Removal ("Remove from community") – TODO Checklist

- [x] Decide behavior with backend: hard delete membership vs soft-disable (preferred?) ✅ Using soft-delete with is_active_member=false
- [x] Wire UI to backend: call `removeMember(timelineId, userId)` in `handleRemoveMember()` ✅ Implemented
- [x] On success: either re-fetch via `getTimelineMembers(id)` or optimistically update and reconcile ✅ Using both approaches
- [x] Show success/error Snackbar with actionable copy ✅ Implemented
- [x] Handle permission errors (only admins/mods can remove) ✅ Backend enforces this
- [x] Keep confirmation dialog; finalize copy and warnings ✅ Implemented
- [x] Add basic test flow: remove a member, verify they disappear and member count updates ✅ Verified manually
- [x] Audit related views (MemberListTab) for consistent behavior after removal ✅ Fixed filtering in MemberListTab.js

### 🚧 Member Removal Persistence Fix - CURRENT WORK

- [x] Identify issue: Removed members still appear after page refresh
- [x] Analyze backend filtering of inactive members (confirmed working correctly)
- [x] Update MemberListTab.js to properly filter out inactive members (is_active_member === false)
- [x] Fix localStorage persistence to prevent stale membership data
- [x] Clear relevant cache keys after member removal
- [x] Test changes to ensure proper functionality ⚠️ **WORK IN PROGRESS - LAST POINT REACHED**
- [ ] Conduct thorough end-to-end testing of member removal, page refresh, and UI updates
- [ ] Monitor logs for any unexpected reappearance of removed members

### E2E Verification Checklist

- [ ] Delete member via `DELETE /api/v1/timelines/{timelineId}/members/{userId}` (admin/mod).
- [ ] Call `POST /api/v1/user/passport/sync` and verify success + updated `last_updated`.
- [ ] Clear/invalidate `user_passport_*` and `timeline_members_*` caches; re-fetch member list.
- [ ] Reload the page; confirm removed member does not reappear in AdminPanel or MemberList.
- [ ] Repeat in another browser/profile to confirm cross-session persistence.

### ✅ Lock View Work — COMPLETE (for now)
- [x] Implement `CommunityLockView` component with clear messaging and CTA
- [x] Gate AdminPanel with access-loading skeleton; render lock view on unauthorized
- [x] Update README with lock view behavior and admin access guard
- [ ] Revisit copy/UX polish after broader testing (defer)

### 🎯 **Next Session Action Plan:**

1. Complete thorough end-to-end testing of member removal persistence
   - Test with multiple browsers/sessions
   - Verify proper behavior after page refresh
   - Monitor logs for any unexpected member reappearance
2. Verify and remove any lingering mock fallbacks in AdminPanel outside Active Members
3. Implement search/filtering for members list in AdminPanel
4. Clean up unused `Avatar` imports and optionally archive `old_components/`

### 📋 Future Quote System Enhancements (Optional):
- [ ] Add quote history/versioning for timeline admins
- [ ] Test quote system across different timeline types (community vs hashtag)
- [ ] Add automated tests for quote API endpoints and UI flows
- [ ] Document quote system usage for admins and users
- [ ] Performance optimization for quote loading in timeline views

### 📋 Completed Quote System Features:
- ✅ Comprehensive error handling for failed quote save/load operations
- ✅ Loading indicators for quote fetch/save operations
- ✅ Quote validation (length limits, content filtering)
- ✅ Quote refresh functionality with default JFK quote
- ✅ Per-timeline quote persistence
- ✅ Visual feedback for quote save/load states
- ✅ Artistic quote display with modern UI elements
( will return to this. currently off-topic migrating to postgres)

## New Focus — Blocked-Aware Join Control (2025-09-07)

### Current Status
- The Join/Joined control lives in `src/components/timeline-v3/TimelineV3.js`.
- UI now supports a red "Blocked from this community" banner and hides join/member actions when `isBlocked === true && isMember === false`.
- Data flow for detection (in order):
  1) `checkMembershipStatus(timelineId)` — now preserves `is_blocked` through local cache and forces `is_member=false` when blocked.
  2) Fallback A: `getBlockedMembers(timelineId)` — may 403 for non-privileged users (expected), used only when `is_member === false` and API omitted `is_blocked`.
  3) Fallback B: `fetchUserPassport()` — reads `is_blocked` for this timeline membership if available.
  4) Final safety: one forced refresh of membership to bust stale caches.
- Known gap: the clean membership-status endpoint currently returns no `is_blocked`, so blocked users may still see Join when both fallbacks cannot resolve (403 + stale passport).
- Temporary debug logs added; legacy debug helpers referencing `setSnackbarMessage` caused console errors and will be removed.

### What We’re Trying to Accomplish
- Deterministic blocked gating for the Join control, without relying on admin-only endpoints or stale passport data.
- Keep all visuals identical to approved designs; only functional gating changes.

### Plan (Frontend)
- Short-term (no backend changes):
  - Keep current fallback chain and remove noisy legacy debug helpers in `TimelineV3.js`.
  - Optional: extract `JoinCommunityControl.jsx` to encapsulate detection and make testing simpler (no UI change).
- Preferred (with minimal backend support):
  - Consume `is_blocked` directly from membership-status response and short-circuit UI to red banner.
  - Keep a small "Sync Passport" button on the banner to reconcile local caches.

### Acceptance Criteria
- As a blocked user on a community timeline:
  - I see a red "Blocked from this community" banner where Join would be.
  - I do not see Join or member-only buttons.
  - After unblocking and refresh, the banner is gone and Join appears (or Joined if reinstated).

### Tasks
- [x] Remove legacy debug helpers that reference `setSnackbarMessage` from `TimelineV3.js`.
- [x] Optionally extract/gate Join controls (no visual change); wire verdict gating in `TimelineV3.js`.
- [x] While backend `is_blocked` signal is limited, use fallbacks (`getBlockedMembers`, passport) safely.

---

## New Focus — Promote/Demote Controls (2025-09-08)

### Goal
Implement Promote/Demote actions in AdminPanel → Active Members, cloning the style/behavior/animation you like from `MemberListTab` but without altering approved layout/typography.

### Backend
- Use existing endpoint: `PUT /api/v1/timelines/<timeline_id>/members/<user_id>/role`
- Enforce rank rules already present (actor > target; no self; creator treated as admin; SiteOwner special-case)
- No schema changes.

### Frontend Plan
- Location: `src/components/timeline-v3/community/AdminPanel.js` (Active Members list)
- Add two actions next to user role on the right:
  - Promote: member → moderator → admin (respect rank rules; cap at admin unless SiteOwner)
  - Demote: admin → moderator → member (respect restrictions; cannot downgrade SiteOwner)
- Clone the MemberListTab buttons’ style and animation; do not change sizes/margins/typography without approval.
- After role update:
  - Call `syncUserPassport()`
  - Invalidate role-related caches (member lists/count) and refresh view

### Acceptance Criteria
- Promote/Demote buttons appear only when the action is permitted for the current actor vs target.
- Successful role change persists across refresh and sessions (passport sync done).
- No UI layout shifts; animations match MemberListTab style.

### Tasks
- [x] Add `promoteMemberRole(userId)` and `demoteMemberRole(userId)` helpers in `utils/api.js` (thin wrappers around the role PUT). (covered via `updateMemberRole` usage)
- [x] Render Promote/Demote controls in AdminPanel Active Members with permission gating (UI identical style to MemberListTab buttons).
- [x] Wire success path: call PUT, then `syncUserPassport()`, then refresh members list and counts; clear relevant caches.
- [x] Add minimal error snackbar using server message.
- [x] E2E: promote/demote across roles and refresh; verify persistence and permission enforcement.
- [x] Remove legacy inline buttons from `MemberListTab.js` (read-only now).

### Next Focus
- Manage Posts tab in Admin Panel: implement moderation actions (delete/safeguard), status filtering, and real backend wiring for reported posts.

---

## Manage Posts Tab — TODO Breakdown (Wireframe Audit)

Source: `src/components/timeline-v3/community/AdminPanel.js` → `ManagePostsTab` component (currently mock data and UX only)

### UI Sections and Controls (as-is)
- [ ] Header: "Reported Posts" with `FlagIcon`
- [ ] Status Tabs (counts shown):
  - [ ] All (computed from total)
  - [ ] Pending (warning style)
  - [ ] Reviewing (info style)
  - [ ] Resolved (success style)
- [ ] Post List Item contents:
  - [ ] Event type label (e.g., "Media Event", "Remark Event")
  - [ ] Status chip with icon and color (Pending/Reviewing/Resolved)
  - [ ] Report timestamp (e.g., "Reported 2 days ago")
  - [ ] Reporter: name (avatar optional later)
  - [ ] Reason: short text (e.g., spam, harassment, copyright)
  - [ ] Assigned moderator display when present
  - [ ] Action buttons (right aligned):
    - [ ] Accept for Review (only when Pending)
    - [ ] Delete Post (not when Resolved)
    - [ ] Safeguard Post (not when Resolved)
  - [ ] Resolution label when Resolved (deleted/safeguarded)
- [ ] Confirmation Dialog for Delete/Safeguard with copy

### Data and State Requirements
- [ ] Replace mock `reportedPosts` array with real API data
- [ ] Pagination support for long lists (page, pageSize)
- [ ] Filters derived from tabs (status) and optional search (by reporter/title/reason)
- [ ] Sorting (newest first by default; optional controls later)
- [ ] Assignment data structure (assignedModerator) and transition from Pending → Reviewing

### Backend Integration Plan (no schema changes without approval)
- Endpoints under `/api/v1` (proposal):
  - [ ] GET `/api/v1/timelines/{timeline_id}/reports?status=<pending|reviewing|resolved>&page=&page_size=`
  - [ ] POST `/api/v1/timelines/{timeline_id}/reports/{report_id}/accept` → set status=reviewing, assign current user
  - [ ] POST `/api/v1/timelines/{timeline_id}/reports/{report_id}/resolve` body: `{ action: 'delete' | 'safeguard' }`
  - [ ] Optional: POST `/api/v1/timelines/{timeline_id}/reports/{report_id}/assign` body: `{ moderator_id }`
- Notes:
  - [ ] We will NOT alter database schema without explicit approval. If a new field is needed (e.g., timeline moderation mode), we will request approval before any migration work.

### Settings Tab dependency (Approval Required)
- [ ] Add a toggle in Settings: moderation mode for this timeline
  - Mode A: All posts require approval (pre-moderation queue)
  - Mode B: Only reported posts appear in Manage Posts
- [ ] This likely needs backend persistence (field on `timeline` or a separate settings table). Defer implementation pending your approval to add such a setting.

### Step-by-Step Implementation Checklist
1) Wiring skeleton (frontend only, no UX changes):
   - [ ] Create API utils: `listReports`, `acceptReport`, `resolveReport`, `assignReport` (thin wrappers)
   - [ ] Replace mock with GET call, map to existing card fields
   - [ ] Handle loading/empty/error states
2) Actions:
   - [ ] Accept for Review → POST accept, update status to reviewing, set `assignedModerator` to current user
   - [ ] Delete Post → POST resolve with `action=delete`, refresh list
   - [ ] Safeguard Post → POST resolve with `action=safeguard`, refresh list
3) Filters and pagination:
   - [ ] Status tabs filter using backend query where possible; fall back to client-side filter for first pass
   - [ ] Add simple pagination controls (Next/Prev) if backend supports; otherwise infinite scroll later
4) Assignment (optional phase 2):
   - [ ] Add Assign/Unassign flows if desired
5) Settings integration:
   - [ ] UI toggle in Settings (disabled until backend field is approved)
   - [ ] When approved, wire toggle to backend and reflect in Manage Posts behavior

### Acceptance Criteria
- [ ] Moderators/Admins can see reported posts filtered by status and take actions
- [ ] Actions persist across refresh; state reflects backend (no mock data)
- [ ] No schema changes were made without explicit approval
- [ ] No UX/visual changes beyond wiring functionality (unless explicitly approved)

---

## Reporting System — Level 1 Notes and Next Steps (2025-09-10)

### Level 1 (Foundation) — Implemented
- Report button added to all Event popups (Standard, Image, Video, Audio, News) with a minimal overlay input.
- Submission goes to placeholder backend endpoint `POST /api/v1/timelines/{timeline_id}/reports` (no schema changes).
- Authentication optional for Level 1 (anonymous allowed). Button disables to "Reported" after submission.

### Scope Toggle (Settings) — To Be Designed
- A per-timeline moderation scope toggle will be introduced in Admin > Settings:
  - Mode 1: Accept reports from any user (default Level 1 behavior).
  - Mode 2: Only accept reports from active members of that timeline.
- Backend persistence for this setting will require approval if a schema field is needed. We will prepare an impact report and request approval before any migration.

### Multi‑Timeline Review Semantics
- Posts can exist in multiple timelines; each timeline’s review workflow is isolated and should not affect other timelines.
- Cross-timeline impact only converges at the deletion decision:
  - A global deletion removes the underlying post for all timelines.
  - Safeguard/resolution within one timeline does not alter moderation state in other timelines.

### Next Step — Level 1.2
- Color-match the "Report" button to the event type’s accent color in each popup (e.g., remark/news/media-specific hues) while keeping the approved layout/typography unchanged.
- No schema changes. No UX redesign; color only.

### Future Levels (Preview)
- Level 2: Replace the minimal overlay with the site’s standardized, artistically consistent input palette (animation/close/tap-out behavior).
- Level 3: Wire Manage Posts list to consume real submitted reports with status tabs, infinite scroll (20/page), and per-status actions.
