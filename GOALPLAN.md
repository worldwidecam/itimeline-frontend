# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] Update description boxes in posts to include new chip logic

## Scope / Success Criteria
- [x] Delete is allowed for the original post creator and SiteOwner (SiteOwner = user ID 1 / username + email: Brahdyssey@gmail.com).
- [ ] Prepare for a future SiteAdmin role (second only to SiteOwner) to share delete permissions when admin page is built.
- [ ] Delete button is visible only to authorized users, and only inside EventPopups (not EventList cards).
- [ ] Backend enforces creator/SiteOwner permissions regardless of frontend visibility.
- [ ] Deleting a media post removes the **Cloudinary asset** (not just the URL) and the event record.
- [ ] User gets clear confirm + success/failure feedback; event disappears from timeline/UI.

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [ ] 

## Pending TODOs ( larger tasks that are toward completing main goal )
- [ ] Update button on posts (link other posts to a post)
- [ ] Site admin page
- [ ] Update/improve remark cards look
- [ ] NSFW filter
- [ ] Post-creation edit event option (ideation needed)
- [ ] Profile page implementation (existing page needs full build-out)
- [ ] Home page implementation (exists but not functional yet)

## Completed
- [X] for IMMEDIATE focus next time. i cannot click event markers on timelines. currently the drag mouse icon is overriding all clicking interactions.
- [x] Delete feature and logic (posts/events, creator + admin access)

- [x] Timeline motion dissipate: treat motion as zero-event state, pause event rendering during movement, and resume after settle delay.
- [x] Smoother timeline movement achieved via motion dissipate + delayed recompute.

## Notes / Decisions
- Delete feature work paused while resolving errors in smooth timeline movement; revisit after stability fixes.

## System Map (List of Interactions)
- 

