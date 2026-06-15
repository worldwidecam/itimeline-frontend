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

------

## Current TODOs
* redesign login page

* add/create action hover markers

* look into making this an app on apple and google play stores



---

## Completed
* Improved first 3 hashtag chips on event cards and popups by displaying podium visual indicators: 🥇, 🥈, 🥉 medal emojis instead of `#` symbols, scaled height hierarchy (30px, 28px, 26px, 24px), scaled text font-sizes, vertical center baseline alignment, and reduced standard `#` icon sizing to 12.8px (fontSize={16}) for other chips.
* Protected preview images on link event cards (fallback logos and main images) by limiting descriptions to a maximum of 2 lines using CSS line clamping, and set `flexShrink: 0` to prevent the description from squeezing the preview image.
* Made event IDs on popups clickable to copy to the clipboard with the prefix "~" automatically added (using the snackbar "ID copied!" notification).
* Prevented guest mode users from seeing the hashtag voting button (# trigger and voted tag chip) on the event popup card footers (both media and text layouts).
* Unified Event Popup & Universal Media Display (Merged VideoEventPopup, ImageEventPopup, AudioMediaPopup, and NewsEventPopup into a master EventPopup.js component, implemented CSS-based "Entire-Popup Fullscreen" state transitions, fixed aspect ratio scaling, and maintained audio/video playback continuity during mobile screen rotation).
* Link events (expanded news-type remarks to parse, embed, and inline-play TikTok, YouTube, Instagram, Twitter/X, and Bluesky video and content previews; optimized scroll lock behaviors to prevent frozen page scrolls; fixed live production YouTube thumbnails using official oEmbed API and video-id fallbacks; resolved mobile TikTok short-link redirects in EventForm and updated parsing regex to make username optional).
* Query batching optimization (resolving 503 Service Unavailable / CORS errors on events retrieval routes by reducing database query overhead from N+1 to grouped queries).
* Notifications System (Unified Activity Notifications feed, Preferences Settings, Quiet Mode, Milestones, custom Bubble Plop Sound, and avatar overlay country badges).
* Timeline header titles and username cards dynamic scale-shrinking for mobile views.
* Enhanced Theory Board zooming to be fully adaptive (dynamically recalculating minimum zoom to frame the dashed perimeter regardless of board size) and smooth (implementing percentage-based multiplicative scaling at 15% intervals); decoupled zoom from recentering, mapped database-safe zoom level integers [25, 300] on the frontend, and added scaling to note box cards to prevent overlap on zoom out.


---

---

## Postponed

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be removed or merged.

* NSFW filter logic. Tie it to our existing elements like content blurring and user's birthdate input.
