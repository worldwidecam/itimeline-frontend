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



* "i should be able to open the app, or site, and be able to post something, but i can't until i refresh". right now, when i open the site or navigate to the home page from elsewhere, the popular tab is empty and takes too long to populate.even when i press the navFAB button on home page, it takes a couple seconds to register and open. all things are slow.
-  we gotta do something about these never ending 400 and 403 errors, its slowing everything.maybe production should ignore all these and we just keep it to MAIN branch and STAGING branch.

* on login/register/recover pages, we need to add clicking-to-close-the-card the the empty unused space on the cards as well. i had a focus group test the app and most didn't actually tap out of the card to close it, they tried tapping the lower empty half of the cards to close them.

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

* app loading screen with themed splash, party popper celebration emoji, falling confetti physics, and window focus/navbar soft refreshes (Complete)

* on timeline pages > the timeline tool > the event counter > the event dot for the carousel, we can remove its little preview cards there that are for the event. (Complete)

* event cards NEED to vertical grow if that is what it takes to fit entire titles. we're trying upgrade twitter posts, not BE WORSE than twitter posts. (Complete)

> Historical completion notes have been migrated to `README.md` under the **"Completed Context Migrated from GOALPLAN"** section for durable reference. Only the most recent completions are held here briefly before migration.

---

---

## Postponed

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be removed or merged.

* NSFW filter logic. Tie it to our existing elements like content blurring and user's birthdate input.

