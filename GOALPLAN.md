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

## Current Objective


* expand news-type remarks. change their frontend naming nomenclature to LINKS (OR SOMETHING). we can keep code nomenclature relevantly same. but we need to update news-type remarks to handle more links than just news. we need it to play tiktok links, youtube links, instagram reels, etc. basically it needs to also be media handler, but of outside sourse media.
- so we'll need to reflect on how much would need to change
- like their event card, hover card, popup, preview display, 
- this change would most likely set a new standard, that we would then consider updating media-type events to.
- think of discord for example. i can just drop a link, and it'll embed the media, give me a preview of the media, and play it if it is a video.  

* add/create action hover markers


---

---

## Postponed

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be removed or merged.

* NSFW filter logic. Tie it to our existing elements like content blurring and user's birthdate input.
