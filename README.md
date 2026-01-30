# iTimeline Frontend

Frontend application for the iTimeline platform, a modern web application for creating and sharing timelines with interactive event cards.

## Project Architecture & Structure

### Three-Repository Architecture

The iTimeline project consists of three interconnected repositories:

1. **itimeline-frontend** (React + Vite)
   - Port: 3000
   - Proxies API requests to `http://localhost:5000/api`
   - All new endpoints use `/api/v1` prefix

2. **itimeline-backend** (Flask)
   - Port: 5000
   - Serves API endpoints under `/api/v1`
   - JWT authentication for protected routes
   - PostgreSQL database integration

3. **iTimeline-DB** (Shared Models Package)
   - Contains SQLAlchemy models and database migrations
   - Provides `models/` directory with all ORM definitions
   - Provides `migrations/` directory with custom migration scripts
   - Used by backend via `from models import *`

### Database & Migrations

**Local PostgreSQL Connection:**
```
postgresql://postgres:death2therich@localhost:5432/itimeline_test
```

**Migration Pattern (iTimeline-DB):**
- Custom migration scripts in `migrations/` directory (NOT Alembic)
- Each migration is a standalone Python script following this pattern:
  ```python
  #!/usr/bin/env python3
  """Migration script description"""
  import os, psycopg2
  
  DATABASE_URL = os.environ.get("DATABASE_URL") or "postgresql://postgres:death2therich@localhost:5432/itimeline_test"
  
  def main():
      with closing(psycopg2.connect(DATABASE_URL)) as conn:
          with closing(conn.cursor()) as cur:
              cur.execute(DDL_CREATE)  # Your SQL here
              conn.commit()
  
  if __name__ == '__main__':
      main()
  ```
- Run migrations: `python migrations/script_name.py`
- Safe to delete after use (one-time scripts)

**Why Custom Migrations (Not Alembic):**
- iTimeline-DB is a package, not a Flask app
- Alembic requires `alembic.ini` and Flask app context
- Custom scripts are simpler, more portable, and work standalone

### Frontend API Integration

**API Utility Pattern:**
```javascript
// src/api/voteApi.js (example)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const castVote = async (eventId, voteType, token) => {
  const response = await fetch(`${BASE_URL}/events/${eventId}/vote`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ vote_type: voteType }),
  });
  if (!response.ok) throw new Error(await response.json());
  return response.json();
};
```

**Component Integration Pattern:**
```javascript
// In component (e.g., RemarkCard.js)
import { castVote, getVoteStats } from '../../../api/voteApi';

const [voteStats, setVoteStats] = useState({ promote_count: 0, demote_count: 0, user_vote: null });

useEffect(() => {
  const loadVoteStats = async () => {
    const token = localStorage.getItem('access_token');
    const stats = await getVoteStats(event.id, token);
    setVoteStats(stats);
  };
  if (event.id) loadVoteStats();
}, [event.id]);

const handleVoteChange = async (newVoteType) => {
  const token = localStorage.getItem('access_token');
  const stats = await castVote(event.id, newVoteType, token);
  setVoteStats(stats);
};
```

### Backend Endpoint Pattern

**Vote Endpoints (Example):**
```python
@app.route('/api/v1/events/<int:event_id>/vote', methods=['POST'])
@jwt_required()
def cast_vote(event_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate, check event exists, handle vote logic
    existing_vote = Vote.query.filter_by(event_id=event_id, user_id=current_user_id).first()
    if existing_vote:
        existing_vote.vote_type = data['vote_type']
    else:
        db.session.add(Vote(event_id=event_id, user_id=current_user_id, vote_type=data['vote_type']))
    
    db.session.commit()
    return jsonify(vote_stats), 200
```

### Key Concepts

- **JWT Authentication**: Token stored in `localStorage` under `access_token`
- **API Versioning**: All endpoints use `/api/v1` prefix
- **Database Models**: Defined in iTimeline-DB, imported in backend
- **Unique Constraints**: Enforce data integrity (e.g., one vote per user per event)
- **Foreign Keys**: Cascade deletes for referential integrity

## Current Focus (January 2026)

### ✅ Rich Info Card Mentions System - COMPLETE!

The iTimeline application now features **Community Info Cards with Rich Mentions**, allowing moderators to create informational cards with interactive mention chips for users, hashtags, communities, and links.

#### Major Features (January 2026)
- ✅ **Rich Content Editor**: Visual indicator showing detected mention types (@, #, i-, www.)
- ✅ **Auto-Parsing Backend**: Automatically detects and structures mentions in descriptions
- ✅ **Clickable Mention Chips**: Interactive chips for user profiles, hashtag timelines, community timelines, and external links
- ✅ **User Avatars**: Profile pictures display in user mention chips
- ✅ **Custom Hashtag Icon**: Tic-tac-toe grid icon with grey color matching community chip styling
- ✅ **Drag-and-Drop Sorting**: Reorder info cards with visual feedback
- ✅ **Backward Compatible**: Falls back to plain text display if no rich content exists

#### Implementation Details

**Backend (`app.py`)**:
- Added `content` JSON column to `CommunityInfoCard` model
- `_parse_description_to_content()` function auto-detects mentions:
  - `@username` → user mentions
  - `#name` → hashtag timeline mentions
  - `i-name` → community timeline mentions
  - `www.url` or `https://url` → external links
- Endpoints:
  - `POST /api/v1/timelines/{id}/info-cards` - Create card with auto-parsing
  - `PUT /api/v1/timelines/{id}/info-cards/{card_id}` - Update card with auto-parsing
  - `PATCH /api/v1/timelines/{id}/info-cards/reorder` - Reorder cards by card_order

**Frontend Components**:
- `RichEditor` - Text editor with visual mention detection indicator
- `RichContentRenderer` - Renders clickable mention chips with proper navigation
- `HashtagIcon` - Custom SVG grid icon for hashtag chips
- `UserAvatar` - Displays user profile pictures in mention chips
- Drag-and-drop sorting with visual feedback (opacity, highlight on drop target)

**Mention Chip Styling**:
- **User Chips**: Blue background, user avatar + username (no @ symbol)
- **Hashtag Chips**: Green background, grey grid icon + name (no # symbol)
- **Community Chips**: Purple background, people icon + name (no i- prefix)
- **Link Chips**: Orange background, link icon, opens in new tab

#### Usage
1. **Create Info Card**: Admin Panel → Info Cards Tab → New Card
2. **Add Mentions**: Type `@username`, `#hashtag`, `i-community`, or `www.url`
3. **Visual Feedback**: Non-clickable indicator shows detected mention type
4. **Display**: Cards render with clickable chips that navigate to appropriate destinations
5. **Reorder**: Drag cards by the drag handle icon to change display order

---

## Previous Focus (October 2025)

### ✅ Community Timeline Implementation - COMPLETE!

The iTimeline application now has a **fully implemented Community Timeline system** with comprehensive member management, moderation tools, access control, and privacy features.

#### Major Completions (October 2025)
- ✅ **Community Timeline System**: Complete end-to-end implementation
  - ✅ **Admin Panel**: Three-tab interface (Manage Members, Pending Requests, Settings)
  - ✅ **Member Management**: Promote/demote, remove, block/unblock with real-time updates
  - ✅ **Pending Requests**: Approval workflow for private timelines with auto-expiry
  - ✅ **Settings Tab**: Privacy toggle, approval requirements, 10-day cooldown system
  - ✅ **Access Control**: Four redirect pages (PrivateTimelineLock, CommunityLockView, MembershipGuard, BlockedFromCommunity)
  - ✅ **Join Flow**: Smart membership control with status indicators (Member, Pending, Blocked)
- ✅ **Report & Moderation System**: Full end-to-end reporting with Manage Posts interface
- ✅ **Quality of Life Improvements**: 7 UI/UX enhancements for better user experience
- ✅ **Event Status Indicators**: Visual badges for posts under review
- ✅ **Carousel Filter Sync**: Fixed navigation to respect event type filters
- ✅ **PostgreSQL Migration**: Backend fully migrated with coding guidelines documented

#### Current Major Focus (October 16, 2025)
- 🎯 **Timeline V4 - Point B System Integration** (In Progress)
  - ✅ Core Point B architecture with dual reference system
  - ✅ Smooth navigation (buttons, wheel, drag with CSS transitions)
  - ✅ EventCounter & EventCarousel Point B integration
  - 🔄 View mode switching improvements (arrow follows timestamp)
  - 🔄 Filter system Point B behavior
  - 🔄 Comprehensive V4 testing

### Timeline V4 - Point B Reference System

**Timeline V4** introduces a revolutionary dual reference point system that fundamentally changes how users navigate and interact with the timeline.

#### Core Concept: Dual Reference Points

**Point A (Current Time)**:
- Always represents "now" (current date/time)
- Updates in real-time
- The default reference point when timeline loads

**Point B (User Focus)**:
- Tracks where the user is focusing their attention
- Activated when user clicks on any event
- Persists across view mode changes (day/week/month/year)
- Visual indicator: Animated arrow pointing at focused position

#### Key Features

**1. Smart Reference System**:
- **Point B Arrow**: Shows exact fractional position (e.g., 6:40 PM, not just 6 PM)
- **Point B Reference**: Integer anchor for calculations and margin zones
- **Margin System**: Arrow can move within viewport without resetting reference
- **Precision**: Includes minutes/seconds for exact event positioning

**2. EventCounter Integration** ✅:
- Click event dot → Arrow appears at exact event position
- Cycle with arrows → Arrow moves to each event
- Respects margin rules (doesn't reset reference unnecessarily)
- Uses exact same calculation as event markers (fractional precision)

**3. EventCarousel Integration** ✅:
- **Dot Click**: Smoothly slides timeline to center event + activates Point B
- **Arrow Navigation**: Cycles through events + activates Point B at each
- **Unique Purpose**: Dot centers event, arrows just select
- **Smooth Animation**: CSS transitions for springy, natural movement

**4. Event Marker Integration** ✅:
- Click any event marker → Activates Point B at that position
- Arrow appears with bounce animation
- Fractional positioning for sub-hour/day/month/year precision

**5. Smooth Navigation** ✅:
- Button navigation (left/right arrows)
- Mouse wheel scrolling
- Touch/mouse drag
- All respect Point B when active
- CSS transitions for smooth, performant animations

#### Technical Implementation

**Helper Function**:
```javascript
calculateEventMarkerPosition(event, viewMode)
```
- Single source of truth for marker calculations
- Matches EventMarker.js logic exactly
- Handles all view modes (day/week/month/year)
- Includes fractional components (minutes, days, etc.)

**Margin Logic**:
- First activation → Sets Reference B
- Arrow within margin → Reference B unchanged
- Arrow outside margin → Updates Reference B
- Prevents unnecessary reference resets during navigation

**View Mode Calculations**:
- Day view: Hours + minute fraction
- Week view: Days + time fraction
- Month view: Months + day fraction
- Year view: Years + month + day fractions

#### Benefits

1. **Context Preservation**: User's focus persists across view changes
2. **Precise Positioning**: Arrow points to exact event time (not rounded)
3. **Smooth Experience**: No jarring jumps or resets
4. **Consistent Behavior**: All event interactions work the same way
5. **Performance**: Efficient margin system reduces re-renders

#### Upcoming V4 Features

- 🔄 View mode switching: Arrow follows timestamp (not position)
- 🔄 Filter system: Point B behavior when events hidden
- 🔄 EventList integration: Side panel event clicks
- 🔄 URL deep linking: Share links with Point B state
- 🔄 Keyboard shortcuts: Navigate with Point B awareness

#### Baseline Timeline Bar Behavior (Nov 2025)

- The baseline timeline bar is now visually locked across the viewport.
- It no longer translates or resizes with scroll or visible marker range.
- The baseline remains rendered at a fixed vertical position within the timeline container.
- Coordinate markers and labels can scroll independently above the fixed baseline.
- Result: The baseline and timeline coordinates remain visible regardless of how far Point B is from Point A [0].

#### Point B Quarantine — Pointer Arrow + Label Only (Nov 2025)

- Purpose: Keep a precise, performant focus indicator while quarantining legacy Point B logic.
- Scope:
  - Included: Pointer arrow and timestamp label driven by `focusTimestamp`.
  - Excluded: Auto-centering, margin/reference-index math, B-driven timeline math and view carryover.
- Rules:
  - View switches (day/week/month/year) call `deactivatePointB()` before switching.
  - No auto-centering on event dot or timeline marker clicks.
  - Clicking a non-event timeline marker clears any selected event.
  - Reference highlight on TimeMarkers is disabled in quarantine mode.
- Performance:
  - Arrow uses requestAnimationFrame + CSS transforms (0 React renders per frame during motion).
  - Label rendered separately (no bobbing); arrow has subtle float.
- Status: Complete and confirmed. Further Point B architecture work is deferred.

### Community Timelines & Action Cards System

The iTimeline application supports Community Timelines with a Bronze/Silver/Gold action card system that encourages member engagement through milestone-based rewards and achievements.

#### Key Features
- **Timeline Types**: Support for both hashtag timelines (automatic collections) and community timelines (user-created spaces)
- **Visual Distinction**: 
  - Community timelines are prefixed with "i-" in Lobster font
  - Hashtag timelines maintain the "#" prefix
  - Consistent styling across all UI components
- **Visibility Settings**:
  - Public community timelines are accessible to all users
  - Private community timelines display a lock icon and require approval to join
- **Implementation Details**:
  - New `TimelineNameDisplay` component for consistent timeline name rendering
  - Enhanced timeline creation dialog with type and visibility options
  - Accessibility improvements with ARIA labels and tooltips
  - Responsive design with proper overflow handling for long timeline names

#### Action Cards System
- **Bronze/Silver/Gold Tiers**: Three levels of community actions with different unlock requirements
- **Dynamic Thresholds**: Action cards appear/disappear based on member count milestones
- **Admin Configuration**: Timeline creators can set custom titles, descriptions, and due dates
- **Quote Fallback System**: When action cards are inactive, displays inspirational quotes
- **Real-time Updates**: Changes save immediately with visual feedback via enhanced FAB button
- **Backend Integration**: Full CRUD operations with authentication and admin permissions
- **Database Layer**: TimelineAction model with SQLAlchemy ORM for persistent storage

#### Privacy & Membership Features
- **Public Timelines**: Visible and accessible to all users
- **Private Timelines**: Discoverable but require approval to join
  - Appear in search results with "Request to Join" button
  - Timeline creators/admins manage join requests
  - Members see full timeline content
  - Non-members see immersive `PrivateTimelineLock` redirect page
- **Privacy Toggle System** (October 2025):
  - Located in Admin Panel → Settings Tab
  - Toggle switch to set timeline visibility (public/private)
  - **10-Day Cooldown**: Prevents switching FROM private back to public for 10 days
    - Cooldown starts when timeline is set to private
    - Orange countdown chip displays: "Cooldown: X days left"
    - Green success chip when ready: "You may go Public now!"
    - Live countdown updates every minute
    - Backend enforces cooldown (frontend cannot bypass)
  - **Backend Persistence**: `privacy_changed_at` timestamp stored in database
  - **Member Count Display**: Shows active member count in Settings Tab
  - **Purpose**: Prevents abuse of privacy feature (e.g., hiding controversial content temporarily)
- **Follower Management**: 24-hour grace period for existing followers when going private
- **Role System**: Admin, moderator, and member roles with different permissions
- **SiteOwner Access**: Special role for site owner with access to all timelines

#### Community Timeline UI Components
- **Community Dot Tabs**: Minimalist navigation between Timeline, Members, and Admin views
  - Material-UI icons for visual clarity
  - Enhanced tooltips with detailed descriptions
  - Smooth animations and transitions
  - Responsive design that works across device sizes

- **Members Tab**: 
  - "Current Action" plaque with gold-plated design to highlight community focus
  - Member list with role-based styling and avatars
  - Smooth staggered animations for better perceived performance
  - Loading skeletons for improved user experience
  - Read-only member rows (legacy inline promote/remove controls removed; management lives in Admin Panel)

- **Redirect Page Standards** (October 2025):
  - All access denial/lock pages follow immersive design standard
  - **Visual Design**:
    - Full-screen fixed positioning (`position: fixed`, covers entire viewport)
    - Gradient backgrounds that adapt to theme mode
    - Floating animated background circles with blur effects
    - Glassmorphism effects on key elements (icons, buttons)
    - High z-index (9999) to stay above all content
  - **Animation Requirements**:
    - 0.6s fade-in entrance animation
    - Staggered content appearance (0.2s, 0.4s, 0.5s delays)
    - Scale animation (0.8 to 1.0) for depth effect
    - Hover lift effects on buttons
  - **Content Structure**:
    - Large circular icon container (120x120px) with glassmorphism
    - Bold white heading (variant="h3")
    - Clear description text (variant="h6")
    - Single prominent action button with icon
  - **Button Styling**:
    - Glassmorphism with `backdrop-filter: blur(10px)`
    - Rounded pill shape (`borderRadius: '50px'`)
    - Large size with generous padding
    - Leading icon for visual clarity
    - Hover state with lift effect and increased shadow
  - **Implementation Examples**:
    - `PrivateTimelineLock.js` - Private timeline access denial (blue gradient, lock icon, "Go to Home")
    - `CommunityLockView.js` - Members/Admin page access denial (blue gradient, lock icon, "Go to Timeline")
    - `MembershipGuard.js` - Role-based access denial (red gradient, warning icon, "Go to Timeline Now")
    - `BlockedFromCommunity.js` - Blocked user access denial (red gradient, block icon, "Go to Home") - **NEW October 2025**

- **BlockedFromCommunity** (October 2025):
  - Full-screen immersive redirect for users blocked from a community
  - **Red gradient theme** to indicate error/blocked status
  - Displays when `isBlocked === true` in TimelineV3
  - Clear messaging: "You have been blocked from this community"
  - Suggests contacting community administrators
  - Single action: "Go to Home" button
  - **Trigger**: Admin blocks user via Admin Panel → Manage Members → Blocked Users tab

- **CommunityLockView**:
  - Protects private/admin-only areas with immersive lock screen
  - Follows October 2025 redirect page standard
  - Contextual title/description with call-to-action to navigate back to the timeline
  - Used when users lack membership or role permissions

- **Admin Panel Access Guard**:
  - Top-level loading skeleton while access status is being checked
  - Prevents brief flash of admin UI before authorization completes
  - Renders `CommunityLockView` for unauthorized users; otherwise renders full admin UI

- **Admin Panel** (October 2025 - COMPLETE):
  - **Three-Tab Interface**: Manage Members, Pending Requests, Settings
  
  - **Manage Members Tab**:
    - Active Members list with role badges and avatars
    - Promote/Demote controls (member ↔ moderator ↔ admin)
      - One-step transitions with permission guards
      - Cannot act on self or SiteOwner
      - Backend enforces rank rules
    - Remove member functionality with confirmation
    - Block/Unblock users with separate Blocked Users section
    - Real-time member count updates
    - Passport sync after all actions for cross-session consistency
  
  - **Pending Requests Tab** (NEW October 2025):
    - View all pending join requests for private timelines
    - Approve/Deny actions with instant feedback
    - Auto-expire requests older than 30 days
    - Shows requester info (username, email, avatar, request date)
    - Empty state when no pending requests
    - Real-time list updates after actions
  
  - **Settings Tab**:
    - Timeline visibility toggle (Public/Private)
    - **10-Day Cooldown System**: Prevents abuse of privacy switching
      - Live countdown timer (updates every minute)
      - Orange chip during cooldown, green when ready
      - Backend enforces cooldown (cannot bypass)
    - **Require Approval Toggle**: Control join request behavior
      - Auto-accept vs manual approval modes
      - Works with privacy settings
    - Member count display
    - Timeline name/description display
    - Modern UI with color-coded sections
    - Floating Action Button (FAB) for saving changes

#### Current Status
- ✅ Timeline prefix styling and display
- ✅ Visual indicators for timeline visibility
- ✅ Community timeline membership status checking
- ✅ Join community functionality
- ✅ Event display and management for community timelines
- ✅ **MEMBERSHIP SYSTEM REWRITE COMPLETE** (July 29, 2025)
  - ✅ **User-confirmed working**: Member list shows correct count, join button works end-to-end
  - ✅ **Backend**: Pure SQLAlchemy implementation, new clean `/api/v1/membership/` endpoints
  - ✅ **Frontend**: Simplified API calls, streamlined data flow
  - ✅ **Database**: Proper TimelineMember records, automatic creator admin membership
  - ✅ **Real-time updates**: Member list refreshes immediately when users join
  - ✅ **Multi-user tested**: Confirmed working with multiple user accounts
  - ✅ **Lockout UX**: CommunityLockView integrated; AdminPanel guards with loading skeleton (Aug 25, 2025)

#### Membership System Architecture (July 2025)

The membership system was completely rewritten from scratch to provide a clean, reliable foundation for community timeline features.

**Backend Implementation**:
- **Pure SQLAlchemy ORM**: Eliminated problematic sqlite3/SQLAlchemy mixing
- **Clean API Structure**: New `/api/v1/membership/` endpoints with consistent responses
- **Automatic Membership Logic**: 
  - Timeline creators automatically get admin role
  - SiteOwner (User ID 1) has access to all timelines
  - Join requests create proper database records
- **Role Hierarchy**: member < moderator < admin < siteowner

**Frontend Implementation**:
- **Simplified API Calls**: Reduced from 15+ functions to clean, consistent calls
- **Streamlined Data Flow**: Single source of truth with minimal caching
- **Real-time Updates**: Member lists refresh immediately when users join
- **Error Handling**: Robust error handling prevents UI crashes

**Key Endpoints**:
```
GET  /api/v1/membership/timelines/{id}/members    # List members
POST /api/v1/membership/timelines/{id}/join      # Join timeline
GET  /api/v1/membership/timelines/{id}/status    # Check membership status
```

#### Action Cards System (July 2025)

Community timelines feature a Bronze/Silver/Gold action card system to encourage engagement and provide milestone rewards.

**Current Implementation Status**:
- ✅ **Frontend UI**: Complete Bronze/Silver/Gold action card display in MemberListTab
- ✅ **Admin Configuration**: Settings tab in AdminPanel for configuring action cards
- ✅ **Visual Feedback**: Enhanced FAB save button with "Saving..." → "SAVED!" states
- ✅ **Database Schema**: TimelineAction model with timeline-specific storage
- ✅ **Backend Integration**: Full CRUD operations with authentication and permissions
- ✅ **Production Ready**: All authentication/permission issues resolved, system fully functional

**Action Card Features**:
- **Bronze/Silver/Gold Tiers**: Three levels of community actions with different unlock requirements
- **Configurable Settings**: Title, description, due dates, and unlock thresholds per timeline
- **Dynamic Display**: Action cards appear/disappear based on member count thresholds
- **Admin Controls**: Timeline creators and admins can configure action card settings
- **Real-time Updates**: Member list refreshes immediately when action cards are saved

**Technical Architecture**:
```
Backend: TimelineAction model with fields:
- action_type (bronze/silver/gold)
- title, description, due_date
- threshold_type, threshold_value
- timeline_id, created_by, is_active

Frontend: 
- AdminPanel/SettingsTab for configuration
- MemberListTab for display
- Real-time refresh via localStorage triggers
```

**Usage Instructions**:
1. **Admin Setup**: Navigate to Community Timeline → Admin Panel → Settings Tab
2. **Configure Actions**: Fill out Bronze, Silver, and Gold action card details
3. **Save Changes**: Click the floating save button to persist settings
4. **Member View**: Action cards automatically appear in the Members Tab based on thresholds
5. **Real-time Updates**: Changes sync immediately across all views

### Engineering Guidelines

#### Timeline View Harmonization (Jan 2026)

When implementing or modifying timeline views (day/week/month/year), keep behavior consistent across views even if each view needs performance or UX-specific logic.

**Core principles**
- **Single source of truth for data**: Use the same event data fields (`media_url`, `media_type`, etc.) across all views. Avoid re-deriving URLs or data differently per view unless strictly necessary.
- **Shared rendering rules**: Media rendering should prefer the stored `media_url` when it is already a complete Cloudinary URL. Derive fallbacks only when required.
- **Consistent filtering logic**: Date-range filtering should be view-specific, but results should be passed through the same card/marker rendering paths.
- **Performance scaling, not behavior drift**: Larger scopes (month/year) should scale by **limiting rendering volume** (pagination/windowing) or **deferring heavy media**, not by changing how media URLs are built.
- **View-specific optimizations must be explicit**: If month/year need special handling (e.g., smaller display limits), document it and keep the output data shape identical.

**Checklist for cross-view changes**
1. Verify the same event object shape reaches cards and markers in all views.
2. Confirm media URLs are identical across views for the same event.
3. If performance constraints require view-specific handling, keep fallbacks deterministic and shared.
4. Compare day/week vs month/year network requests before shipping.

**Media subtype color mapping (cards + selection glow)**
- Image: `#009688` (teal)
- Audio: `#e65100` (orange)
- Video: `#4a148c` (deep purple)
- Fallback media (unknown subtype): use `EVENT_TYPES.MEDIA` purple

#### Frontend Coding Guidelines (Admin Panel & Member Removal)

These practices prevent blank screens and ensure permission logic is consistent with the backend.

- **Module-scope helpers**
  - Define shared helpers at module scope in `AdminPanel.js` so subcomponents can access them.
  - Current helpers: `normalizeRole(r)`, `canRemoveMember(currentRole, currentId, target, timelineData)`.

- **Prop passing for subcomponents**
  - When a subcomponent needs parent state, pass it explicitly as props.
  - Example: `StandaloneMemberManagementTab` must receive `userRole`, `currentUserId`, and `timelineData`.

- **Never reference undefined state**
  - Do not read variables that aren’t in scope or not yet initialized. This causes `ReferenceError` and a blank page.
  - If needed, add a guarded localStorage fallback for current user ID inside helpers (already implemented in `canRemoveMember`).

- **UI permission guards (UX only)**
  - Hide the Remove button when `canRemoveMember(...)` is false. Never render Remove on the current user’s own row.
  - Still rely on backend for actual enforcement; surface backend error messages in snackbars.

- **Error messaging**
  - Show backend error text when removal fails: `error.response?.data?.error || 'Action failed'`.

- **Error boundaries**
  - Consider adding a small error boundary wrapper around `AdminPanel` to prevent a total blank page on render-time errors.

- **Testing checklist**
  - Verify Remove does not render for self (including SiteOwner/user 1) and creator when disallowed.
  - Verify Remove renders for allowed targets based on role hierarchy.
  - Confirm backend error messages surface in snackbar on failed attempts.

File references:
- `src/components/timeline-v3/community/AdminPanel.js` (helpers and member actions)

### Recent Bugfixes and Lessons Learned

#### Media URL Construction Regression (Jan 2026)

**Issue**: Month/year views showed Cloudinary 404s while day/week appeared fine. EventList cards attempted to construct Cloudinary URLs from a missing `cloudinary_id` field instead of using `media_url`.

**Root cause**: `MediaCard.prepareMediaSources()` rebuilt Cloudinary URLs even when `media_url` already contained a complete, valid Cloudinary URL. This diverged from marker hover cards, which used `media_url` directly.

**Fix**: Prefer `media_url` when it is already a Cloudinary URL; only attempt `cloudinary_id` fallbacks when no valid Cloudinary URL is present.

#### Timeline Page Crash (July 2025)

**Issue**: The timeline page was crashing with `ReferenceError: handleEventDelete is not defined` error, causing a blank screen.

**Root Cause**: The `handleEventDelete` function was referenced in the TimelineV3.js component but was never defined. This caused React to crash when rendering the component.

**Solution**: 
1. Added proper error logging to identify the exact error
2. Implemented the missing `handleEventDelete` function in TimelineV3.js
3. Added comprehensive error handling to prevent UI crashes

**Prevention Steps**:
1. Always ensure all referenced functions are properly defined before deployment
2. Use React Error Boundaries to catch and gracefully handle rendering errors
3. Implement thorough error handling for API calls to prevent cascading failures
4. Add detailed logging for easier debugging
5. When making code changes, verify that all necessary functions are implemented

## Community Timeline Management Systems

### Frontend Components

1. **MemberListTab** (`src/components/timeline-v3/community/MemberListTab.js`)
   - Displays the list of members for a community timeline
   - Features:
     - Member search functionality
     - Role-based styling (Admin, Moderator, Member)
     - Pagination with infinite scroll
     - Member removal functionality (for admins/moderators)
     - Action requirements display based on member count thresholds

2. **AdminPanel** (`src/components/timeline-v3/community/AdminPanel.js`)
   - Administrative interface for community timeline management
   - Features:
     - Tabbed interface (Member Management, Settings)
     - Timeline visibility controls (public/private)
     - Member approval settings
     - Action requirement configuration (gold, silver, bronze tiers)
     - Member role management

3. **CommunityDotTabs** (`src/components/timeline-v3/community/CommunityDotTabs.js`)
   - Navigation component for switching between timeline views
   - Tabs: Timeline, Members, Admin (conditional based on permissions)

4. **TimelineNameDisplay** (`src/components/timeline-v3/TimelineNameDisplay.js`)
   - Renders timeline names with proper formatting
   - Features:
     - Community timelines: "i-" prefix in Lobster font
     - Hashtag timelines: "#" prefix
     - Lock icon for private community timelines

### Backend API Endpoints

The frontend proxies API requests to the backend at `http://localhost:5000/api` during local development. All new and actively supported endpoints use the `/api/v1` prefix.

#### ⚠️ CRITICAL: Use Correct Membership Endpoints (October 2025)

**Issue**: Multiple membership status endpoints exist. Always use the community blueprint endpoints to avoid bugs.

**✅ CORRECT Endpoints to Use:**

- **Membership Status Check** (PRIMARY - Use This):
  - `GET /api/v1/timelines/{timeline_id}/membership-status`
  - **Location**: Backend `routes/community.py`
  - **Returns**: `{is_member, role, timeline_visibility, was_removed}`
  - **Behavior**: ✅ Returns `role: 'pending'` for pending users
  - **Use in**: `useJoinStatus` hook, join button logic, all access checks

- **Community Membership Operations**:
  - `POST /api/v1/timelines/{timeline_id}/access-requests` — Request to join timeline
  - `GET /api/v1/timelines/{timeline_id}/members` — Get active members
  - `GET /api/v1/timelines/{timeline_id}/pending-members` — Get pending membership requests (admin/moderator only)
  - `GET /api/v1/timelines/{timeline_id}/blocked-members` — Get blocked members (admin/moderator only)
  - `PUT /api/v1/timelines/{timeline_id}/access-requests/{user_id}` — Approve/deny pending request

**❌ AVOID (Legacy - Different behavior):**
- `GET /api/v1/membership/timelines/{id}/status` — Legacy endpoint in `app.py`
  - Now fixed but prefer community blueprint version above
  - Returns extra fields (timeline_name, etc.) not always needed

**Frontend Implementation:**
- Use `getPendingMembers()` from `api.js` for pending requests list
- Use `checkMembershipStatus()` from `api.js` for status checks
- Hook: `useJoinStatus.js` handles pending state with `isPending` flag

- **User Passport**
  - `GET /api/v1/user/passport` — Returns the user's passport (timeline memberships)
  - `POST /api/v1/user/passport/sync` — Forces a refresh of memberships

- **Member Role Management**
  - `PUT /api/v1/timelines/{timeline_id}/members/{user_id}/role` — Update a member's role (admin/moderator/member)
  - Notes: CORS enabled for PUT/OPTIONS; one-step transitions enforced server-side; SiteOwner protected

- **Media Uploads**
  - `POST /api/upload-media` — Upload media (current)
  - `POST /api/upload` — Upload generic file (current)
  - Note: These are legacy `/api` endpoints. Documentation targets `/api/v1` consistency; code updates may follow. For now, use the above paths in local dev.

- **Media Listing (Legacy)**
  - `GET /api/media-files` — List media files
  - `GET /api/cloudinary/audio-files` — List Cloudinary audio files

- **Legacy Community Management (Deprecated in docs)**
  - Older endpoints like `/timelines/...` (without `/api/v1`) are being replaced by the new `/api/v1/membership/...` routes. Avoid relying on undocumented legacy routes.

### Role System

- **SiteOwner**: Special role reserved exclusively for user ID 1
  - Has all admin and moderator privileges
  - Cannot be removed from any timeline
  - Cannot have role changed by other users

- **Admin**: Timeline administrators
  - Can manage all timeline settings
  - Can add/remove members and change roles
  - Can approve/deny access requests

- **Moderator**: Timeline moderators
  - Can add/remove regular members
  - Cannot modify admin roles
  - Cannot change timeline settings

- **Member**: Regular timeline members
  - Can view and contribute to the timeline
  - No special management permissions
- ✅ Timeline creation with type selection
- ✅ Community dot tabs navigation with enhanced visual design
- ✅ Members tab with "Current Action" plaque
- ✅ Admin panel with tabbed interface and interactive controls
- ⏳ Backend integration for member management (planned)
- ⏳ Request-to-join flow for private communities (planned)
- ⏳ Search and filtering functionality for member lists (planned)

### Popup Styling Standards

The iTimeline application implements a consistent styling approach across all event popup components, ensuring a cohesive user experience. The following standards have been established:

#### Opening Event Popups (Quick Reference)
- **EventList cards** (right panel):
  - **First click** selects/highlights the card.
  - **Second click** opens the EventPopup for that event.
- **Timeline markers** (on the timeline):
  - Clicking the **hover card above a marker** opens the EventPopup directly.
  - This uses the marker components’ internal popup state (not EventList refs).
- **EventCarousel dot** (in EventCounter):
  - Clicking the dot opens the **current event’s EventPopup** directly.
  - It does **not** change selection or re-center the timeline.

#### CreatorChip Component
- **Purpose**: Displays creator information with avatar, username, and profile link
- **Implementation**: Reusable component with color-aware styling
- **Location**: Used in all event popup components (NewsEventPopup, EventPopup, VideoEventPopup, ImageEventPopup, AudioMediaPopup)
- **Styling**:
  - Color-aware background with low opacity (15% dark mode, 8% light mode)
  - Left border accent using event type color
  - Consistent avatar size (44px) with color border
  - Hover effect with subtle transform and shadow
  - Responsive typography with proper hierarchy

#### Event Popup Standards
- **Dialog Title**:
  - Color-aware type icon matching event theme color
  - Consistent sizing and spacing
  - Clear visual hierarchy with proper typography

- **Header Accent Bar**:
  - Color-aware gradient accent at the top of the popup
  - Gradient transitions from full color to transparent (left to right)
  - Format: `linear-gradient(90deg, ${eventColor} 0%, ${eventColor}99 50%, ${eventColor}44 100%)`
  - Height of 8px for visual consistency

- **Event Details Section**:
  - Consistent metadata presentation with color-aware icons
  - Timeline Date with EventIcon in event theme color (always appears first)
  - Published Date with AccessTimeIcon in event theme color (always appears second)
  - CreatorChip positioned outside of description box
  - Proper spacing and alignment between elements

- **Color Theme Reference**:
  - News Events: Red (#d32f2f)
  - Remark Events: Blue (#2196f3)
  - Video Events: Deep Purple (#4a148c)
  - Image Events: Teal (#009688)
  - Audio Events: Orange (#e65100)

#### Implementation Guidelines
- All popups should use the CreatorChip component for creator information
- Icons in the event details section should be color-aware using the event theme color
- The type icon in the dialog title should match the event theme color
- Maintain consistent spacing, typography, and visual hierarchy across all popups

### Reporting UI (Level 1)

All Report buttons across event popups share a consistent, minimal UI and behavior to enable end-to-end reporting without schema churn.

#### Components Updated
- `src/components/timeline-v3/events/EventPopup.js`
- `src/components/timeline-v3/events/NewsEventPopup.js`
- `src/components/timeline-v3/events/VideoEventPopup.js`
- `src/components/timeline-v3/events/ImageEventPopup.js`
- `src/components/timeline-v3/events/AudioMediaPopup.js`

#### UI Rules
- Required dropdown: "Violation Type" with options
  - `Website Policy` → value: `website_policy`
  - `Government Policy` → value: `government_policy`
  - `Unethical Boundary` → value: `unethical_boundary`
- Reason field: optional multiline text.
- Submit button is disabled until a violation type is selected.
- Dialog content uses `overflow: 'visible'` to prevent floating label clipping.
- Button placement and padding consistent across all popups.

#### UI Number Formatting Standards

All numeric counters in the application follow consistent formatting rules for better readability:

**Member Counts & General Counters**:
- **0-999**: Display exact number (e.g., "55 Members", "123 Events")
- **1,000-999,999**: Display with K suffix, 1 decimal place (e.g., "1.2K Members", "5.7K Events")
- **1,000,000+**: Display with M suffix, 1 decimal place (e.g., "1.5M Members", "2.3M Events")

**Implementation**:
```javascript
const formatCount = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};
```

**Examples**:
- 55 → "55 Members"
- 1,234 → "1.2K Members"
- 5,678 → "5.7K Members"
- 1,234,567 → "1.2M Members"

**Current Implementations**:
- `CommunityMembershipControl.js` - Member count display (formatMemberCount function)
- Future: Event counts, post counts, and other numeric displays should follow the same pattern

#### Frontend API
- `submitReport(timelineId, eventId, reason?, category)` in `src/utils/api.js`
  - Sends `POST /api/v1/timelines/{timeline_id}/reports` with `{ event_id, reason, category }`.

#### Backend Behavior (Level 1 persistence)
- `routes/reports.py` stores reports in a new `reports` table.
- Accepted fields: timeline_id, event_id, reporter_id (nullable), reason, status, assigned_to, resolution, timestamps.
- Category is accepted and currently prefixed into `reason` as `[category] ...` to avoid schema churn.
- Moderation endpoints:
  - `GET /api/v1/timelines/{timeline_id}/reports` — lists items with counts/pagination.
  - `POST /api/v1/timelines/{timeline_id}/reports/{report_id}/accept` — marks `reviewing` and assigns current user.
  - `POST /api/v1/timelines/{timeline_id}/reports/{report_id}/resolve` with `{ action: 'delete'|'safeguard' }` — marks `resolved` with resolution.

#### Admin Panel Integration
- Manage Posts tab now reads from the real endpoints via `listReports`, `acceptReport`, `resolveReport`.
- Status tabs are always color-tinted (Pending=warning, Reviewing=info, Resolved=success).
- Future: display parsed category badge from reason prefix without schema change.

### Quality of Life Improvements (October 2025)

A series of UI/UX enhancements were implemented to improve the overall user experience and visual polish of the application:

#### Event Status Indicators
- **"Under Review" Visual Indicator**: Event cards now display an orange "Under Review" badge when their status is 'reviewing'
  - Appears in EventList for quick visual scanning
  - Helps moderators track which posts are actively being moderated
  - Color-coded with warning icon for immediate recognition

#### Manage Posts Enhancements
- **Event Type Icons**: Report cards now display color-coded icons indicating the type of content reported
  - News events: Red newspaper icon
  - Media events: Purple media icon (image/video/audio)
  - Remark events: Blue comment icon
  - Provides instant visual context about the reported content

- **Report Reason Chip Colors**: Violation type chips now use a cohesive color palette
  - Website Policy: Blue (#1976d2)
  - Government Policy: Orange (#ed6c02)
  - Unethical Boundary: Red (#d32f2f)
  - Solid colors with white text for better readability

- **Status Phase Borders**: Report cards feature a 4px colored left border indicating their phase
  - Pending: Orange border (#D97706)
  - Reviewing: Blue border (#2563EB)
  - Resolved: Green border (#059669)
  - Enables quick visual scanning of report status in the ALL tab

#### Event Popup Improvements
- **Grey Border Removal**: Removed subtle border artifacts from all event popup dialogs
  - Affected components: EventPopup, ImageEventPopup, VideoEventPopup, AudioMediaPopup, NewsEventPopup
  - Changed from `border: '1px solid rgba(0,0,0,0.05)'` to `border: 'none'`
  - Cleaner visual appearance without compromising definition (boxShadow still provides depth)

### EventPopup Unified Layout Standards (November 2025)

All EventPopup components now follow a consistent, unified layout structure for improved UX consistency and visual polish.

#### Standard Layout Structure

**All EventPopups follow this vertical section order:**
1. **Title & Close Button** - Header area with event title and close icon
2. **Divider** - Subtle separator (opacity: 0.5)
3. **Color Accent Bar** - 4px thin gradient line below title (via `::before` pseudo-element)
4. **Event Metadata Section** - Background-colored Paper component
   - Creator chip with user info
   - Timeline Date (with icon)
   - Published Date (with icon)
5. **Divider** - Section separator
6. **Event Description** - Clean text display with proper line height
7. **Divider** - Section separator
8. **Tags & Timelines Section**
   - "Tags" subtitle (subtitle2, fontWeight: 600)
   - TagList component
   - "Tag a Timeline" collapsible with simplified UI
9. **Report Button & Status Indicators** - Outside main content, bottom-right

**Exception - Remark EventPopup**: Uses Description → Metadata → Tags order (description is primary focus)

#### Color Accent Bar Implementation

**Standard Pattern** (4px thin line below title):
```javascript
'&::before': {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 4,
  background: `linear-gradient(90deg, ${eventColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(R, G, B, 0.2)'} 100%)`,
}
```

**Event Type Colors:**
- **News**: Red (`#d32f2f` / `rgba(211, 47, 47, 0.2)`)
- **Remark**: Blue (`#2196f3` / `rgba(33, 150, 243, 0.2)`)
- **Image**: Teal (`#009688` / `rgba(0, 150, 136, 0.2)`)
- **Video**: Deep Purple (`#4a148c` / `rgba(74, 20, 140, 0.2)`)
- **Audio**: Orange (`#e65100` / `rgba(230, 81, 0, 0.2)`)

#### Metadata Section Styling

**Background Paper Component:**
```javascript
<Paper
  elevation={0}
  sx={{
    mb: 3,
    p: 2.5,
    bgcolor: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.03)'
      : 'rgba(0,0,0,0.02)',
    borderRadius: 2,
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
  }}
>
```

**Metadata Items** (Timeline Date, Published Date):
- 32px circular icon container with subtle background
- Caption label above value
- Consistent gap spacing (1.5)
- Color-coded icons matching event type

#### Tag a Timeline UI

**Simplified Horizontal Layout:**
- Small Autocomplete field (flex: 1)
- Compact "Add" button with event-type color
- Error/Success alerts below
- Consistent with event type color scheme

#### Report Button Placement

**Position:** Outside main DialogContent, bottom-right
**Style:** Contained button with event-type background color
**Status Badges:**
- "In Review": Orange badge with rotate(-2deg) tilt
- "Safeguarded": Green badge with rotate(-2deg) tilt

#### Implementation Files
- `src/components/timeline-v3/events/NewsEventPopup.js` (Red accent)
- `src/components/timeline-v3/events/EventPopup.js` (Blue accent, Description-first order)

---

## V2 Hashtag / Timeline Chip System (November 2025)

### Overview

The V2 system redesigns hashtag/timeline creation and chip display so that hashtag (`#`), community (`i-`), and personal (`My-`) timelines have clear, consistent naming/creation rules and distinct chip areas on event cards and popups.

### V2 Naming / Creation Constraints

#### Hashtag Timelines (`#`)
- **Within hashtag type**: No duplicates globally (only one `#Fitness` hashtag timeline)
- **Cross-type collisions**: `#Fitness` can coexist with `i-Fitness` and any user's `My-Fitness`

#### Community Timelines (`i-`)
- **Within community type**: No duplicates globally (only one `i-Fitness` community timeline)
- **Cross-type collisions**: `i-Fitness` can coexist with `#Fitness` and any `My-Fitness`

#### Personal Timelines (`My-`)
- **Within personal type**: Global duplicates allowed; per-user duplicates NOT allowed
  - User A can only have one personal `Fitness` timeline
  - User B can also have their own personal `Fitness` timeline
- **Cross-type collisions**: `My-Fitness` can coexist with `#Fitness` and `i-Fitness`
- **Concept**: Personal timelines are uniquely `[username]'s _X_`, not globally unique topics

### V2 Posting & Sharing Rules (Baseline)

**Exception to auto-`#` rule**: If an event is created while on a `My-` timeline, it does NOT auto-create or attach any `#` tag. The event is associated only with that specific `My-` timeline (no implicit `#`/`i-` or other `My-` listings).

**Posts created on a `My-` timeline are treated as non-shareable in V2 baseline**: They do not leave that personal space unless a future Phase 2 rule explicitly allows it.

**From outside contexts** (e.g., viewing a post on `#fitness` or `i-fitness`), users may still add that external post to one of their `My-` timelines via `Add to Timeline`; the concern is leakage **out of** My-, not into it.

### V2 Chip Layout & Semantics

#### Three Conceptual Chip Areas on Event Cards

- **Main area (left)** — `#` area: Holds hashtag chips (topic/content tags)
- **Side-right area — Community lane**: Holds `i-` chips (community timelines that list/host this event)
- **Side-right area — Personal lane**: Holds `My-` chips (personal timelines that list/host this event)

**Rule**: When `#Fitness`, `i-Fitness`, and one or more `My-Fitness` exist and are relevant to an event, each appears in its respective area.

#### Event Card Presentation (V2 Visual)

- Up to **5 individual `#` chips**
  - If more than 5 hashtag tags, show only first 5 plus a compact **`+N` summary chip** (e.g., `+3`)
- A single **`Communities` basic chip**:
  - Uses community chip style (two-people icon, compact pill)
  - Includes a **small tally badge** (top-right) showing how many community timelines list/host this event
  - Visual-only on cards (no mini popover on click); richer detail lives in EventPopup
- A single **`Personals` basic chip**:
  - Reuses general pill style with personal-specific icon (heart+lock)
  - Includes its own **tally badge** indicating how many personal timelines list/host this event
  - Does NOT expose individual personal timeline names on the card; it is an aggregate
  - Visual-only on cards

#### EventPopup Lanes Visual Spec (V2)

**Community lane (`Communities`)**:
- Top chip: Full community chip styling with label showing selected community timeline name
- List below: Community timeline names as basic text
- Clicking a row selects that community, promoting it to the top chip
- Clicking the fully rendered top chip opens that community timeline in a new tab

**Personal lane (`Personals`)**:
- Top chip: Uses `Personals` pill styling (heart+lock icon, Lobster label, tally badge)
  - When selected entry is **current user's** personal timeline: label shows specific name (e.g., `My-Fitness`)
  - When selected entry is **another user's** personal timeline: top chip uses **user cover** representation (avatar + username) instead of exposing personal timeline title
- List below:
  - For **current user**: Rows list their own personal timelines by name; clicking a row selects it and promotes it to the top chip
  - For **other users**: Rows do NOT expose personal timeline names; they appear as simple **user cover** rows (avatar + username)
  - **SiteOwner** may see all covers (all users who have this event in their personals)
- Clicking the fully rendered top chip may open the underlying personal timeline in a new tab **only** when the viewer has permission (e.g., the owner or SiteOwner)

### Tag Creation and Auto-Tagging (Initial Rule)

- When a user creates a new tag while posting:
  - **Default rule**: Always create/attach a `#name` tag (or associate to existing `#name` hashtag timeline)
  - **Explicit exception**: When the post is being created on a **personal** timeline (`My-`), do NOT create or attach a `#` tag; the post remains scoped to that personal timeline

- When the post is being created **on a community timeline** `i-Name`:
  - V2 rule: **Auto-associate** the event with both `#Name` (hashtag dimension) and `i-Name` (community dimension)
  - The event's tags include `#name` and the event is in the `i-Name` timeline
  - On cards, we show `#name` in the main area **and** an `i-Name` chip in the community lane

**Personal exception**: Posts originating on `My-` timelines are intentionally excluded from the "always have a `#`" standard to protect personal-space privacy.

### PopupTimelineLanes Component

**Location**: `src/components/timeline-v3/events/PopupTimelineLanes.js`

**Features**:
- Three distinct lanes: Hashtag, Community, Personal
- Hashtag lane: Displays up to 5 hashtag chips + `+N` overflow; add row searches only hashtag timelines
- Community lane: Aggregate pill with count badge; add row lists only communities where user is active member (from passport)
- Personal lane: Aggregate pill with count badge; add row lists only current user's own personal timelines (from passport)

**V2 Rules Enforced**:
- Adding community in popup does **not** auto-add `#` tag (only association)
- Adding personal in popup does **not** add `#` tag (only association)
- Adding hashtag in popup adds both tag and association
- Hashtag search restricted to hashtag timelines only
- Community options filtered by active membership from passport
- Personal options filtered to current user's own timelines from passport

**Integration**: Wired into all specialized popups:
- `ImageEventPopup.js`: Replaced TagList section with lanes
- `VideoEventPopup.js`: Replaced TagList section with lanes
- `NewsEventPopup.js`: Replaced TagList section with lanes
- `AudioMediaPopup.js`: Replaced TagList section with lanes

### EventDialog V2 Rules

**Unified `EventDialog` (EventForm replacement) now enforces V2 rules:**
- On hashtag timelines: Auto-adds the base hashtag tag, stores canonical tag names without leading `#`, ensures event associates with matching hashtag timeline
- On community timelines: Auto-adds the base hashtag tag, ensures event is associated with both community and corresponding hashtag timeline; chips show in correct lanes
- On personal timelines: Does **not** auto-add any `#` tag; tag input is disabled/blurred with helper copy so personal-origin posts stay scoped to that personal timeline

### Completed V2 Implementation (November 26, 2025)

- ✅ EventCardChipsRow component wired into MediaCard, RemarkCard, NewsCard
- ✅ Event cards show up to 5 `#` chips with `+N` overflow chip
- ✅ Communities and Personals pills with tally badges (visual-only on cards)
- ✅ Hashtag navigation normalized (hashtag chips always open hashtag timeline)
- ✅ EventDialog enforces V2 rules per timeline type
- ✅ PopupTimelineLanes component with three distinct lanes
- ✅ EventPopup wired with passport membership loading and lane data derivation
- ✅ Removed community auto-`#` tagging logic; only hashtag additions add tags
- ✅ Replaced legacy TagList block with PopupTimelineLanes
- ✅ Fixed duplicate video player rendering in VideoEventPopup
- ✅ Fixed EventDialog useEffect dependency array to prevent tag overwriting

---
- `src/components/timeline-v3/events/ImageEventPopup.js` (Teal accent)
- `src/components/timeline-v3/events/VideoEventPopup.js` (Deep purple accent)
- `src/components/timeline-v3/events/AudioMediaPopup.js` (Orange accent)

#### Event Marker Redesign
- **Image Media Marker Popover**: Redesigned preview cards for image events
  - Removed grey overlay box that obscured image preview
  - Title and date now displayed below the image in a dedicated info section
  - Full, unobstructed view of image preview
  - Better visual hierarchy and readability

#### EventCounter/Carousel Improvements
- **Filter Synchronization**: Fixed carousel navigation to respect EventList type filters
  - Carousel now cycles through only the filtered events (e.g., only Media events when Media filter is active)
  - Properly switches between ALL/Media/News/Remark filters without showing hidden events
  - Index lookup fixed to use filtered events array instead of unfiltered array

- **Auto-Scroll Behavior**: Eliminated disruptive viewport jumping when using carousel navigation
  - Fixed state update order: `setShouldScrollToEvent(false)` now called BEFORE `setSelectedEventId()`
  - Prevents EventList from auto-scrolling when using left/right carousel arrows
  - Consistent behavior across all navigation methods (arrows, dots, marker clicks)
  - Users can browse events via carousel without being redirected to EventList

#### Technical Implementation Notes
- All changes maintain existing functionality while improving visual consistency
- No database schema changes required
- Backward compatible with existing data
- Performance impact: negligible (primarily CSS and state management improvements)

### Form Validation Improvements

#### Media Event Form Validation
- **Enhanced Submit Button Logic**: Submit buttons are now properly disabled until required fields are completed
- **Media Event Creator**: The "Create Media Event" button remains disabled until:
  - A title is entered
  - A media file is successfully uploaded
- **Improved User Experience**: Prevents creation of incomplete or empty media events
- **Consistent Validation**: Aligns with validation patterns used in other event forms

### Completed Features (Archive)

The following features have been successfully implemented and are now part of the core functionality:

- **Audio Media Popup & Waveform Visualizer**: Immersive audio playback with real-time visualization
- **Popup Styling Standards**: Consistent styling across all event popup components
- **Event Markers and Info Cards**: Optimized rendering and interaction for all event types

## Timeline Performance Optimization

The timeline component implements a progressive loading strategy to ensure smooth transitions between different view modes, especially when dealing with large numbers of events:

### Priority-Based Loading
1. **Timeline Structure First**: The timeline bar and marker dividers load immediately when switching views
2. **Event List Second**: The event list loads next, initially showing only the first batch of events (10-20) based on current sort order
3. **Event Markers Third**: Event markers load progressively with fade-in animations, prioritizing markers for events currently visible in the list
4. **Background Loading**: Additional events and markers load in the background as resources become available

### Performance Considerations
- **View Mode Transitions**: Transitions between view modes (day, week, month, year) are optimized to maintain responsiveness
- **Progressive Rendering**: Events and markers render in batches to prevent UI freezing with large datasets
- **Fade-In Cushioning**: Visual elements use staggered fade-in animations to create a smoother perception of loading
- **Marker Virtualization**: Only markers within or near the viewport are fully rendered to reduce DOM elements

### Event Marker Popovers

Event markers display interactive popovers when selected, providing a preview of the event content. These popovers are implemented using Material-UI's `Paper` component with custom styling.

#### Popover Types
- **News Events**: Display article title, source, and image (if available)
- **Media Events**: Show media preview with type indicator
- **Remark Events**: Show title and author

#### Customization
- **Positioning**: Popovers appear above their markers with dynamic positioning
  - News events: 24px above marker
  - Other events: 36px above marker
- **Styling**: Each event type has distinct styling:
  - Background colors and borders are theme-aware (light/dark mode)
  - Subtle box shadows and transitions for better visual hierarchy
  - Responsive scaling (80% of original size)

#### Implementation Notes
- Popovers are triggered on click (not hover) for better mobile support
- Media previews are only shown for `EVENT_TYPES.MEDIA`
- News events handle their own image display in the `EventHoverCard` component

### EventMarker Refactoring (June 2024)
- **Modular Marker Components**: Split into specialized components for each event type
  - `MediaEventMarker`: Handles image, video, and audio events with type-specific rendering
  - `NewsEventMarker`: Dedicated component for news events with optimized image handling
  - `RemarkEventMarker`: Focused component for remark/note events
- **Performance Improvements**:
  - Reduced re-renders through better component isolation
  - Optimized media loading and error handling
  - Consistent styling and behavior across all event types
- **Code Maintainability**:
  - Clear separation of concerns
  - Reusable utility functions
  - Consistent prop interfaces
  - Improved testability

### EventMarker Optimization (May 2025) <!-- BOOKMARK: EVENTMARKER_OPTIMIZATION -->
- **Immediate Marker Rendering**: Event markers now appear immediately after event creation without requiring a page refresh
- **Smart Re-rendering**: Uses React Router navigation technique to force component re-renders without full page reloads
- **Session Preservation**: Maintains user authentication during re-renders by avoiding full page refreshes
- **Improved User Experience**: Creates a seamless workflow where users can create events and immediately see them on the timeline
- **Implementation Details**:
  - Leverages the same refresh technique used in the hamburger menu navigation
  - Temporarily navigates to a redirect page and back to trigger component re-mounting
  - Clears position caches to ensure proper marker positioning after re-render

### Loading Process Improvements <!-- BOOKMARK: LOADING_PROCESS_IMPROVEMENTS -->
- **Enhanced Loading Transitions**: The EventList workspace uses sophisticated fade-in transitions with multiple properties:
  - Opacity transition (0.6 → 1.0) with 1.2s duration
  - Subtle vertical movement (8px upward) during fade-in
  - Slight blur effect (1px → 0px) for a focus effect
  - Material Design easing curve for natural motion
  - Performance optimization with willChange property
- **Non-Disruptive Loading Indicator**:
  - Fixed position overlay at bottom-left corner
  - Doesn't affect layout or cause flickering
  - Contextual messages based on loading phase and view mode
  - Modern pill design with subtle animations
  - Pulsing dot with color changes based on loading phase
- **Layout Stability Optimizations**:
  - Removed in-flow loading indicators that caused layout shifts
  - Consolidated all loading states into a single, consistent indicator
  - Fixed positioning ensures loading indicators never disrupt content flow
  - Smooth transitions prevent jarring visual changes

### Event Marker Height Constraints <!-- BOOKMARK: EVENT_MARKER_HEIGHT_CONSTRAINTS -->
- **Workspace-Aware Marker Heights**: Event markers dynamically adjust their heights to respect workspace boundaries
- **State-Based Constraints**:
  - Selected markers: Maximum height ensures at least 10px from top of workspace
  - Hovered markers: Maximum height ensures at least 20px from top of workspace
  - Regular markers: Maximum height ensures at least 30px from top of workspace
- **View-Specific Adjustments**: Different base heights for each view mode (year, month, week, day)
- **Overlapping Factor**: Marker heights still grow logarithmically when events cluster, but with enforced maximums
- **Responsive Design**: Constraints automatically adjust based on available viewport height

### EventList Pagination <!-- BOOKMARK: EVENTLIST_PAGINATION -->
- **Progressive Loading**: Initially displays only the first 20 events to improve performance
- **Load More Button**: Allows users to incrementally load 20 more events at a time with a down arrow icon
- **Smart Selection Handling**: Automatically ensures selected events are visible regardless of pagination
- **Adaptive Reset**: Pagination resets when filter criteria change to maintain consistency
- **Event Count Summary**: Shows users how many events are currently displayed out of the total filtered events
- **Memory Efficient**: All events remain in memory for marker display while limiting DOM rendering
- **To Top Button**: Floating action button appears when scrolled down, allowing quick navigation back to the top
- **Smooth Transitions**: All UI elements fade in/out with smooth animations for a polished experience

### Implementation Notes
- Filter views (day, week, month, year) apply consistent filtering logic between the event list and markers
- The base coordinate view is designed as a foundation for the timeline's coordinate system, while filter views add temporal meaning to these coordinates
- Performance degrades noticeably with more than 20 simultaneous event markers, requiring batched loading
- **LandingPageTimeline Exception**: The landing page timeline (`LandingPageTimeline.js`) is a special case that implements its own custom event markers directly within the component, rather than using the standard `EventMarker` component. This is intentional and should be treated as an exception to the standard timeline implementation.

## Component Architecture

This section provides a detailed overview of the iTimeline frontend component structure and their relationships.

### Core Timeline Components

1. **`TimelineV3.js`**
   - **Location**: `/src/components/timeline-v3/TimelineV3.js`
   - **Purpose**: Main timeline container that orchestrates all other components
   - **Key Features**:
     - Manages timeline state
     - Handles event selection
     - Coordinates between markers and event list

2. **`EventList.js`**
   - **Location**: `/src/components/timeline-v3/events/EventList.js`
   - **Purpose**: Renders the list of events in the timeline
   - **Key Features**:
     - Manages virtualized list of events
     - Handles event selection
     - Renders appropriate card types

### Event Marker Components

1. **`EventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/EventMarker.js`
   - **Purpose**: Base component for all event markers
   - **Key Features**:
     - Renders the visual marker on the timeline
     - Handles marker interactions

2. **`MediaEventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/MediaEventMarker.js`
   - **Purpose**: Specialized marker for media events
   - **Key Features**:
     - Displays media thumbnails
     - Shows media type indicators

3. **`RemarkEventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/RemarkEventMarker.js`
   - **Purpose**: Specialized marker for remark/note events
   - **Key Features**:
     - Shows note preview
     - Different visual style from media markers

### Popup/Dialog Components

1. **`EventPopup.js`**
   - **Location**: `/src/components/timeline-v3/events/EventPopup.js`
   - **Purpose**: Detailed view of an event
   - **Key Features**:
     - Shows full event details
     - Media viewer
     - Edit/Delete actions
     - **Note**: Main popup that appears when clicking an event card

2. **`EventDialog.js`**
   - **Location**: `/src/components/timeline-v3/events/EventDialog.js`
   - **Purpose**: Form for creating/editing events
   - **Key Features**:
     - Form fields for event properties
     - Media upload
     - Save/Cancel actions

3. **`MarkerPopover.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/`
   - **Purpose**: Small popup that appears when hovering/clicking a marker
   - **Key Features**:
     - Quick preview of event
     - Actions like "View Details" or "Edit"

### Card Components

1. **`MediaCard.js`**
   - **Location**: `/src/components/timeline-v3/events/cards/MediaCard.js`
   - **Purpose**: Renders media events in the event list
   - **Key Features**:
     - Displays media thumbnails
     - Play button for videos/audio
     - Media type indicators

2. **`RemarkCard.js`**
   - **Location**: `/src/components/timeline-v3/events/cards/RemarkCard.js`
   - **Purpose**: Renders note/remark events in the event list
   - **Key Features**:
     - Shows note preview
     - Different styling from media cards

### Key Distinctions

1. **Marker vs Card**
   - **Marker**: Visual indicator on the timeline axis
   - **Card**: Detailed view in the event list

2. **Popup vs Dialog**
   - **Popup (EventPopup)**: For viewing event details
   - **Dialog (EventDialog)**: For creating/editing events

3. **Marker Popover vs Event Popup**
   - **Marker Popover**: Lightweight, appears on marker hover/click
   - **Event Popup**: Full-featured, appears when clicking a card

## Features

### Diagnostic Tools
- **MediaUploader Component**: A standalone component on the homepage for testing and diagnosing media uploads
  - Direct upload to Cloudinary with detailed logging
  - Support for images, videos, and audio files
  - Preview functionality for uploaded media
  - Created to help troubleshoot media upload functionality in the main application
  - Serves as a reference implementation for proper media handling

### Timeline V3
- Interactive timeline with event cards
- Event types: Remarks, News, and Media
- Event filtering by type with modern, animated buttons
- Event sorting (newest/oldest) with preference memory
- Smart event referencing system:
  - Events can appear in multiple timelines through hashtags
  - All instances of an event share the same data
  - Changes and interactions are synchronized across timelines
- Modern UI with animations and transitions
- Responsive search functionality
- Smooth scrolling to selected events
- Dynamic Event Counter that reflects the number of visible events in the current view
  - Updates automatically as users navigate through different timeline views
  - Accounts for partially visible markers at screen edges

### Specialized Media Handling <!-- BOOKMARK: MEDIA_HANDLING -->
- **Modular Media Components**:
  - Specialized components for different media types (image, video, audio)
  - MediaPopupManager for centralized media type detection and rendering
  - Two-container layout for enhanced media viewing experience

- **Image Media** (✅ Completed):
  - Fixed image display with black background in left container (60% width)
  - Scrollable content area for event details in right container (40% width)
  - Fullscreen button for enhanced viewing
  - Responsive design that adapts to different screen sizes
  - Support for various image formats (JPG, PNG, GIF, WebP)
  - Optimized for both portrait and landscape images

- **Video Media** (✅ Completed):
  - Custom video player with playback controls
  - Thumbnail generation for video previews
  - Support for multiple video formats (MP4, WebM)
  - Adaptive streaming based on network conditions
  - Fullscreen viewing option with enhanced controls
  - Play/pause toggling when clicking selected video cards
  - Auto-pause when card is deselected or navigated away from
  - Enhanced details button with visual indicators
  - Two-container layout in popup with video player on left, content on right

- **Audio Media** (🔄 In Progress):
  - Part 1: Audio Visualizer (✅ Completed)
    - Artistic waveform visualization with particle system
    - Frequency-responsive animations and effects
    - Dynamic color changes based on audio intensity
    - Circular frequency bars with orbital paths
    - Optimized performance with React hooks
  - Part 2: Audio Player Integration (⏳ Pending)
    - Custom controls for audio playback
    - Playlist functionality for multiple audio files
    - Metadata display (artist, album, etc.)
    - Responsive design for mobile and desktop

- **Media Type Detection**:
  - Multi-layered detection using media_subtype field, file extensions, and MIME types
  - Consistent handling across components
  - Fallback mechanisms for backward compatibility

### Date and Time Handling
- **Raw Date String Storage**: Stores event dates as raw strings in the format `MM.DD.YYYY.HH.MM.AMPM`
- **Exact User Time Preservation**: Uses the `is_exact_user_time` flag to indicate user-selected times
- **Timezone-Independent Display**: Ensures accurate representation of user-inputted event dates regardless of server timezone
- **Dual Timestamp System**:
  - **Event Date**: The user-selected date and time for the event (what happened when)
  - **Published Date**: The server timestamp when the event was created (when it was recorded)
- **Backward Compatibility**: Maintains ISO date format support for legacy features

## Technical Stack

- **Framework**: React.js
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Styling**: CSS with Tailwind CSS
- **Deployment**: Docker containerization for Render.com

## Design Standards

### UX/UI Guidelines

#### Touch Screen Support (REQUIRED)
**All user interactions must support touch screen input.** When creating new UX features or updating existing ones, always consider touch-based gestures:

- **Tapping**: Primary interaction method for touch devices
  - Single tap for selection/activation
  - Double tap for detailed views (equivalent to double-click)
  - Long press for context menus or additional options
  
- **Swiping**: Navigation and dismissal gestures
  - Horizontal swipes for navigating between views or items
  - Vertical swipes for scrolling lists
  - Swipe-to-dismiss for removable items
  
- **Pinching**: Zoom and scale operations
  - Pinch-to-zoom for images, videos, and timeline views
  - Spread gesture for expanding content
  
- **Multi-touch**: Advanced interactions
  - Two-finger gestures for secondary actions
  - Rotation gestures where applicable

**Implementation Requirements:**
- All clickable elements must have adequate touch target size (minimum 44x44px recommended)
- All hover states should have touch equivalents (tap-to-reveal)
- All drag operations must work with touch drag
- Ensure no functionality is exclusively mouse-dependent
- Test all interactions on actual touch devices or browser touch emulation

#### Accessibility Standards
- **ARIA Labels**: All interactive elements must have descriptive ARIA labels
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Semantic HTML and proper labeling
- **Focus Indicators**: Clear visual indicators for focused elements

#### Responsive Design Principles
- **Mobile-First Approach**: Design for mobile, enhance for desktop
- **Breakpoints**: Consistent responsive breakpoints across components
- **Flexible Layouts**: Use flexbox/grid for adaptive layouts
- **Touch-Friendly Spacing**: Adequate spacing between interactive elements on mobile

### Event Card Interactions

#### Double-Click Behavior
Event cards in the timeline support a double-click interaction pattern:
- First click: Selects the card (highlights it and scrolls it into view)
- Second click: Opens the Event Popup with detailed information

#### Implementation Details
- Each card type (Media, News, Remark) has its own component with a dedicated click handler
- The click handler checks if the card is already selected before opening the popup
- The animation effect (push-in animation) is implemented using Framer Motion's `whileTap` property

#### Known Issues and Solutions
- **Issue**: Media cards may not respond to clicks or may not show the push-in animation effect
- **Solution**: Ensure each card component has:
  1. A direct click handler on the motion.div wrapper: `onClick={(e) => { e.stopPropagation(); handleCardClick(); }}`
  2. The `whileTap={{ scale: 0.98 }}` animation property
  3. A properly implemented `handleCardClick` function that checks for `isSelected` and opens the popup

#### Popup Closing
- Event popups can be closed by:
  1. Clicking the X button in the top-right corner
  2. Clicking outside the popup
  3. Pressing the Escape key

### Theme Quality Standard
- **Neon Effect**: The application uses sophisticated neon effects for key elements like the logo, with multi-layered text shadows and box shadows
- **Gradient Backgrounds**: 
  - Light mode: Warm peach-to-cream gradient (#ffd5c8 → #ffeae0 → #f7f4ea → #f5f1e4 → #ffffff)
  - Dark mode: Deep blue-black gradient (#000000 → #0a1128 → #1a2456)
  - Applied consistently across all pages (Login, Register, Homepage, Profile, Settings, Timeline)
  - Semi-transparent content containers with blur effects for visual depth
- **Animation**: Subtle flicker animations are used to enhance the neon effect
- **Contrast**: High contrast between text and background ensures readability while maintaining visual appeal
- **Responsive Design**: All visual elements adapt to different screen sizes while preserving the aesthetic quality

### Landing Page
- **Clean Interface**: The landing page appears without the top navigation bar for a distraction-free introduction
- **Interactive Timeline Demo**: Features a fully functional timeline with different view modes (day, week, month, year)
- **Context-Specific Events**: Each view mode displays different types of example events appropriate for that time scale
- **Direct Authentication**: Sign in and registration buttons are prominently displayed for easy access
- **Automatic Redirection**: Authenticated users are automatically redirected to the home page

### Navigation Structure
- **Conditional Navigation**: The top navigation bar appears on all pages except the landing page
- **Consistent Layout**: All authenticated pages maintain the same navigation structure for familiarity
- **Protected Routes**: Secure routes require authentication and redirect unauthenticated users to the login page
- **Logical Flow**: The application follows a natural flow from landing → authentication → home → timeline creation

### Website Terminology
- **Event**: A single entry on the timeline, which can be a remark, news, or media
- **Timeline**: A collection of events, which can be filtered, sorted, and shared
- **View Mode**: The different ways to display the timeline, such as day, week, month, or year
- **Marker**: A visual representation of an event on the timeline

## Key Dependencies

- `@mui/material`: UI components
- `@mui/icons-material`: Material icons
- `axios`: HTTP requests
- `react-router-dom`: Client-side routing
- `date-fns`: Date formatting and manipulation
- `tailwindcss`: Utility-first CSS framework

## Repository Structure

This repository contains only the frontend code for the iTimeline application. The backend code is maintained in a separate repository at [itimeline-backend](https://github.com/worldwidecam/itimeline-backend).

## Core Architecture

### Coordinate-Based Timeline (`TimelineV3.js`)  
- Zero-point reference system  
- Bidirectional infinite growth  
- Marker generation algorithm (`generateTimeMarkers`)  

### Event/Post Unification (`EventList.js`)  
- Shared data structure between events/posts  
- Hashtag-based timeline association  
- Identical rendering components  

### Navigation System (`TimelineControls.js`)  
- Scroll position preservation  
- URL parameter synchronization  
- Hover marker persistence  

## Setup and Installation

### Local Development

#### Frontend Setup (Vite)

The project has been migrated from Create React App to Vite for improved performance and developer experience.

1. Clone the repository:
   ```
   git clone https://github.com/worldwidecam/itimeline-frontend.git
   cd itimeline-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   # Vite environment variables must be prefixed with VITE_
   VITE_API_URL=http://localhost:5000
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

4. Start the development server:
   ```
   npm start
   ```

#### Environment Variables with Vite

With the migration to Vite, environment variables now use the `VITE_` prefix instead of `REACT_APP_`. In code, they are accessed using `import.meta.env.VITE_VARIABLE_NAME` instead of `process.env.REACT_APP_VARIABLE_NAME`.

Example:
```javascript
// Old way (Create React App)
const apiUrl = process.env.REACT_APP_API_URL;

// New way (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```

However, for backward compatibility, our configuration maintains support for the old `process.env.REACT_APP_*` format through a custom polyfill, so existing code will continue to work without changes.

#### Available Scripts

- `npm start` or `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

#### Performance Optimizations

The Vite build process includes several performance optimizations:

- **Code Splitting**: The application is split into multiple chunks for better loading performance:
  - `vendor.js`: Contains React and related packages
  - `utils.js`: Contains utility libraries like date-fns, axios, and framer-motion
  - `mui.js`: Contains Material UI components
  - `index.js`: Contains the application code

- **Fast Development Server**: Vite uses native ES modules for instant server start and quick hot module replacement

- **Optimized Production Builds**: Smaller and faster than Create React App builds

#### JSX in JavaScript Files

Vite is configured to properly handle JSX in `.js` files, so there's no need to rename files to `.jsx`. This maintains compatibility with the existing codebase.

#### Backend Setup

1. Clone the backend repository:
   ```
   git clone https://github.com/worldwidecam/itimeline-backend.git
   cd itimeline-backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=sqlite:///timeline_forum.db
   JWT_SECRET_KEY=your-local-secret-key
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   python app.py
   ```

#### Database Configuration

For local development, the backend uses SQLite by default. This provides a simple, file-based database that requires no additional setup. The database file will be created automatically when you start the backend server.

### Using Docker for Local Development

1. Build and start the container:
   ```
   docker-compose up
   ```

## Deployment

The application is configured for deployment on Render.com with the following setup:

1. **Static Site**:
   - Build Command: `chmod +x build.sh && ./build.sh`
   - Publish Directory: `build`
   - Environment Variables:
     - `REACT_APP_API_URL`: Your backend URL (e.g., https://api.i-timeline.com)
     - `REACT_APP_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name

## Configuration

The application uses environment variables for configuration. These can be set in a `.env` file for local development or in the Render dashboard for production:

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image optimization

## Best Practices

### Environment-Specific Configuration
- The application uses environment variables to avoid hardcoded values
- API URLs are configured based on the environment
- Configuration is centralized in `src/config.js`

### API Communication
- All API calls are made through the Axios client
- API base URL is configured through environment variables
- Authentication tokens are handled by interceptors

## Media Upload System

### Architecture
- **MediaUploader Component**: Standalone component for uploading files to Cloudinary
  - Handles file selection, validation, and upload
  - Provides detailed logging and error handling
  - Displays uploaded files with preview functionality
- **MediaEventCreator Component**: Integrates MediaUploader into the timeline event creation workflow
  - Captures upload results from MediaUploader
  - Formats data correctly for event creation
  - Handles form submission to create media events
- **MediaCard Component**: Displays media events in the timeline
  - Supports multiple media types (images, videos, audio)
  - Implements fallback mechanisms for URL resolution
  - Provides interactive media controls

### Data Flow
1. User selects a file in MediaUploader
2. File is uploaded to Cloudinary via `/api/upload-media` endpoint
3. Upload response contains URL, media type, and Cloudinary ID
4. MediaEventCreator captures this data and combines it with event details
5. Event is created with the correct media information
6. MediaCard displays the media using the URL from the event data

### Critical Fields for Media Events
- **media_url**: The URL to the media file on Cloudinary
- **url**: Duplicate of media_url for compatibility with different components
- **media_type**: The type of media (image, video, audio)
- **media**: Object containing type and URL information
- **type**: Must be set to EVENT_TYPES.MEDIA for proper event type identification
- **raw_event_date**: Formatted date string for display
- **is_exact_user_time**: Flag indicating this is a user-selected time

## Audio Integration Progress

### May 14, 2025 Updates

#### AudioWaveformVisualizer Integration
- Successfully integrated the AudioWaveformVisualizer component into the MediaCard for audio files
- Removed redundant title display from the visualizer to avoid duplication with the card title
- Adjusted the visualizer height and positioning to better fill the available space
- Fixed an issue where "Audio Visualizer" text was showing even when no title was provided

#### Audio Upload Functionality
- Confirmed that audio files are properly uploading to Cloudinary with preserved metadata
- Added proper media_subtype handling for audio files in the upload process
- Ensured the EventMediaUploader and MediaEventUploader components correctly handle audio files
- Verified that audio files display correctly in the EventList with the waveform visualizer

#### Next Steps
- Investigate creator information display in the EventPopup for audio media events
- Consider creating a specialized AudioEventPopup component similar to the existing ImageEventPopup and VideoEventPopup
- Further refine the audio visualizer appearance and behavior
- Test the complete audio upload and playback flow with various audio file formats

## Media Upload Components Documentation

### Active Components (DO NOT MODIFY)

The application includes several media upload components, but only some are actively used in the production flow. Be extremely careful when modifying these components as they are sensitive to changes:

1. **MediaUploader.js** (`src/components/MediaUploader.js`): 
   - **ACTIVELY USED** in the production application
   - Imported directly by MediaEventCreator.js for the popup media event creation
   - **EXTREMELY SENSITIVE TO CHANGES** - modifications often break upload functionality
   - Shows all previously uploaded files from Cloudinary

2. **MediaEventCreator.js** (`src/components/timeline-v3/events/MediaEventCreator.js`):
   - **ACTIVELY USED** when creating media events from the floating button
   - Contains the dialog that appears when creating a new media event
   - Integrates with the MediaUploader component
   - **EXTREMELY SENSITIVE TO CHANGES** - modifications often break upload functionality

### Auxiliary Components (Safer to Modify)

3. **MediaEventUploader.js** (`src/components/timeline-v3/events/MediaEventUploader.js`):
   - **NOT ACTIVELY USED** in the main application flow
   - A simplified version that was intended for use within the event form
   - Can be modified with less risk of breaking core functionality

4. **CloudinaryUploader.js** (`src/components/shared/CloudinaryUploader.js`):
   - **TESTING ONLY** - not used in production flows
   - A dedicated component for testing Cloudinary uploads
   - Safe to modify for testing purposes

## Lessons Learned and Best Practices

### Component Integration
- **Prop Naming Consistency**: Ensure prop names match exactly between parent and child components
  - Example: Using `onSave` in both TimelineV3.js and MediaEventCreator.js
- **Data Format Alignment**: Match the data format expected by API endpoints
  - Example: Structuring event data to match what handleEventSubmit expects

### Media Handling
- **URL Field Redundancy**: Include media URLs in multiple fields for compatibility
  - Both `media_url` and `url` fields should be set
- **Media Type Detection**: Implement multiple detection methods
  - Check MIME types, file extensions, and response data
- **Fallback Mechanisms**: Always provide fallback URLs or placeholders

### Debugging Strategies
- **Console Logging**: Add detailed logs at each step of the upload process
- **Response Inspection**: Log API responses to identify data format issues
- **DOM Inspection**: Check rendered elements to verify media display

### Common Issues and Solutions
- **Prop Mismatch**: Ensure component props match exactly between parent and child
  - Solution: Review all prop names in both components and ensure they match
- **Data Format Mismatch**: API endpoints expect specific data formats
  - Solution: Log the expected format and ensure your data matches it exactly
- **Media URL Capture**: Upload results must be properly captured and stored
  - Solution: Implement multiple methods to capture the URL (state, DOM, response parsing)
- **Media Type Detection**: Different file types require different handling
  - Solution: Use multiple detection methods and provide fallbacks

## Troubleshooting

### Common Issues

- **API Connection Issues**: Verify that `REACT_APP_API_URL` is correctly set and the backend is running
- **Authentication Problems**: Check that the JWT token is being properly stored and sent with requests
- **Image Loading Issues**: Confirm that Cloudinary is properly configured
- **Cross-Origin Errors**: Ensure that CORS is properly configured on the backend

### Database Connection Issues

- **Local Development**: If you're having issues with the SQLite database, check that the database file has been created in the backend directory and has proper permissions
- **Production**: Currently, the production database is not available as the Render PostgreSQL instance has expired. Development will continue locally until a new production database solution is implemented

## Browser Compatibility

The application is tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Issues

### Media Display in Event Cards

**Issue Description**: Media files uploaded through the EventForm are not displaying correctly in MediaCard and EventPopup components.

**Current Status**: As of March 25, 2025, we've attempted several approaches to fix this issue:

1. Updated URL construction in the EventForm to store relative URLs in the database
2. Modified MediaCard and EventPopup components to consistently handle media URLs
3. Added explicit cache control headers in the backend
4. Created a dedicated route for serving uploaded files
5. Added detailed logging throughout the media upload and display process

**Troubleshooting Findings**:
- Media files are successfully uploaded to the server (confirmed via logs)
- The backend returns the correct URL path for the uploaded files
- The frontend correctly constructs the full URL for display
- Despite these changes, media is still not displaying in the cards

**Possible Causes**:
- There might be a disconnect between how the MediaCard component expects to receive media URLs and how they're being stored
- The issue could be related to how the event data is being saved or retrieved from the database
- There might be browser caching issues preventing the media from displaying
- The media type detection logic might not be correctly identifying the uploaded files

**Next Steps**:
- Investigate how the profile avatar and music uploads are implemented, as these are working correctly
- Check the network requests in the browser to see if the media files are being requested correctly
- Consider implementing a completely different approach to media handling
- Review the database schema to ensure media URLs are being stored correctly

This issue is a high priority for the next development sprint.

## Future Development Plans

### Migration to Vite

As create-react-app is no longer maintained, a future migration to Vite is planned. This section outlines the rationale and approach for this migration.

#### Benefits of Vite for iTimeline

1. **Development Speed**:
   - Extremely fast development server with instant hot module replacement
   - No bundling during development, using native ES modules instead
   - Significantly faster startup and refresh times compared to CRA

2. **Build Performance**:
   - Optimized production builds using Rollup
   - Code-splitting by default
   - Smaller bundle sizes with better tree-shaking

3. **Modern Defaults**:
   - Native ESM-based dev server
   - TypeScript support out of the box
   - CSS modules, PostCSS, and CSS pre-processors built-in

4. **Simple Migration Path**:
   - Minimal changes to existing React components
   - Keep most of your current application structure
   - Straightforward configuration

5. **Active Maintenance**:
   - Actively maintained by Evan You and the Vite team
   - Regular updates and improvements
   - Growing ecosystem of plugins

#### Migration Considerations

1. **Entry Point Changes**:
   - Replace `index.js` with `main.jsx` as the entry point
   - Adjust HTML template structure

2. **Configuration**:
   - Create a `vite.config.js` file to replace CRA configuration
   - Configure environment variables with the `import.meta.env` syntax

3. **Dependencies**:
   - Remove react-scripts and related CRA dependencies
   - Add Vite and related plugins

4. **Build Scripts**:
   - Update npm scripts in package.json
   - Adjust build output directory references if necessary

5. **CSS Processing**:
   - Adjust CSS imports for Vite's handling
   - Configure Tailwind CSS to work with Vite

#### Recommended Migration Approach

1. **Create a parallel Vite project**:
   ```bash
   npm create vite@latest itimeline-vite -- --template react
   ```

2. **Move key configuration files**:
   - Copy over essential configuration files (tailwind.config.js, etc.)
   - Create a new vite.config.js with appropriate settings

3. **Copy source code**:
   - Move the src directory to the new project
   - Adjust the entry point (main.jsx instead of index.js)

4. **Update dependencies**:
   - Install all required dependencies in the new project
   - Ensure compatibility with Vite

5. **Test thoroughly**:
   - Verify all features work as expected
   - Address any compatibility issues

6. **Replace the original project** once everything is working correctly

This migration will provide a modern, faster development experience while maintaining the same application structure and functionality.

## Future Work and To-Do

### Backlog: Ideas & Improvements (When Bored)

This section contains low-priority improvements, polish items, and feature ideas that can be tackled when looking for something to work on. These are not blocking production but would enhance the user experience.

#### UI/UX Polish
- [ ] Add "Under Review" visual indicator on event cards when status is 'reviewing'
- [ ] Add search/filter functionality to Manage Posts list
- [ ] Consider pagination controls for Manage Posts (currently loads all)
- [ ] Add loading states for report actions (Accept/Remove/Delete/Safeguard)
- [ ] Add subtle animations for timeline marker hover states
- [ ] Improve loading skeleton designs across components
- [ ] Add empty state illustrations for timelines with no events
- [ ] Enhance error messages with actionable suggestions

#### Performance Optimizations
- [ ] Implement virtual scrolling for very long event lists (>1000 events)
- [ ] Optimize image loading with lazy loading and blur-up placeholders
- [ ] Implement request debouncing for search inputs
- [ ] Add caching strategy for frequently accessed timelines

#### Feature Enhancements
- [ ] Add event templates for quick creation
- [ ] Implement event duplication feature
- [ ] Add bulk event operations (select multiple, delete/move)
- [ ] Create timeline export functionality (PDF, JSON, CSV)
- [ ] Add timeline analytics dashboard (event count over time, most active members)

#### Admin/Moderation Tools
- [ ] Add bulk moderation actions
- [ ] Create moderation activity log/audit trail
- [ ] Implement automated spam detection
- [ ] Add customizable auto-moderation rules

#### Mobile Experience
- [ ] Optimize touch gestures for timeline navigation (per UX/UI Guidelines)
- [ ] Add pull-to-refresh on mobile
- [ ] Add haptic feedback for touch interactions
- [ ] Optimize for one-handed mobile use

#### Media & Content
- [ ] Add support for more media types (GIFs, documents, embeds)
- [ ] Implement rich text editor for event descriptions
- [ ] Add markdown support for formatting
- [ ] Add image editing tools (crop, rotate, filters)

#### Your Physical Notes
*(Add your bullet point notes here)*
- [ ] when on a community timeline, eventform needs to understand if the community is private in anyway so that if it is, it actually does NOT auto add its #hashtag counterpart chip as well. i-chip will suffice 
- [ ] need to redesign Remark Cards visually
- [ ] in event creation form, the hashtag input field should ONLY add hashtags, not communities or personals
- [ ] is email blur preference saved to passport?
- [ ] i need to make a little ballot box form icon on the website
- [ ] when searching a timeline on the homepage, the search results shouldn't be decided by the scrolling of before.
- [ ] Submission idea box for users with ideas
- [ ] i'm worried about event markers. lets brainstorm a better wat to visualize and optimize the event markers to plan for 1000s of events
- [ ] the website needs a little icon image. like the one that comes with the URL  
- [ ] we need to BAN the typing of "-" in timeline creation or inputing tags. it gets too convoluted with spaces and i'd rather have spaces.
- [ ] we need to BAN the typing of "#" in timeline creation or inputing tags
- [ ] we need to create on timelineV3 a second Reference point (reference point B), because currently everything moves only depending on 1 reference point A (point [0]). with a second reference point, we can better track what the user wants to see. even if they change filter views. Reference point B will be in relevance to the distance from Point A. and our new definition of Point A will be today's current date/time. the problem with our current understanding is that we are not tracking the distance from point A. we are tracking the distance from point 0. this is a MAJOR TODO. parent level.
- [ ] we need to create a sort of influence system, where users can influence the timeline. for instance, i'm envisioning a nuetral dot hovering above all event markers. events can be given a positive or negative vote feature. our version will be called "Promote" / "Demote".promoting and demoting will affect the position/look of this dot above the event's marker. if it is overall promoted, the dot will be green. if it is overall demoted, it will be red. we should connect all the dots horizontally like a financial chart. more thoughts on this upon request.also we must actually be working on this. this is a major parent TODO. 
- [ ] special flare to event markers with the most interaction in view. 
- [ ] take a day to audit all files. delete old unneccessary files.
- [ ] possibly add an additional row to "last visited" in hamburger menu.
- [ ] still need to figure out a way to make eventPopups not dependent on timelineV3.currently you can tell on audio media eventpopups , that the audio does not play all the way through. i think this is because the timelinev3 in the back is updating the eventpopup. 
- [ ] remember to test production server port 4173
- [ ] revisit homepage design once ratings system is in place
- [ ] create ratings system. as mentioned above in passing thought, promote and demote will be the ratings system. also we will add user ability to vote on one of the event's listed tags. that way we can use the tags in a more dynamic way. for instance, if someone added the tag #fakenews to an event, we can use this tag to rate the event. if this was the most voted tag on the event, we can stamp the event with a "fakenews" label. 
- [ ] community timelines need an overall status dropdown on their timeline pages. a fast way to see where something currently is, and if its positive or negative.
- [ ] we probably should cleanup the media event field input.
- [ ] EventPopup overlay has this weird grey border line. i can see it sometimes. it pulls me out of focus and i don't know how to better explain it.
- [ ] we need to talk about creating a comment section on events/posts. how easy/complex is this?
- [ ] home page sorting options? another thing to consider once we have a ratings system.
- [ ] profile background customization?
- [ ] Image media Popover that appears on click of event marker, should not display large info text or even title info. it takes away from viewing the image.
- [ ] notification system.
- [ ] is profile Bio saved to passport? also, profile bio could be styled better. lets make it look like a test word bubble coming from the profile picture.
- [ ] create sharing feature
- [ ] upgrage media event field input. we need new tab options for URL links to Youtube videos, tiktok videos, instagram videos, etc. that way we can outsource hosting these videos, while still being able to play them without leaving the timeline/ website.
- [ ] speaking of /reports page. users should be able to report timelines. and one of the reasons in our website policy will be monopolizing general words. so that way if someone is sitting on #Saturday for example, someone else can report it for monopolizing general words. and a reporting option for timelines can be to delete it, or convert it to a community timeline. or the reverse! convert a community timeline to a hashtag timeline.
- [ ] the event markers look to be vertically too low. their vertical bottom is intersecting the timelines horizontal line and coming out the other side
- [ ] make a subsection tab of news event type for social media. that way we can spend less space storing social media posts. 
- [ ] make SiteAdmin role
- [ ] make remarks more like tweet phone convo word bubbles, featuring the user's profile picture and name. 


---

### Database Migration Strategy

#### Current Challenge
The application currently uses SQLite for local development, but production deployment will require PostgreSQL. Previous attempts to prepare for PostgreSQL migration resulted in compatibility issues that affected core functionality:

- Login/authentication stopped working properly
- Saved information failed to load correctly
- Media files couldn't be retrieved

#### Potential Solutions

1. **PostgreSQL for Both Environments**
   - Use PostgreSQL locally and in production for complete environment parity
   - Eliminates compatibility issues between different database systems
   - Provides more realistic testing conditions
   - Requires additional setup but prevents deployment surprises

2. **Database Abstraction Layer**
   - Enhance SQLAlchemy models to work seamlessly with both database types
   - Create migration scripts that handle dialect-specific differences
   - Implement compatibility wrappers for database-specific features

3. **Containerized Development Environment**
   - Use Docker to create consistent development environments
   - Package PostgreSQL as part of the development container
   - Simplify setup while maintaining production parity

#### Decision Criteria
- Development simplicity vs. production reliability
- Team familiarity with PostgreSQL administration
- Available system resources for local development
- Timeline for production deployment

This database strategy is a high-priority item that needs to be addressed before production deployment.

### Authentication Migration to Better Auth

#### Planned Migration
The iTimeline project plans to migrate from the current Flask-JWT-Extended authentication system to **Better Auth** (https://www.better-auth.com/) as the final major migration before production deployment.

**Why Better Auth?**
- Framework-agnostic TypeScript authentication library
- Comprehensive security features (CSRF protection, rate limiting, password breach detection)
- Native PostgreSQL support
- Plugin ecosystem for advanced features (2FA, passkeys, social OAuth, magic links)
- Built-in role-based access control and session management
- Active maintenance and growing community

**Migration Timing:**
- **Status**: Planned for pre-production
- **Priority**: Final migration before production launch
- **Rationale**: Avoid schema changes during active development; current Flask-JWT system is stable and meeting needs

**Migration Scope:**
1. **Backend**: Replace Flask-JWT-Extended with Better Auth Express adapter
2. **Frontend**: Integrate Better Auth React client
3. **Database**: Migrate user/session tables to Better Auth schema (requires careful planning)
4. **Features**: Preserve all existing authentication functionality
5. **Enhancements**: Add 2FA, social OAuth, and improved session management

**Pre-Migration Checklist:**
- [ ] Complete all core features and stabilize application
- [ ] Document current authentication flow and dependencies
- [ ] Create comprehensive test suite for auth-dependent features
- [ ] Plan database migration strategy with rollback capability
- [ ] Set up staging environment for migration testing
- [ ] Obtain explicit approval for schema changes (per project guidelines)

**Risk Mitigation:**
- Database schema changes require explicit approval
- Full backup before migration
- Incremental rollout with feature flags
- Comprehensive testing of timeline membership, admin panel, and community features
- User communication plan for any downtime

**Alternative Considered:**
Incremental enhancement of Flask-JWT (rate limiting, 2FA via PyOTP, social OAuth via Authlib) was considered but Better Auth provides a more comprehensive, maintainable solution for long-term production needs.
