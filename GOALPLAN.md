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

* hashtag voting system
- for this system to work, and for us to begin, we must first look into any possible problems regarding adding tags to a post. just a safety check is fine. 
- to be made IN TANDEM with comment section. for hashtag voting will be at the per post level, much like comment section will be.
- it will be a vote option for the user towards the post its on. displayed in comment chat box like metaData, with the hashtag chip visualize though (style guideline)
- example, " USERNAME voted this Post as #GAY" (#GAY will be the colored chip)

* comment section
- comment section needs to be a section in event Popup. might possibly need to consider its location type -by- type , but will probably want to be near the top. 
- its
- in comments section, user can either input a comment, or cast their 1 hashtag vote towards the post.
- on comments posted, there will be an up-arrow, a down-arrow, and a reply button.

* expand news-type remarks. change their frontend naming nomenclature to LINKS (OR SOMETHING). we can keep code nomenclature relevantly same. but we need to update news-type remarks to handle more links than just news. we need it to play tiktok links, youtube links, instagram reels, etc. basically it needs to also be media handler, but of outside sourse media.
- so we'll need to reflect on how much would need to change
- like their event card, hover card, popup, preview display, 
- this change would most likely set a new standard, that we would then consider updating media-type events to.
- think of discord for example. i can just drop a link, and it'll embed the media, give me a preview of the media, and play it if it is a video.  

* add/create action hover markers


---

## In Progress

### Postponed ToDos

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be 

* NSFW filter logic. tie it to our existing elements like content blurring and user's birthdate input.

#### COMPLETE 
(move these to README.md, along with any context to add on the feature's behalf. then delete them from this category.)

- [x] revamp the landing page interactive preview timeline with a cohesive True Crime cold case narrative tracked by a sleuth podcaster (added 5 realistic, media-rich themed events per view mode using actual Unsplash image URLs for the media cards, fully supported by the landing page event marker tooltip rendering)
- [x] fix floating action buttons (navFAB) z-index layer overlap conflict in mobile view on timeline pages (floating buttons wrapper z-index is set to a static 1250 so it sits higher than timeline markers at 1200, but lower than popups at 1300, rendering behind dialog overlays cleanly without conditional checks)
- [x] implement secure, self-contained One-Time Backup Password Account Recovery system. Includes backend setting/recovery API routes, timing attack protection, one-time self-destruct mechanism, frontend Settings component with WebkitTextSecurity anti-autofill, fully featured recovery page (/recover) with field matching and red shake-on-error validation, session rehydration auto-login, and settings nudge alerts.
- [x] implement production-safe silent auto-reload safety net inside index.html to eliminate white screens caused by stale browser caches / Vite chunk hash MIME mismatches, guarded against infinite reload loops
- [x] gotta get pinch-to-zoom in/out working for theory board module (implemented smooth multitouch pinch-to-zoom on touchscreen with stable focal midpoint zoom and seamless single-finger pan recovery)
- [x] fix fullscreen dialog blocking issue inside the Theory Board module (standardized the 'Isolated Pamphlet' pattern by portaling MUI Dialogs into document.fullscreenElement when active so event popups render beautifully in front of the board)
- [x] consolidate landing page user count chip and integrate into Site Control page (abstracted the fire-themed user count chip into a reusable UserCountChip component and integrated it next to the User List refresh button on the Site Control page)
- [x] halt background timeline scrolling and swiping when Event Popups are open (standardised mouse/touch/wheel event propagation blocking at the Dialog wrapper level across all 5 specialised event popups to keep the timeline canvas completely static)
- [x] fix profile settings texts module toggle default active visual fallback and rename empty modules placeholder card title on Profile page (toggles now default to active when unsaved and respect inactive saved state; empty placeholder title is now "Profile Modules" and only mounts on the owner's profile page; implemented robust legacy key grouping and deduplication to ensure old 'profile-module-texts-main' keys do not conflict with new switches)
- [x] need to fix save changes on profile settings page (resolved multi-field visual state override by fetching the freshest user profile from /api/v1/users/me after all sequential updates are saved, synchronizing the React context, localStorage, and component states seamlessly)
- [x] in hamburger menu, add more rows to 'last visited timeline' section (implemented a robust, backwards-compatible history list that tracks and cycles through up to 5 recently visited timelines, displaying the correct styling, community/personal prefixes, text truncation, deduplication, and active timeline exclusion)
- [x] the inactive-tab containers on home page need a checkup (conducted code analysis and verified conditional mounting is 100% layout-safe and spill-proof)
- [x] does event spotlight slide know NOT to show events from published on past days (implemented local date parameter, strict fallback, and new 'random' selection mode)
- [x] personal timeline access panel settings has a section to edit their description (verified as already fully functional in PersonalAccessPanel)
- [x] standardize the portrait trading card feature across the app (coordinate positioning hydration & production Hono backend migration)
- [x] timeline page > event marker > vote dot (or basically the entire selected event > have all selected be higher on z index than the hover marker.
- [x] profile share page image needs portrait updating
- [x] the landscape preview positioning on the y axis is limited for no reason
- [x] home page > home tab > sub tab filter container box is unreasonably long.
- [x] event Cards seem to be able to visualize too many hash tag chips. this could possibly break its layout.
 lets limit its hashtag chip visualiztion to the first three,
lets make their chip color standard for the first 3. representing medals, their coloring will be Gold (first), Silver (second), Bronze (third).
