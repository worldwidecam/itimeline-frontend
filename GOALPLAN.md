# GOALPLAN — Template

## Main Goal
- [ ] FULL WEBSITE IMPLEMENTATION

## Current Focus
- [ ] Site admin page (timeline report tickets implementation)

## Scope / Success Criteria
- Site Control page (global admin) distinct from Community Admin
- Access: SiteOwner + SiteAdmin role; redirect page for unauthorized users using existing redirect style guidelines
- Redirect copy: minimal description + single back button (no detailed access explanation)
- Two tabs: Global Reports (single queue with type filter) + Site Settings (SiteOwner only)
- Global Reports: posts/users/timelines in one queue; ticket styling differentiates types; update post-type styling to reflect media subtypes
- Timeline report cards use green (not violet) for type color
- Global Reports actions: mirror Community Admin report flow; adjust button labels as needed but keep structure similar
- Site Settings: manage landing page rotating texts + toolbar scrolling LED banner message (text + timing)
- Navigation: add “Site Control” entry in top toolbar hamburger menu under profile settings (authorized only)

## Active sub-TODOs ( smaller tasks that are toward completing current focus )
- [x] Ideation phase
- [x] site control page implementation
- [x] Global Reports: finish post tickets (remove Escalate button, add Resolve-Edit + Resolve-Delete)
- [x] Global Reports: build user tickets (data shape, UI, actions)
- [x] Global Reports: build timeline tickets (data shape, UI, actions)
- [x] Align lower-tier Community Admin report ticket styling with Site Control baseline
- [x] Timeline Ban Enforcement: banned timelines must be hidden from homepage timeline search, blocked from direct timeline access, and prevented from showing timeline chips on posts
- [x] Timeline Ban Impact Rules: define + enforce expected behavior for existing posts that originated from a now-banned timeline (visibility + timeline association handling)
- [x] Issue Warning Simplification: remove custom warning date input; keep duration as 3 days / 7 days / 10 days / INDEF
- [x] Issue Warning Scope Simplification: remove "mask targeted timeline content immediately" toggle and make scope selection itself control enforcement
- [x] General Warning Hardening: verify and fix general-warning journey end-to-end before expanding remaining warning options

## Pending TODOs ( larger tasks that are toward completing main goal )
- [ ] Update button on posts (link other posts to a post)
- [ ] Update/improve remark cards look
- [ ] NSFW filter
- [ ] Profile page implementation (existing page needs full build-out)
- [ ] Home page implementation (exists but not functional yet)
- [ ] # hashtag chip voting system
- [ ] Update Profile Settings, Members Page, and Admin Page to match Site Control settings styling standard
- [ ] make a home page submission box
- [ ] reporting action cards
- [ ] sharing link system
- [ ] reorganizing community admin page action card settings under INFO CARDS umbrella
- [ ] odds and ends. things like user count on landing page, community timelines getting an image background option.
- [ ] go back and fully implement action cards
- [ ] update the members page and admin page buttons to FAB

## Completed
- [x] Site Control + Community Admin report card baseline styling standardized (header order, grouped footer metadata, resolved verdict panel, type-accent borders)
- [x] Post ticket CTA refinement: View Event moved into Post Report Target container with resolved-delete exception preserved
- [X] for IMMEDIATE focus next time. i cannot click event markers on timelines. currently the drag mouse icon is overriding all clicking interactions.
- [x] Delete feature and logic (posts/events, creator + admin access)

- [x] Post-creation edit event option

- [x] Timeline motion dissipate: treat motion as zero-event state, pause event rendering during movement, and resume after settle delay.
- [x] Smoother timeline movement achieved via motion dissipate + delayed recompute.

## Notes / Decisions
- delete feature needs to be revisited once admin page is up
- edit feature needs to be revisted once admin page is up
- "delete post" button in community timeline > admin page > manage posts, needs to be revamped and changed to something regarding passing it higher to admin
- Site Control = higher tier: should retain all lower-tier actions, plus resolve-by-edit + resolve-by-delete actions (no Escalate button in Site Control).
- Escalation metadata already in reports: escalation_type, escalation_summary, escalated_by, escalated_at; timeline_id can map to community name; site admin pickup tracked via assigned_to when accepted for review.

## System Map (List of Interactions)
- 

