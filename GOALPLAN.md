# GOALPLAN — iTimeline

## Main Goal
create a safe github system , to allow me to continue development without breaking the Live PRODUCTION environment

---

## Current Objective
Post-launch , i'm thinking we move back to MAIN branch for development.
also, perhaps we need a staging branch for testing before merging to main.
---

## Objectives

### In Progress
- [ ] 
- [ ] Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be deleted

### Up Next (Features)
- [ ] **NSFW filter** — media creation toggle, birthday-based 18+ gate, blur-by-default in popups
- [ ] better login credentials. i'm logged in on my phone. hours pass and i want to check the feed. instead of staying logged in, i not only do not go to login page, but i am immediately logged in as guest user. its not that i want to be directed to login page, but i want to be logged in as myself
- [ ] **Hashtag chip voting** — voting system on hashtag chips
- [ ]
- [ ] **Timeline deletion** — define requirements + UX, then implement
- [ ] 

### Backlog
- [ ] Fallback image rules for news/link events — define rules and improve preview reliability across cards and popups
- [ ] Frontend/backend inflation audit — identify logic that belongs in iTimeline-DB package
- [ ] Theme architecture hardening — final light-mode micro-surface polish pass
- [ ] Shared personal timelines surface — decide whether "Shared With Me" list/module is needed or link-only access is intentional
- [ ] Media merge tooling — ideate high-tier report decision for duplicate/redundant media events

---

## Goblin Mode Spec (locked)
- Auto-enter on unauthenticated share/deep links and Home entry
- Can view: public timelines (hashtag + non-private community), public profiles, public event popups
- Cannot: post, create, join, follow, manage, report, or access private surfaces
- Private surface attempts → Goblin redirect page (CTAs: go back / login / home)
- Auth handoff: cache `returnTo` URL → resume after real login
- Implementation order: guest profile route → profile guard → timeline/home surfaces
