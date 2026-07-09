# GOALPLAN — iTimeline

## Main Goal
maintain safety of PRODUCTION while making improvements from MAIN branch. 

---

## RULES
1. maintain safety of PRODUCTION while making improvements from MAIN branch. 
2. analyze the elements before making changes. if the element exists elsewhere, consolidate its code into a single component/file.
3. work on one objective at a time.
4. after analyzing workspace and before beginning making changes, have at least one ideation response with me, so i can give my thoughts on the approach. then, good to proceed.
5. once an objective is completed, add it to the completed section.
6. ALWAYS code with keeping production-safe code practices in mind. for example, if a table ever needs to be expanded, never just add it to development without adding it to the LIVE tables.
7. when starting on the next TODO, first respond asking me to explain the problem in my own words.
8. DO NOT move on to the next todo objective without receiving a confirmation that the previous todo objective has been completed.
9. update and remove ANY implementation plan aspects that are confirmed finished. that way we do not continue believing we must make certain changes that we've finished long ago.

------

## Current TODOs

* on the LIVE website (production branch) it takes a REALLY long time to initially load the website. and secondly, 'my creations' tab > timelines sub-tab specifically takes a REALLY long time to load as well.

* NSFW filters site-wide blurr implementation

* add theory board module to community timelines.

* look into making this an app on apple and google play stores.
 - probably need a privacy policy.
 - data and compliance.need to explain why to any data we collect and for how long we intend to keep it.
 - IP infringement check. uspto.gov

* deleting a timeline ability.

* deleting an account

* voting on a hashtag on a post doesn't seem to update that event card , at least temporarily.

* block list option within friends list on home page.

* sliding down a fullscreen media opened from a popup should slide down the media back to normal popup screen. it currently does not accurately.

* create push notification system.

* the B Pointer arrow+element is not properly refreshing upon timeline change. i am on one timeline page > i click an event > the pointer B element appears below it > i navigate to another timeline page > it loads > the pointer B element remains where it was from the previous page.

* expand on theory board module. offer possible stencils. like a simple timeline stencil, or perhaps a lineage tree stencil
---

## Awaiting Confirmation

* Returning home page bug — Popular, Home, and Favorite tabs were going blank after navigating away. Fixed by keeping last-loaded data in memory during silent background refreshes instead of wiping state. Awaiting confirmation on live production.

---

## Completed

* search tab on home page should have something when initial blank — implemented fun screensaver bubbles of trending tags on the blank search state (Complete)

* on profile page > theory board, increased the notes size upon zooming in so it grows large enough to match zoom-in scale (Complete)

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

