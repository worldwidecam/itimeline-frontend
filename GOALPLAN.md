# GOALPLAN — iTimeline

## Main Goal
Build and maintain a polished, production-quality social timeline platform on the Cloudflare stack.

---

## Current Objective
Post-launch cleanup and new feature work. Site is live at i-timeline.com on the Cloudflare stack (Pages + Workers + D1 + R2).

---

## Objectives

### In Progress
- [ ] Finish Site Control audit — **Ban Lifted badge** and **Lift Warning** button still need live test cases
- [ ] Consolidate `App.js` + `App.jsx` — only `App.js` is active; `App.jsx` should be deleted

### Up Next (Features)
- [ ] **NSFW filter** — media creation toggle, birthday-based 18+ gate, blur-by-default in popups
- [ ] **Goblin Mode (Guest)** — auto-enter read-only guest session for unauthenticated share/deep links; spec locked in notes below
- [ ] **Hashtag chip voting** — voting system on hashtag chips
- [ ] **Home page submission box** — quick post from home feed
- [ ] **Timeline deletion** — define requirements + UX, then implement
- [ ] **Info Cards umbrella** — reorganize action card settings under Info Cards in admin panel

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
