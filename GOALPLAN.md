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

* landing page demo timeline should use actual posts, with nuance  of course. the posts must be publically allowed.

* 

* create push notification system.

* add/create action hover markers

* search tab on home page should have something when initial blank. maybe like fun screensaver bubbles of trending tags

* look into making this an app on apple and google play stores.
 - probably need a privacy policy.
 - data and compliance.need to explain why to any data we collect and for how long we intend to keep it.
 - IP infringement check. uspto.gov

* deleting a timeline ability.

* deleting an account

* block list option within friends list on home page.

* sliding down a fullscreen media opened from a popup should slide down the media back to normal popup screen. it currently does not accurately.

---

## Completed

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

