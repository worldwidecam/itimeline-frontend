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
- [ ] Add `promoteMemberRole(userId)` and `demoteMemberRole(userId)` helpers in `utils/api.js` (thin wrappers around the role PUT).
- [ ] Render Promote/Demote controls in AdminPanel Active Members with permission gating (UI identical style to MemberListTab buttons).
- [ ] Wire success path: call PUT, then `syncUserPassport()`, then refresh members list and counts; clear relevant caches.
- [ ] Add minimal error snackbar using server message.
- [ ] E2E: promote/demote across roles and refresh; verify persistence and permission enforcement.
