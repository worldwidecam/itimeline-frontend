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

* voting on a post: someone voted a hashtag on a post and it took them to the timeline page? apparently?

* frontend labeling on remarks should be different regarding post voting. instead of "good moment" or "bad moment" , it would make more sense to be "Good Take" or "Bad Take".

* lets lower the guest login card countdown to 3 seconds

* deleting a post is currently not working at all.

* Remark event Popups are not fitting on the screen in mobile view.

* "i should be able to open the app, or site, and be able to post something, but i can't until i refresh".

* create push notification system.

* add/create action hover markers

* look into making this an app on apple and google play stores

* app loading screen , so when a user taps the app , it opens up fast to this waiting area loading screen. examine CASHAPP for example

---

## Completed
* Implemented smooth, seamless transitions between `/login`, `/register`, and `/recover` routes to maintain the single "hand of cards" visual illusion: initial page visits start with all cards face-down in their arched deck with the target active card pre-hovered (`scale(0.88)` and raised Y-position), then automatically flip the active card up after a snappy `50ms` delay; card-to-card navigation clicks first fold the active card back face-down, wait a snappy `220ms` animation duration, and then perform the React Router redirect. Resolved text blur on hover for PC Chrome viewports by standardizing the active card's PC scale factor to exactly `1.0` (eliminating subpixel scaling distortion) and forcing hardware-composited antialiasing (`-webkit-font-smoothing: antialiased !important`) across all input fields, buttons, labels, and textareas, and resolved `/register` component mount rendering lag by delaying Cloudflare Turnstile script loading by `600ms` until the card has fully flipped open. Perfected the mobile view experience by wrapping cards in `React.forwardRef` and introducing scroll-centering helpers: the active card snaps directly to the screen center on mount and smoothly scrolls/centers into focus on swipe, click, or cross-page transitions. Adjusted the active card `zIndex` from `5` to `20` in `TradingCard.js` to stack active cards on top of the scroll banner when viewports compress on mobile address bar events, and expanded the vertical height headroom of the mobile horizontal scrolling deck by shifting its boundaries upward via a negative top margin (`mt: { xs: '-36px', md: 0 }`) over the title banner, resolving top card clipping issues on vertical screen compression without resizing, morphing, or changing the perfect dimensions of the cards.
* Redesigned `/login`, `/register`, and `/recover` pages into a horizontal, swipeable "trading card table" layout. Implemented curved hand fanning tilts (resting angles at `-4°`, `-1.5°`, `1.5°`, `4°`), raised middle card arc elevations (`-12px` on PC), dynamic scroll-based physics tilts on mobile (centering straight, scrolling outward), active scale growth transitions (shrinking inactive cards by 20% to `0.80`, growing active to `1.05`/`1.0`), interactive click-to-close form headers (by clicking title, icon, or empty space), GPU text-antialiasing (`WebkitFontSmoothing: 'antialiased'`) with hardware composite translation blocks, and background card slide-down focus-dimming. Kept active card transformations at `translateY(0px)` on mobile screens and replaced transparent backdrop-filters with transparent form containers inheriting clean solid card backgrounds to completely prevent top clipping and desktop browser text blur. Built pure CSS 3D flip card animations, collapsible scrollable input forms with locked submit footers, a page background click-out detector, and a themed guest mode (Goblin Mode) doorway countdown with auto-login.
* Symmetrized the baseline layout of all three authentication pages (`/login`, `/register`, and `/recover`) to identical 4-option card decks: **Login First** (Blue, 👤), **Join Timeline** (Amber/Gold, 📜), **Forgot Keys** (Purple/Coral, 🚪🔑 with a door + key overlapping emoji avatar), and **Goblin Mode** (Green, guest login), ensuring they render in the same order with the active route's form container displayed directly below it. Cleaned up legacy inline links/buttons from within the forms (the "Forgot Password?" link on login, "Already have an account? Login here" on register, and "Back to Login" on recovery) to create a clean, consistent modular gateway interface.
* Redesigned Login page with a fixed medieval parchment scroll banner header, refined soft rounded ribbons, and high contrast readable typography. Unified the theme engine canvas gradients globally across `/login`, `/register`, `/recover`, `LandingPage`, and `HomePage` to feature a seamless transition with premium glowing purple/sunset background design blobs; aligned the `/recover` page flow and route wrapper to display the global navbar and fixed the background fade-in animation to eliminate transition blinking; synchronized the navbar behavior on the recovery page to enforce the unauthenticated layout (Login/Register buttons only) and route brand logo clicks back to the landing page `/`.
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
