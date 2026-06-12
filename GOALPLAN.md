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

------

## Current TODOs
* add/create action hover markers

* look into making this an app on apple and google play stores



---

## Completed
* Unified Event Popup & Universal Media Display (Merged VideoEventPopup, ImageEventPopup, AudioMediaPopup, and NewsEventPopup into a master EventPopup.js component, implemented CSS-based "Entire-Popup Fullscreen" state transitions, fixed aspect ratio scaling, and maintained audio/video playback continuity during mobile screen rotation).
* Link events (expanded news-type remarks to parse, embed, and inline-play TikTok, YouTube, Instagram, Twitter/X, and Bluesky video and content previews; optimized scroll lock behaviors to prevent frozen page scrolls).
* Query batching optimization (resolving 503 Service Unavailable / CORS errors on events retrieval routes by reducing database query overhead from N+1 to grouped queries).
* Notifications System (Unified Activity Notifications feed, Preferences Settings, Quiet Mode, Milestones, custom Bubble Plop Sound, and avatar overlay country badges).
* Timeline header titles and username cards dynamic scale-shrinking for mobile views.

---

---

## Postponed

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be removed or merged.

* NSFW filter logic. Tie it to our existing elements like content blurring and user's birthdate input.
