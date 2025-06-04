# THE GOAL
Implement public/private timelines that users can create, separate from the existing # (hashtag) timelines.

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

## Phase 1: Core Infrastructure
1. Database Schema Updates
   - Add `visibility` enum ('public', 'private') to Timeline model
   - Create `TimelineAccess` join table for managing memberships
   - Add `privacy_changed_at` timestamp to enforce cooldown

2. Backend API Endpoints
   - Update timeline creation to include visibility setting
   - Add endpoints for managing timeline access
   - Implement privacy change validation (cooldown enforcement)

## Phase 2: Frontend Implementation
1. Timeline Creation/Editing
   - Add visibility toggle in timeline creation form
   - Implement privacy settings panel for timeline owners
   - Add visual indicators for timeline privacy status

2. Access Management
   - Build UI for managing timeline members
   - Create request approval flow
   - Implement notification system for access requests/approvals

## Phase 3: Transition Handling
1. Public to Private Flow
   - Implement confirmation dialog with clear warnings
   - Set up temporary access for existing followers
   - Create and send opt-in notifications
   - Schedule automatic removal of non-responding users

## Phase 4: Testing & Polish
1. Test all privacy transitions
2. Optimize database queries for access checks
3. Add loading states and error handling
4. Implement analytics to track privacy-related metrics

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
