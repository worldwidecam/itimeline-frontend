# THE POSSIBLE HURDLES

## Code Architecture Challenges
1. **Component Overloading**: 
   - Shared components handling both hashtag and community timelines may become complex and difficult to maintain
   - Solution: Consider refactoring to use composition or inheritance patterns where appropriate
   - Consider splitting components into base/shared functionality and timeline-type specific extensions

## Performance Concerns
1. **Conditional Rendering Overhead**: 
   - Excessive conditional logic for different timeline types may impact performance
   - Solution: Use code splitting and lazy loading for timeline-type specific features

## User Experience Consistency
1. **Navigation Paradigm Shifts**: 
   - Different interaction models between hashtag and community timelines may confuse users
   - Solution: Maintain core interaction patterns while clearly indicating different capabilities

## Backend Integration
1. **API Complexity**: 
   - Endpoints serving multiple timeline types may become complex
   - Solution: Consider versioned or specialized endpoints for community-specific features

## Security and Privacy
1. **Access Control**: 
   - Private community timelines require robust permission checking throughout the codebase
   - Solution: Implement consistent permission checking middleware/hooks

## Testing Challenges
1. **Test Coverage**: 
   - Different timeline behaviors require more comprehensive test cases
   - Solution: Create separate test suites for shared and specialized behaviors

# THE GOAL
Implement a flexible timeline system with three distinct types:
1. **Hashtag Timelines**: Automatic collections of posts with specific hashtags (existing functionality)
2. **Community Timelines**: User-created spaces with public/private visibility
3. **Personal Timelines**: For individual use (future consideration)

# TIMELINE TYPES

## 1. Hashtag Timelines
- **Type**: `hashtag` (existing)
- **Purpose**: Automatic collections of public posts
- **Characteristics**:
  - Created automatically when a post uses a new hashtag
  - High-volume, optimized for performance
  - No direct ownership or moderation
  - Always public

## 2. Community Timelines
- **Type**: `community` (new)
- **Naming**:
  - **Prefix**: `i-` (always lowercase 'i')
    - Automatically added based on `timeline_type`
    - Styled with Lobster font for brand consistency
    - Handled separately from the title text transformation
  - **Display Examples**: 
    - `i-USC`
    - `i-MUSICLOVERS`
    - `i-GRADUATION` (prefix remains lowercase when title is uppercase)
- **Purpose**: User-created spaces for collaboration
- **Visibility Settings**:
  - **Public**: Anyone can view, members can contribute
  - **Private**: Requires approval to view/contribute
### Member Roles
- **Admins**:
  - Original creator of the timeline
  - Full control over all timeline settings
  - Can toggle timeline between public/private
  - Can assign/remove moderators
  - Can manage all content and members
  - Can delete the timeline

- **Moderators**:
  - Can remove posts (e.g., for duplicates or violations)
  - Can lock/unlock comments on posts
  - Can remove members (except admins)
  - Can approve/deny follow requests
  - Cannot change timeline settings or privacy

- **Members**:
  - Can create posts and comments
  - Can like and share content
  - Can report content to moderators
  - Can invite new members (configurable)

- **Viewers** (non-members of private timelines):
  - Can see the timeline exists in search results
  - See a restricted access page when visiting
  - Can request to join the timeline

### Notification System (Preliminary Notes)

**Key Notification Events**:
- New member requests (for private communities)
- Post approvals/rejections
- Moderation actions on user content
- Community mentions (`i-community`)
- Admin/moderator messages
- Ownership transfer requests

**Implementation Notes**:
- In-app notification center (bell icon)
- Email digests for important updates
- User-configurable notification preferences
- Real-time updates via WebSocket

### Community Management & Settings

1. **Admin Controls**:
   - Accessible via gear icon on the community timeline
   - Only visible to community admins

2. **Timeline Settings**:
   - **Basic Info**:
     - Display name (with `i-` prefix in Lobster font)
     - Description
     - Profile image/cover photo
   - **Privacy Settings**:
     - Toggle between public/private
     - Warning about 10-day cooldown when switching to private
   - **Community Guidelines**:
     - Custom rules and guidelines
     - Code of conduct
     - Reporting procedures

3. **Member Management**:
   - **Members List**:
     - Search and filter members
     - View join date and activity
   - **Moderators**:
     - List of current moderators
     - Add/remove moderators from member list
     - View moderator activity log
   - **Ownership Transfer**:
     - Search box for selecting a moderator
     - Crown icon to initiate transfer
     - Confirmation dialog with warning
     - Cannot be undone without the new owner's cooperation

4. **Danger Zone**:
   - **Delete Community**:
     - Available only to the original creator
     - Requires confirmation
     - Option to archive instead of delete (soft delete)
   - **Export Data**:
     - Export all community content
     - Available to admins only

5. **Moderation Tools**:
   - **Report Queue**:
     - View and manage reported content
     - Filter by report type/severity
   - **Banned Users**:
     - List of banned members
     - Option to unban or view ban reason
   - **Moderation Log**:
     - Audit trail of all moderation actions
     - Filterable by moderator/action type

### Community Creation Flow

1. **Initiating Creation**:
   - Click "Create New Timeline" button on the home page
   - This now creates a Community Timeline by default (replacing the old hashtag timeline creation)

2. **Creation Form Fields**:
   - **Name**: 
     - Displayed as `i-{name}` in Lobster font
     - Validated for uniqueness and appropriate content
   - **Description**:
     - Brief summary of the community's purpose
     - Optional but encouraged
   - **Visibility Toggle**:
     - **Public**: Anyone can view, members can contribute
     - **Private**: Requires approval to view/contribute
     - Default: Public

3. **Creation Process**:
   - User becomes the Admin of the new community
   - Community is immediately active after creation
   - Original creator cannot leave the community (must transfer ownership first)

4. **Post-Creation**:
   - User is redirected to the new community timeline
   - Welcome post is automatically created
   - Initial settings panel is shown for quick customization

### Community Associations & Post Sharing

1. **Key Differences from Hashtags**:
   - **Creation**: 
     - Hashtag Timelines: Automatically created when a new hashtag is used
     - Community Timelines: Must be manually created by users
   - **Naming**: 
     - Hashtags: `#keyword` (any text allowed)
     - Communities: `i-Name` (prefixed, requires creation)
   - **Discovery**:
     - Hashtags: Always public and discoverable
     - Communities: Can be public or private

2. **Post-Community Associations**:
   - A single post can be shared across multiple communities
   - Users can only add communities they are members of to a post
   - Community chips appear alongside hashtags in the post header
   - No automatic creation of communities (unlike hashtags)

3. **Sharing Controls**:
   - Original poster can add/remove community associations
   - Community moderators can remove their community from inappropriate posts
   - All community associations are tracked with:
     - User who made the association
     - Timestamp of association
     - Source (original post or cross-posted from another community/hashtag)

4. **Moderation Tools**:
   - **Audit Trail**: Moderators can see full sharing history:
     - Who shared the post to their community
     - When it was shared
     - Original source (if cross-posted from another community/hashtag)
   - **Moderation Actions**:
     - Remove post from community
     - Report user for abuse
     - Temporarily restrict sharing privileges

5. **Visual Treatment**:
   - Community chips use the `i-` prefix in Lobster font
   - No additional hover states or indicators beyond the standard chip behavior
   - Clean, minimal presentation matching existing design patterns

### Private Timeline Access Flow
1. **Discovery**:
   - Private timelines appear in search results
   - Basic info shown (name, member count, description)
   - Clear "Private" badge displayed

2. **Access Attempt**:
   - Non-members who visit a private timeline see a restricted access page:
     - Timeline name displayed prominently
     - Artistic "quarantine" styling (caution tape theme)
     - Message: "Sorry, this Page is Quarantined, but you can request access"
     - Blue "REQUEST ACCESS" button

3. **Request Process**:
   - Clicking "REQUEST ACCESS" sends a notification to timeline admins
   - Admins can approve/deny requests
   - User receives notification of decision
   - If approved, user gains member access

4. **Existing Members**:
   - See the full timeline content
   - Have appropriate permissions based on their role
- **Features**:
  - Custom descriptions and rules
  - Member management interface
  - Optional approval workflow for new members
  - Customizable privacy settings (public/private)
  - Future: Custom branding options

# USER JOURNEYS

## Current User Journey
1. **Timeline Discovery**
   - Users discover timelines through hashtags (#) which are automatically created
   - All timelines are public and visible to everyone
   - No concept of private or restricted access

2. **Content Interaction**
   - Any authenticated user can add events to any timeline
   - No ownership or moderation controls
   - Limited ability to organize or curate content

3. **Content Creation**
   - Users create events that are associated with hashtags
   - No dedicated spaces for specific topics or communities
   - Limited organization beyond hashtag categorization

## Proposed User Journey
1. **Timeline Discovery**
   - **Public Timelines**: Fully visible and searchable by all users
   - **Private Timelines**: Discoverable in search but require approval to view content
   - **Hashtag Collections**: Automatic collections of posts with specific hashtags (existing functionality)

2. **Content Interaction**
   - **Public Timelines**: Any user can view and (optionally) contribute
   - **Private Timelines**: Only approved members can view and contribute
   - **Membership Management**: Timeline creators can approve/remove members

3. **Content Creation**
   - Users can create dedicated spaces for specific topics/communities
   - Better organization with clear ownership and moderation
   - More control over who can contribute to specific timelines

# NAMING CONSIDERATIONS

## Current Naming
- **Public/Private**: Clear but potentially limiting
- **Timeline**: The core concept we're working with

## Alternative Naming Options
1. **Public/Private**
   - Pros: Clear, universally understood
   - Cons: Binary, might need more granularity later

2. **Community/Personal**
   - Community Timelines (public)
   - Personal Timelines (private)
   - Pros: More descriptive of use case
   - Cons: Might not cover all use cases

3. **Open/Closed**
   - Open Timelines
   - Closed Timelines
   - Pros: Simple, clear
   - Cons: Slightly technical

4. **Space/Group**
   - Public Spaces
   - Private Groups
   - Pros: More modern, flexible
   - Cons: Differentiates from current terminology

5. **Forum/Workspace**
   - Public Forums
   - Private Workspaces
   - Pros: Implies different levels of interaction
   - Cons: Might be confusing with existing forum terminology

## Recommended Naming
Based on clarity and existing patterns, we recommend:
- **Public Timelines**: Clear, straightforward
- **Private Timelines**: Direct and understandable
- **Hashtag Collections**: For the existing automatic collections

# THE PLAN

## Core Concept
- Users can create public or private timelines (similar to subreddits)
- # (hashtag) timelines will become automatic collections based on hashtag usage in posts
- Timeline visibility can be toggled between public and private, but with restrictions

## Privacy Features
- Public timelines: Visible and accessible to all users
- Private timelines: Discoverable but require approval
  - Appear in search results
  - Non-members see a "Request to Join" button
  - Members see the full timeline content
  - Timeline creator/admins receive and manage join requests
  - Users receive notification when their request is approved/denied
- When switching to private:
  - 10-day cooldown before being able to switch back to public
  - Confirmation dialog with clear warning about the cooldown period
  - Existing followers handling:
    - All current followers are temporarily grandfathered in
    - They receive a notification with a "Click to remain in this timeline" button
    - Can continue viewing content during the 24-hour window
    - After 24 hours, any followers who haven't clicked the button are automatically removed
    - This helps filter out inactive or bot accounts

# THE APPROACH

## Implementation Strategy

### Phase 1: Database & Backend Foundation (2-3 weeks)

1. **Database Schema Updates**
   - Extend `Timeline` model with `timeline_type` field (already exists with default 'hashtag')
   - Add `visibility` field ('public'/'private') to `Timeline` model
   - Create `TimelineMember` table with roles (admin, moderator, member)
   - Add `privacy_changed_at` timestamp for cooldown tracking
   - Add `created_by` relationship to track timeline ownership

2. **Core API Endpoints**
   - Update timeline creation to set `timeline_type='community'`
   - Add visibility toggle parameter to creation/update endpoints
   - Create membership management endpoints (add/remove/update roles)
   - Implement basic access control middleware

3. **Testing Infrastructure**
   - Unit tests for new models and relationships
   - API tests for new endpoints
   - Authentication and permission tests

### Phase 2: Frontend Essentials (2-3 weeks)

1. **Timeline Creation UI**
   - Update existing timeline creation form
   - Add visibility toggle (public/private)
   - Add appropriate validation and error handling
   - Update timeline display to show `i-` prefix for community timelines

2. **Timeline Display**
   - Update timeline header to show community status
   - Add visual indicators for public/private status
   - Implement basic member count display
   - Add settings gear icon for admins

3. **Basic Access Control**
   - Implement restricted access page for private timelines
   - Add "Request Access" button and flow
   - Show appropriate UI based on user's membership status

### Phase 3: Community Management (3-4 weeks)

1. **Admin Dashboard**
   - Create community settings page
   - Implement member management interface
   - Add moderator assignment functionality
   - Create basic analytics for admins

2. **Moderation Tools**
   - Implement report queue
   - Add content moderation actions
   - Create member management tools
   - Add community guidelines editor

3. **Notification System**
   - Implement basic in-app notifications
   - Add email notifications for critical actions
   - Create notification preferences

### Phase 4: Advanced Features & Polish (2-3 weeks)

1. **Post Sharing**
   - Implement cross-community post sharing
   - Add audit trail for shared posts
   - Create moderation tools for shared content

2. **Ownership Transfer**
   - Implement ownership transfer flow
   - Add confirmation and security measures
   - Create audit log for ownership changes

3. **UI/UX Polish**
   - Refine all community-related interfaces
   - Add animations and transitions
   - Implement comprehensive error handling
   - Optimize performance for large communities

## Minimum Viable Product (MVP)

**Core Features for Initial Release:**
1. ✅ Community timeline creation (public/private)
   - Implemented timeline creation dialog with type and visibility options
   - Added backend support for storing timeline type and visibility
2. ⏳ Basic member management
3. ⏳ Simple admin controls
4. ⏳ Request-to-join flow for private communities
5. ✅ Visual distinction between hashtag and community timelines
   - Added "i -" prefix for community timelines with Lobster font
   - Maintained "#" prefix for hashtag timelines
   - Implemented consistent styling across all UI components
   - Added lock icon for private community timelines

**PROGRESS UPDATE (June 5, 2025):**
- Completed the TimelineNameDisplay component for consistent prefix display
- Implemented visual indicators for timeline visibility (lock icon for private timelines)
- Updated timeline creation to support community timelines with visibility options
- Ensured consistent styling across all UI components (timeline headers, cards, menus)
- Added accessibility improvements with ARIA labels and tooltips

**NEXT STEPS:**
1. Implement member management UI for community timelines
2. Create admin controls panel for community timeline management
3. Develop request-to-join flow for private community timelines
4. Add moderation tools for community timeline admins

**Technical Requirements:**
1. Database schema updates
2. Core API endpoints
3. Updated timeline creation UI
4. Basic access control
5. Simple notification system

## Development Approach

1. **Incremental Implementation**
   - Build on existing timeline functionality
   - Reuse components where possible
   - Maintain backward compatibility

2. **Testing Strategy**
   - Unit tests for all new components
   - Integration tests for critical flows
   - User acceptance testing for UI/UX

3. **Deployment Strategy**
   - Feature flags to control rollout
   - Phased release to limit impact
   - Monitoring for performance issues

## Moderation
- Private timelines should have enhanced moderation tools
- Ability to ban/remove users
- Consider adding moderation features like content moderation, user reporting, etc.

## User Experience
- Clear visual indicators for timeline privacy status
- Intuitive interface for managing privacy settings
- Consider adding a "Request Access" flow for private timelines

## Technical Considerations
- Database schema updates needed for:
  - Timeline privacy status
  - User access controls
  - Privacy change history/cooldown tracking
- API endpoints for:
  - Creating timelines with privacy settings
  - Updating privacy settings
  - Managing user access
  - Enforcing cooldown periods

## Future Considerations
- Notification system for privacy-related changes
- More granular access controls (viewer/editor/admin roles)
- Analytics on how privacy settings affect engagement
- Bulk privacy settings for multiple timelines
