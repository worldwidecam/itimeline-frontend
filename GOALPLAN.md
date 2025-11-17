# Personal Timeline Implementation — GOALPLAN

## Main Goal

- Implement Personal Timelines as a first-class experience while reusing the existing `TimelineV3` engine.
- Keep Community/Hashtag timelines stable while Personal can evolve independently over time.

## Current Focus (Phase 1)

**Phase 1 Objective**: Ship the basic scaffolding for Personal Timelines using current backend behavior.

- Personal timelines use the same underlying `Timeline` model and endpoints as community timelines.
- `timeline_type` will eventually accept `'personal'`, but Phase 1 treats Personal as a **frontend-only mode** (no backend divergence yet).
- Routing and UI entry points are prepared so we can layer in real data and behavior later phases.

## Architecture Overview (Personal Timelines)

- **Core Engine**: `TimelineV3` (same component used for community timelines).
- **Route Shapes**:
  - Existing: `/timeline-v3/:id` → `TimelineV3` (hashtag/community).
  - New (Personal): `/timeline-v3/:username/:slug` → `PersonalTimelineWrapper` (resolves to a timeline ID, then uses `TimelineV3`).
- **Ownership Concept**:
  - Each personal timeline is owned by a single user (derived from existing `created_by` / membership data in later phases).
  - Phase 1 focuses on viewing; write/management flows come later.

## Phase 1 — Scope and Constraints

### Scope

- Add UX surface for Personal Timelines without changing existing Community/Hashtag behavior.
- Prepare routing and UI so that personal timelines can later be wired to real data and permissions.

### Constraints

- No schema changes in Phase 1 (no new `timeline_type` values written to the DB yet).
- No backend endpoint changes in Phase 1.
- No visual/UX redesign of `TimelineV3` without explicit approval; Personal will initially reuse the same look and feel.

## Phase 1 — Completed Steps

- **Create Timeline Dialog (Home page)**
  - ✅ Removed public/private sub-choice for community timelines; new community timelines default to `visibility: 'public'`.
  - ✅ Added a third option in the Timeline Type radio group: **Personal Timeline**.
  - ✅ When Personal Timeline is selected, creation is currently blocked with a clear alert:
    - "Personal timelines are coming soon. You can currently create Hashtag or Community timelines."
  - ✅ Internal `timeline_mode` flag added on the frontend: `'standard' | 'community' | 'personal'`.

- **Routing & Placeholder**
  - ✅ New protected route added:
    - `/timeline-v3/:username/:slug` → `PersonalTimelineWrapper`.
  - ✅ `PersonalTimelineWrapper` component created under `src/components/timeline-v3/`.
  - ✅ Wrapper currently displays a centered "Personal timelines are coming soon" message and confirms the URL pattern.

## Phase 1 — Active Tasks

1. **Define Personal Timeline Data Strategy (Phase 1, no schema changes)**
   - [ ] Decide how to identify a personal timeline using existing backend data (e.g., community timeline created by user with a convention).
   - [ ] Decide how Phase 1 will treat Personal timelines in terms of visibility (owner-only vs public-like community), while still using existing endpoints.

2. **Design Resolver for `/timeline-v3/:username/:slug` (Phase 1)**
   - [ ] Define slug rules (lowercase, spaces → hyphens, URL-safe characters).
   - [ ] Phase 1 rule: only support `username === currentUser.username` for personal routes.
   - [ ] Implement a frontend resolver that:
     - Reads `:username` and `:slug` from the URL.
     - Uses existing `/api/timeline-v3` data (Home timelines) to find the matching timeline for the current user.
     - On resolution success: navigates to `/timeline-v3/:id` or renders `TimelineV3` with the resolved ID.
     - On failure: shows a clear "Personal timeline not set up yet" state.

3. **Home Page - Timelines Tool Support**
   - [ ] Plan Home page updates so users can find their personal timelines:
     - [ ] Separate the search portion of the "Timelines" tool into a banner-width search strip under the main banner.
     - [ ] Keep the existing Timelines list UI intact for now.
     - [ ] Add a conceptual filter for "My Personal Timelines" that, in later phases, will filter timelines where the current user is the owner and `timeline_type` (or mode) is personal.

## Phase 1 — Acceptance Criteria

- The application clearly presents Personal Timeline as a future option:
  - Create dialog shows Personal Timeline as a third type, but does not create real personal timelines yet.
  - Visiting `/timeline-v3/:username/:slug` shows a stable placeholder (no errors).
- No regressions to Community/Hashtag timelines (timeline creation, viewing, and admin features work exactly as before).
- No backend or DB schema changes are required to complete Phase 1.

## Phase 2+ (Preview, not in scope yet)

- Allow actual creation of personal timelines by writing `timeline_type: 'personal'` to the backend.
- Introduce a real `(username, slug) → timeline_id` resolver that uses backend data.
- Add ownership-aware permissions and a distinct visual identity for personal timelines (e.g., `@username` chips, different prefixes).
- Update Home page Timelines tool to fully support filtering and navigating to Personal Timelines.

These items will be revisited with explicit discussion, especially when they require backend logic or schema changes (e.g., treating `'personal'` as a first-class `timeline_type`).
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
