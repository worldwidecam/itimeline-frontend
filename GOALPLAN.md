# GOALPLAN — iTimeline

## Main Goal
maintain safety of PRODUCTION while making improvements from MAIN branch. 

---

## Current Objective

* need a backup way for users to remember their password

* need to improve the authentication token. right now, when i visit the site from my phone, it goes to a white screen for a too-long time when on stale data (24hrs later) before reauthenticating me. i don't have this trouble at all when i visit reddit. how do they do it? maybe they just set that one session's IP to not need reauthenticating, or auto trigger refresh?


* hashtag voting system
- for this system to work, and for us to begin, we must first look into any possible problems regarding adding tags to a post. just a safety check is fine. 
- to be made IN TANDEM with comment section. for hashtag voting will be at the per post level, much like comment section will be.
- it will be a vote option for the user towards the post its on. displayed in comment chat box like metaData, with the hashtag chip visualize though (style guideline)
-- example, " USERNAME voted this Post as #GAY" (#GAY will be the colored chip)

* comment section
- comment section needs to be a section in event Popup. might possibly need to consider its location type -by- type , but will probably want to be near the top. 
- its
- in comments section, user can either input a comment, or cast their 1 hashtag vote towards the post.
- on comments posted, there will be an up-arrow, a down-arrow, and a reply button.


* NSFW filter logic. tie it to our existing elements like content blurring and user's birthdate input.

* need to ReVAMP the landing page timeline. make actual events, not just the intro text cards. 5 events per filter view should be enough. can save these on frontend like we've been doing.




---

## In Progress

### Postponed ToDos

* Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be 

#### COMPLETE 
(move these to README.md, along with any context to add on the feature's behalf. then delete them from this category.)

- [x] event Cards seem to be able to visualize too many hash tag chips. this could possibly break its layout.
 lets limit its hashtag chip visualiztion to the first three,
lets make their chip color standard for the first 3. representing medals, their coloring will be Gold (first), Silver (second), Bronze (third).

