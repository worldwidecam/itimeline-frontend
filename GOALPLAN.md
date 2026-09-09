# GOALPLAN — iTimeline

## Main Goal
maintain safety of PRODUCTION while making improvements from MAIN branch. 

---

## RULES
1. maintain safety of PRODUCTION while making improvements from MAIN branch. 
2. analyze the elements before making changes. if the element exists elsewhere, consolidate its code into a single component/file.Therefore, consider your fix may need to ask me if it should involve a more wide response. for exmaple, if i need a fix on a timeline page and its timeline title, consider that your fix is not just one specific timeline type but all timeline types.
3. work on one objective at a time.
4. after analyzing workspace and before beginning making changes, have at least one ideation response with me, so i can give my thoughts on the approach. then, good to proceed.
5. once an objective is completed, add it to the completed section.
6. ALWAYS code with keeping production-safe code practices in mind. for example, if a table ever needs to be expanded, never just add it to development without adding it to the LIVE tables.
7. when starting on the next TODO, first respond asking me to explain the problem in my own words.
8. DO NOT move on to the next todo objective without receiving a confirmation that the previous todo objective has been completed.
9. update and remove ANY implementation plan aspects that are confirmed finished. that way we do not continue believing we must make certain changes that we've finished long ago.

------

## Current TODOs

* IMPORTANT
 - ~~need to safe migrate new tables to staging~~ (Completed — `0010` and `0011` applied to remote `itimeline-staging`)
 - ~~need to safe migrate new tables to production once safe testing is confirmed on staging~~ (Completed — `0010` and `0011` applied to remote `itimeline-prod`)

---

### 🔴 Focus Group — Bugs (High Priority)

* ~~**[FG-D] Personal timeline URL crashes to backend terminal screen when no cover image is set.**~~ (Completed — `share.ts` private timeline check now redirects to `FRONTEND_URL/timeline-v3/:id` instead of returning raw `c.text()`, so `PersonalTimelineLock` handles it gracefully on the frontend)

* ~~**[FG-M] "Create Event" button does not detect stale session/data.**~~ (Completed — root cause was a `!title` vs `!title.trim()` inconsistency in `EventDialog.js` that silently blocked submission for whitespace-only titles with no feedback. Also added URL protocol normalization (`https://` prepend) to both `EventDialog.js` and `NewsEventCreator.js` to prevent silent backend 422 rejections. Diagnostic logging added to `NewsEventCreator.handleSubmit` for future tracing.)

* ~~**[FG-E] Editing a link-type event post after creation is broken or unreliable.**~~ (Completed — Confirmed solved)

* ~~**[FG-C] Failed login shows a confusing/technical error message.**~~ (Completed — Identified "infringes corpus" as the HIBP "Password appears in breach corpus" rejection. Removed the hard-block wall on registration and password changes; converted into an advisory weak_password flag that only displays a gentle one-time snackbar on HomePage, preventing phantom-account lockout traps.)

* ~~**[FG-B] Rate limiting triggers far too easily.**~~ (Completed — Raised loginIp from 10 to 30/min, registerHourIp from 3 to 25/hr, registerDayIp from 10 to 60/day, increased account lockout threshold to 20 attempts, and decreased lockout duration from 15m to 5m.)

* **[FG-F] Swipe-down pull-to-refresh fires on the login page on mobile.**
  - This gesture shouldn't be active on the login/auth pages where it causes an unintended full reload.

---

### 🟡 Focus Group — UX Friction (Medium Priority)

* ~~**[FG-I] Register card is missing the password show/hide eye toggle.**~~ (Completed — Added Visibility and VisibilityOff icon toggles to both Password and Confirm Password inputs on Register card)

* **[FG-J] Profile usernames and avatars should be clickable hyperlinks.**
  - In profile notifications and on profile pages, usernames and profile pictures are plain — they should link to that user's profile page.

* **[FG-G] "Add Friend" vs "Follow/Unfollow" wording is inconsistent.**
  - Some parts of the UI say "Add Friend", others say "Follow/Unfollow". Needs to be unified to one clear term and behavior across all surfaces.

* **[FG-Q] Home page right-hub tab header titles need to be larger.**
  - The tab names (Popular, Home, Search, etc.) feel too small. Users want them to be more prominent and readable at a glance.

* **[FG-O] On the timeline page, the event list below the fold isn't discoverable.**
  - At first glance users think the timeline ruler/tool is all there is and don't realize there's a scrollable event list below it. Needs a visual cue or layout adjustment.

---

### 🟢 Focus Group — Design / Identity (Requires Discussion)

* **[FG-H/N/P] Timeline types are not visually or conceptually distinct enough.** *(Three overlapping notes — treat as one unified objective)*
  - Users couldn't tell personal, community, and hashtag timelines apart.
  - The naming of personal timelines (`#USERNAME` vs `MY-USERNAME`) is confusing — needs clearer labels like "My Public Posts" / "My Private Posts". *You have thoughts on this.*
  - Visual suggestion from focus group: add the timeline's banner image at low opacity behind the timeline tool area. *You noted we could go more drastic.*

---

### 🔵 Focus Group — Feature Requests (Lower Priority)

* **[FG-A] Audit file upload path for zip-bomb protection.**
  - When users upload files, do we guard against maliciously compressed archives that expand to enormous sizes server-side? Needs a security review.

* **[FG-K] Add document upload support (PDF, DOCX).**
  - Current media uploader only handles image, video, and audio. Users want to be able to attach documents to events.

* **[FG-L] Timeline zooming and "follow your post" through filter levels.**
  - Two related UX ideas: (1) pinch-to-zoom or scroll-to-zoom on the timeline view, and (2) a way to keep your own post tracked/in-view as you toggle through different filter zoom levels.

---

* the published date/time on all event cards should be simpler displaying. lets make it simply state things like "Published 5 minutes ago" or "Published an hour ago" or "Published yesterday" or "Published on in 2026".

* we need to work on the fallbacks for link/news events. for instance, i posted a reddit link and the link event card showed the reddit backup pic, but its popup used our GENERIC fallback. we need to stay consistent. our dream ideal scenario would be that the website NEVER needs this farthest fallback.

* voting on a hashtag on a post should also update its related event card. i know on refresh it does update but not in real-time, like it does for the popup

* delete feature for users and timelines

* add theory board module to community timelines.

* making a private post on a personal timeline page and tagging it should NOT mean that the post made on a personal timeline is allowed to be viewed on that tagged timeline. currently, it does seem to allow it, and that is not right. for instance, i made a post on a personal timeline, therefore this post is private. but then i tagged it #dream_journal, and i went to that hashtag timeline as a Guest and i could still see the post. that should not be the case.
    - also, the post doesn't even have the personal chip tagged in its personal category, so what's going on there?

* things or worries we need to check on so we don't make these easily-made mistakes:
 - uncompressed JSON
 - illogical DB write methods
 - single dependency bottleneck
 - un-optimistic rendering
 - non statically hosted site 

* **[TODO] Create a Privacy Policy page.**
 - Required for app store submissions (Google Play & Apple App Store).
 - Must cover: what data we collect, why we collect it, how long we retain it, third parties, and user rights.
 - Needs a `/privacy-policy` route and a styled `PrivacyPolicy.js` component matching the existing `TermsOfService.js` design.
 - Should be linked in the footer, Register page, and any app store listing.

* look into making this an app on apple and google play stores.
 - ~~probably need a privacy policy.~~ (tracked above)
 - data and compliance. need to explain why we collect any data and for how long we intend to keep it.
 - IP infringement check. uspto.gov

* ~~deleting a timeline ability.~~ (Completed — safe re-homing for shared posts, R2 media purge for isolated posts, slug freeing, DeletedTimelineRedirect, and Admin Panel Danger Zone UI)

* ~~deleting an account~~ (Completed — soft-scrub, R2 media cleanup, social graph removal, 3-step confirmation dialog with backup key requirement, and DeletedUserRedirect)

* voting on a hashtag on a post doesn't seem to update that event card , at least temporarily.

* block list option within friends list on home page.

* sliding down a fullscreen media opened from a popup should slide down the media back to normal popup screen. it currently does not accurately.i somewhat fixed this on my own but still good to check. but what remains for sure is that if the inner description container on a popup isn't scrolled to its top already, then it doesn't let the popup itself be dragged downward to close.

* create push notification system.

* the B Pointer arrow+element is not properly refreshing upon timeline change. i am on one timeline page > i click an event > the pointer B element appears below it > i navigate to another timeline page > it loads > the pointer B element remains where it was from the previous page.

* expand on theory board module. offer possible stencils. like a simple timeline stencil, or perhaps a lineage tree stencil

* i'm thinking we should have the navFAB absorb the timeline status message system, so that we do not need to have the timeline status message system displayed in the top bar any longer.
---

## Awaiting Confirmation

---

## Completed

* **[FG-M follow-up] Event form submit buttons now show loading state site-wide**: Added `isSubmitting` state + spinner + double-submit guard to `MediaEventCreator.js` and `RemarkEventCreator.js`. Wired `eventSubmitLoading` state in `TimelineV3.js` through `handleEventSubmit` (try/finally) and passed it as `submitLoading` / `submitDisabled` to `<EventDialog>`. `NewsEventCreator` and `AdminPanel` edit path were already correct. Also deleted confirmed dead code: `EventForm.js`, `TimelineV3.js.bak`, `EventMarker.js.bak`, `EventPopup.js.new`. (Complete)

* **[FG-C] Breach Corpus & Registration Wall Removed**: Replaced the hard-blocking "breach corpus" rejection with an advisory `weak_password` flag. Registered users can now proceed without getting trapped, and weak passwords trigger only a gentle, one-time home page snackbar that self-deletes from session storage. (Complete)

* **[FG-B] Rate Limiting Relaxed**: Increased login rate limits from 10 to 30/min, hourly registration from 3 to 25/hr, daily registration from 10 to 60/day. Raised account lockout threshold from 10 to 20 attempts, and reduced lockout cooldown duration from 15m to 5m. (Complete)

* **[FG-I] Register Card Password Visibility**: Added show/hide eye toggles to both the Password and Confirm Password input fields on the Register card. (Complete)

* **Comment Drawer Enter-to-Submit**: Pressing `Enter` in the comment drawer now submits the comment immediately; `Shift+Enter` inserts a new line. (Complete)

* Safely migrated new database tables/columns (`0010` and `0011` for soft deletion of users and timelines) to the live production Cloudflare D1 database (`itimeline-prod`) (Complete)

* NSFW filters site-wide blurr implementation

* Fixed timeline page mobile header title truncation by accounting for visual prefix length (My- / i - / #) when computing dynamic font scaling and mobile vertical row-stacking triggers (Complete)

* Optimize initial load time of the website on production (redundancy checks, batch APIs, cached loading screens) (Complete)

* Fixed YouTube/TikTok link-type events preview generation on the backend by introducing a pre-fetch oEmbed intercept and a Google sorry/captcha redirect recovery parser (Complete)

* Returning home page bug — Popular, Home, and Favorite tabs were going blank after navigating away. Fixed by keeping last-loaded data in memory during silent background refreshes instead of wiping state (Complete)

* Renamed all timeline description input labels to "Info & Rules" across frontend (create dialog, personal settings panel, community admin panel) to differentiate from event description fields (Complete)

* Added clickable timeline title on timeline page that smoothly folds down a collapsible "Info & Rules" panel showing the timeline description; falls back to a type-specific message if no description is set; clicking anywhere outside collapses it (Complete)

* Increased padding/height of the timeline page header container so the title no longer clips near the top edge (Complete)

* search tab on home page should have something when initial blank — implemented fun screensaver bubbles of trending tags on the blank search state (Complete)

* on profile page > theory board, synchronized notes scaling with grid zoom (using linear scaling and a 0.35 floor limit) so they grow/shrink smoothly (Complete)

* Restructured and refined the layout of Timeline Cards (moving type chip to the absolute bottom-left of the left column, placing follower count chip directly next to the title, enabling description text, and wrapping descriptions in decorative quotation marks) (Complete)

* Refined Left Hub Load More button style and icon to be a circular button with a 180-degree rotated NorthIcon (Complete)

* Optimized video feed playback in MediaCard.js utilizing IntersectionObserver with a 400px rootMargin, stopping off-screen background videos from playing (Complete)

* Designed, implemented, and refined Action Hover Markers on the timeline ruler (with double-sized emoji pins, glowing stems, baseline alignment, and title bubble popups on hover) and unified duplicate community action layouts under a reusable, robust, responsive `<ActionCard />` component (Complete)

* fix loading screen text — messages now play through once (no looping) at 2 seconds each. (Complete)

* STAGE 3: Created the STAGING environment (provisioned staging D1/R2/KV on Cloudflare, configured wrangler.toml, and set up the staging branch custom domain/env variables on Cloudflare Pages) (Complete)

* is it possible to make shared remarks URL previews its word bubble container with title in it, also with the user image that said it. i'm trying to make remark events compete with twitter. (Complete)

* STAGE 4: Implemented outbound email account recovery using Cloudflare's native email service and a dual-choice recovery card UI (Complete)

* STAGE 2: Added a password visibility "eye" toggle icon to the password input field on the Login card (Complete)

* STAGE 1: Attempted manual password reset and lockout clearance for father-in-law, but login still failed (Marked as Failed/Postponed; moving to Stage 2/4 for robust fixes)

* upgraded Theory Board emojis containing single emojis to render as polished stickers with a solid contour silhouette backing (stacked text-shadow outline) and drop-shadow, removing visible background container cards (Complete)

* resolved empty Popular and Home tabs when returning to homepage by loading cached data immediately and silently revalidating data in the background (Complete)

* designed and built a global popular posts API on the backend and integrated it into the frontend Popular tab, reducing network requests from 20+ down to 1 single call (Complete)

* optimized the Home feed query path with a bulk API and integrated it into the frontend Home tab, reducing network requests from 20+ down to 1 single call (Complete)

* perfected the loading screen's celebration confetti animation timing and resolved the hook timer cleanup race condition (Complete)

* when i am on home page, coordinated the loading screen to wait for the popular event posts list to finish loading before dismissing (Complete)

* when navigating to a timeline page (e.g. from hashtag chips), added 2 retry attempts on transient failures; if retries still fail, render the ErrorPage component instead of silently displaying a fake/blank "Timeline <id>" page (Complete)

* on login/register/recover pages, cards can now be closed/flipped back face-down by clicking their empty background/padding space (Complete)

* app loading screen with themed splash, party popper celebration emoji, falling confetti physics; mobile flicker fix; silent background refresh on window focus; covers stale-auth blocking posts, empty home page on arrival, and initial load lag (Complete)

* on timeline pages > the timeline tool > the event counter > the event dot for the carousel, we can remove its little preview cards there that are for the event. (Complete)

* event cards NEED to vertical grow if that is what it takes to fit entire titles. we're trying upgrade twitter posts, not BE WORSE than twitter posts. (Complete)

* timeline page mobile layout improvements: expanded timeline visualizer edge-to-edge (no buffer space), centered cover image banner container (width constrained to fit viewport), shrunk view filter buttons to fit without stacking or wrapping, and implemented a responsive coordinate scaling factor to keep user-defined cover framing identical on mobile viewports (Complete)

> Historical completion notes have been migrated to `README.md` under the **"Completed Context Migrated from GOALPLAN"** section for durable reference. Only the most recent completions are held here briefly before migration.

---

---

## Postponed

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be removed or merged.

* NSFW filter logic. Tie it to our existing elements like content blurring and user's birthdate input.

