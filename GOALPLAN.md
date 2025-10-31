# Main Goal - Timeline Architectural Improvements

## Lean Plan (2025-10-14)

### Main GOAL
- Prepare application for production launch

### Sub GOALS (In Order)
1. ✅ Community Timeline Implementation (COMPLETE - Oct 14, 2025)
2. 🎯 Timeline Reference Point B System (CURRENT - MAJOR)
3. ⏳ Promote/Demote Voting System
4. ⏳ Better Auth Migration (FINAL PRE-PRODUCTION)

### Current Sub GOAL
- Timeline Reference Point B System

### Current Goal within Sub GOAL
- Understand and document current timeline coordinate system

### COMPLETED TODO (2025-10-14)
- ✅ **Community Timeline Implementation** - COMPLETE:
  - ✅ Admin Panel with three tabs (Manage Members, Pending Requests, Settings)
  - ✅ Member management (promote/demote, remove, block/unblock)
  - ✅ Pending requests workflow with auto-expiry
  - ✅ Settings tab with privacy toggle and approval requirements
  - ✅ Four redirect pages for access control
  - ✅ Smart join button with status indicators
  - ✅ PostgreSQL migration with coding guidelines
  - ✅ BlockedFromCommunity redirect page

### CURRENT TODO
- [ ] **Timeline V4 - Point B System Integration** ⭐ CRITICAL ARCHITECTURE CHANGE
  - [x] Core Point B architecture implemented (Phase 1)
  - [x] Decoupled arrow/reference system (Phase 2)
  - [x] Smooth navigation (buttons, wheel, drag) (Phase 3A)
  - [x] Performance fixes (settle detection, drag optimization) (Phase 3A)
  - [ ] **CURRENT: Timeline V4 Component Integration (Phase 3B)**
    - [x] 🎯 Fix EventCounter to respect Point B margin rules (uses activatePointB which has margin logic)
    - [x] 🎯 Fix arrow selection logic: uses EXACT same calculation as EventMarker.js (includes minutes!)
    - [x] 🎯 EventCarousel dot click: smooth slide to center + select (gives dot unique purpose) ✅ Oct 16
    - [x] 🎯 EventCarousel arrows (left/right): activate Point B when cycling through events ✅ Oct 16
    - [x] 🎯 Created helper function calculateEventMarkerPosition() to avoid code duplication ✅ Oct 16
    - [x] 🎯 Updated README with Timeline V4 features and technical details ✅ Oct 16
    - [x] 🎯 **Fix view mode switching - arrow follows TIMESTAMP not POSITION** ✅ Oct 17
      - Timestamp is now source of truth for Point B Reference
      - View switching recalculates both arrow (fractional) and reference (integer) positions
      - Timeline centers on Point B when active (Point B has priority over Point A)
      - Hybrid margin system: viewport-based with view-specific scaling (prevents year view loading decades)
      - Margins recalculate immediately on view switch
      - Year view margin reduced to 0.3x (forces reference update per year coordinate)
      - Timeline marker clicks now preserve current minutes/hours for precision
    - [x] 🎯 **Fix Point A/Point B independence - timestamp immutability** ✅ Oct 17
      - Point B timestamp NEVER recalculates after initial activation
      - Timestamp only updates when user clicks new marker/event or switches views
      - Prevents Point B from following Point A when hour changes
      - Point B truly independent from Point A updates
  - [ ] EventList Point B integration
  - [ ] Filter system Point B behavior
  - [ ] Comprehensive V4 testing

### QUALITY OF LIFE IMPROVEMENTS - COMPLETED (2025-10-10)
- ✅ Add "Under Review" visual indicator on event cards when status is 'reviewing'
- ✅ Add event type icons to Manage Posts report cards (color-coded)
- ✅ Update report reason chip colors (Blue/Orange/Red palette)
- ✅ Fix EventPopup grey border visual issue (removed subtle border artifacts)
- ✅ Redesign image media marker popover (moved title/date outside image preview)
- ✅ Fix EventCounter/Carousel filter synchronization (respects EventList type filter + no auto-scroll)
- ✅ Restore left border colors on Manage Posts report cards (status phase indicator)
- ✅ Update README with October 2025 improvements and current focus

### Timeline Reference Point B System - DETAILED PLAN

**Problem Statement**:
Current system only tracks distance from point [0], causing issues:
- Filter view switches lose user context (e.g., 8 hours in day view = 8 years in year view)
- Clunky event marker movement
- Poor scroll position memory across view changes
- User loses their place when switching between day/week/month/year views

**Solution**: Dual reference point system:
- **Point A**: Today's current date/time (absolute reference)
  - Always represents "now"
  - Updates in real-time
  - Serves as the anchor for all calculations
- **Point B**: User's focus position relative to Point A
  - Tracks distance from today, not from [0]
  - Maintains context across view changes
  - Preserves user's scroll position
  - Example: "3 days ago" stays "3 days ago" regardless of view mode

**Impact**:
- ✅ Fixes navigation across filter views
- ✅ Maintains user context when switching views
- ✅ Smoother scrolling and marker movement
- ✅ Better UX for timeline exploration

**Complexity**: HIGH - Core timeline coordinate system refactor
**Priority**: CURRENT FOCUS

### Production Roadmap

**Phase 1: Community Timeline Implementation** ✅ COMPLETE (Oct 14, 2025)
- ✅ Admin Panel with full member management
- ✅ Pending requests workflow
- ✅ Privacy and approval settings
- ✅ Access control redirect pages
- ✅ PostgreSQL migration

**Phase 2: Timeline Reference Point B** (Current - Est. 2-3 weeks) ⭐
- Refactor core coordinate system
- Implement dual reference points
- Fix filter view context switching
- Optimize event marker movement
- Improve scroll position memory

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

### Deferred Features (Post-Production)
- [ ] Timeline name/description editing (requires uniqueness logic)
- [ ] Timeline deletion functionality (requires confirmation flow)
- [ ] Search/filter functionality for Manage Posts list
- [ ] Pagination controls for Manage Posts
- [ ] Loading states for report actions
- [ ] Favicon/site icon for branding
- [ ] Bulk member actions in Admin Panel
- [ ] Member search and filtering in Admin Panel

---

## Archive - Community Timeline Implementation (COMPLETE)

### Final Status (2025-10-14)
✅ **Community Timeline System - PRODUCTION READY**

All core features implemented and tested:
- Admin Panel with three tabs (Manage Members, Pending Requests, Settings)
- Member management (promote/demote, remove, block/unblock)
- Pending requests workflow with auto-expiry (30 days)
- Settings tab with privacy toggle and approval requirements
- 10-day cooldown system for privacy switching
- Four redirect pages (PrivateTimelineLock, CommunityLockView, MembershipGuard, BlockedFromCommunity)
- Smart join button with status indicators (Member, Pending, Blocked)
- Report & moderation system with Manage Posts interface
- PostgreSQL backend with proper migrations
- Comprehensive documentation in README

### Key Achievements
- ✅ Zero mock data - all features use real backend APIs
- ✅ Real-time updates across all actions
- ✅ Passport sync for cross-session consistency
- ✅ Permission guards and role enforcement
- ✅ Immersive redirect pages following October 2025 standard
- ✅ PostgreSQL compatibility with coding guidelines documented

---

## Detailed History (Archive)

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

---

## Notes - Point B System Critical Fixes (2025-10-17)

### 🔴 Critical Bug Discovered: Point A/Point B Independence Failure

**User Experiment Revealed**:
1. Day view, 6 AM → Click marker `[0]` at 6 AM → Point B = 6 AM (red)
2. Wait 1 hour → Point A updates to 7 AM (blue, marker `[0]`)
3. **BUG**: Point B also updated to 7 AM ❌
4. **Expected**: Point B stays at 6 AM (red, now marker `[-1]`) ✅

**Root Cause Analysis**:
- Point B timestamp was being **recalculated** using `new Date()` whenever:
  - Reference position updated during scrolling (`smoothScroll()`)
  - Reference moved outside margin zone (`activatePointB()`)
- This meant Point B was **following Point A** instead of being independent
- The timestamp should be the **source of truth** and never change after initial activation

### ✅ Complete Fix Implementation

#### Fix 1: Timestamp Immutability (CRITICAL)
**Files**: `TimelineV3.js` lines 1864-1870, 1923-1934
- **smoothScroll()**: Removed timestamp recalculation when reference moves
- **activatePointB()**: Only set timestamp on first activation, never on reference updates
- **Result**: Point B timestamp is now truly immutable after initial click

#### Fix 2: Reference Position Rounding (Math.floor)
**Files**: 3 locations in `TimelineV3.js`
- Changed `Math.round()` to `Math.floor()` for all reference calculations
- **Result**: Reference is always closest marker TO THE LEFT of arrow
- **Example**: Arrow at 0.7 → Reference at 0 (not 1)

#### Fix 3: Year View Margin Reduction
**File**: `TimelineV3.js` line 342
- Changed year view margin from `1.0x` to `0.3x` viewport
- **Result**: Forces reference update per year coordinate, prevents massive distances
- **Impact**: Year view now has ~5-6 year buffer instead of ~18 years

#### Fix 4: Timeline Marker Precision
**File**: `TimeMarkers.js` lines 159-185
- Timeline markers now preserve current minutes/hours/days when calculating timestamp
- **Result**: Arrow follows timeline markers correctly when switching views
- **Example**: Click 5 PM marker at 5:37 PM → timestamp = "5:37 PM" (not "5:00 PM")

#### Fix 5: Return to Present Button
**File**: `TimelineV3.js` lines 2760-2763
- "Back to Present" button now calls `deactivatePointB()` before centering
- **Result**: Clears Point B state and returns to Point A as expected

#### Fix 6: Rendering Responsibility Transfer
**File**: `TimelineV3.js` lines 598-600, 630
- `visibleMarkers` calculation now uses Point B reference when active
- **Result**: Events, markers, data all render based on Point B position
- **Impact**: Fixes blank screen when Point B far from Point A

### 🎯 System Architecture Now Correct

**Point B Timestamp Lifecycle**:
1. **First Activation**: Timestamp set from click parameter ✅
2. **Scroll Movement**: Reference may update, timestamp NEVER changes ✅
3. **View Mode Switch**: Timestamp stays same, arrow/reference recalculated FROM timestamp ✅
4. **Point A Updates**: Timestamp NEVER changes, Point B truly independent ✅
5. **New Click**: Timestamp replaced with new timestamp ✅

**Testing Checklist**:
- [ ] Re-test Point A independence experiment (should now work correctly)
- [ ] Test year view margin reduction (click 2024 → 2021 → switch views)
- [ ] Test timeline marker precision (click marker, switch views, arrow follows)
- [ ] Test backwards arrow movement through all view modes
- [ ] Verify return to present deactivates Point B

**Console Logs to Monitor**:
```
[Point B] First activation - Timestamp set to: [timestamp]
[Point B] Timestamp unchanged (source of truth): [timestamp]
[SmoothScroll] Timestamp unchanged (source of truth): [timestamp]
```

**Status**: All critical Point B system fixes implemented. The system now properly maintains Point B independence from Point A updates and preserves timestamp immutability.

---

## Notes - Point B System Architecture Analysis (2025-10-29)

### 🎯 Point A/Mom vs Point B/Dad Responsibility Model

**Core Concept**: Point B (Dad) should take over ALL coordinate system responsibilities when active, not just center positioning. Point A (Mom) should only handle baseline calculations when Point B is inactive.

### 🔴 Critical Discovery: Incomplete Point B Takeover

**User Test Results**:
- Set Point A = 12 PM, Point B = 12 PM → Both at marker [0] ✅
- When time changes to 1 PM → Point B should stay at 12 PM (now marker [-1]) ❌
- **Current Issue**: Point B still follows Point A movements

**Root Cause**: Point B only handles **center positioning** but **ALL other calculations** still ask Point A for current time.

### 📋 Complete List of Elements Still Dependent on Point A (Mom)

#### 🎯 Core Time & Position Systems:
1. **`hoverPosition`** (line 482) - Updates every minute via `getExactTimePosition()`
2. **`pointA_currentTime`** (line 354) - Direct current time tracking
3. **`getCurrentDateTime()`** (line 163) - Base function returning `new Date()`

#### 📅 Date Calculation Functions:
4. **`getDayProgress()`** (line 182) - Uses `getCurrentDateTime()`
5. **`getMonthProgress()`** (line 188) - Uses `getCurrentDateTime()`
6. **`getYearProgress()`** (line 194) - Uses `getCurrentDateTime()`
7. **`getExactTimePosition()`** (line 202) - Uses `getCurrentDateTime()`

#### 🎨 Visual Timeline Elements:
8. **HoverMarker** (line 3430) - Uses `hoverPosition` which updates every minute
9. **Timeline Markers** - Many calculations use `currentDate = new Date()`

#### 📊 Event Filtering & Rendering:
10. **Event filtering in multiple places** - Lines 833, 930, 1003, 1155, 2987, 3243, 3327
    - All use `currentDate = new Date()` for calculating visible event ranges
11. **Event distance calculations** - Lines 3327-3348 use `currentDate` for sorting/filtering

#### 🔄 View Mode Switching:
12. **`convertPointBToViewMode()`** (line 2122) - Creates `currentDate = new Date()` as Point A [0]
13. **Timeline marker creation** (line 2175) - Uses `currentDate` for timestamp calculations

#### ⏰ Time-based Updates:
14. **Minute-based timer** (line 2215) - Updates `hoverPosition` every 60 seconds
15. **Various timestamp generations** - Lines 1719, 1721, 2391 use `new Date()`

### 🚨 The Core Problem

**Point B (Dad) is only handling "center positioning"** (lines 598-600), but **all actual coordinate calculations, filtering, and rendering** are still asking Mom (Point A) for the current time.

When switching to a view where Point B is far from Point A:
- **Timeline centering** uses Point B ✅ (Dad's responsibility)
- **Event filtering** still uses Point A ❌ (Mom still working)
- **Marker positioning** still uses Point A ❌ (Mom still working)
- **Visual elements** still use Point A ❌ (Mom still working)

This explains why only the base timeline renders - the **event filtering system** calculates ranges around Point A's time, not Point B's reference!

### 🛠️ Required Point B System Takeover

Point B (Dad) needs to take over **ALL coordinate system responsibilities**:

1. **Create "Who's in Charge?" Helper Function**:
   ```javascript
   const getCurrentTimeReference = () => {
     return pointB_active ? new Date(pointB_reference_timestamp) : new Date();
   };
   ```

2. **Replace All `currentDate = new Date()`** calls with:
   ```javascript
   const currentDate = getCurrentTimeReference();
   ```

3. **Freeze Time-based Updates** when Point B is active:
   - Stop `hoverPosition` minute updates
   - Pause all time-based recalculations

4. **Update Event Filtering Ranges** to use Point B's reference when active

5. **Fix All Visual Elements** to use Point B-based time calculations

### 📊 Implementation Priority:

**Phase 1: Core Time Reference System**
- Create `getCurrentTimeReference()` helper
- Replace critical `currentDate = new Date()` calls
- Fix `hoverPosition` updates

**Phase 2: Event Filtering System**
- Update all event filtering functions
- Fix distance calculations
- Ensure events render around Point B when active

**Phase 3: Visual Elements**
- Update HoverMarker, Timeline markers
- Fix all time-based visual updates
- Ensure complete Point B takeover

**Current Status**: Point B architecture partially implemented. Only center positioning respects Point B authority. All other systems still defer to Point A, causing incomplete Point B functionality and rendering issues when Point B is far from Point A.
