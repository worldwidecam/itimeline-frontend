# GOALPLAN - Voting System (2026-01-13)

## Main Goal
Design and integrate a Promote/Demote voting system for posts with influence dots that reflect total engagement and sentiment.

---

## Current Subgoal

**Phase**: Planning & Specification
- [ ] implement vote pill in all event popups. currently it is only available in remark eventpopup

---

## Tasks & Checklist

### Phase 1: Product & Visual Spec
- [ ] Finalize voting rules (who can vote, per-post scope, vote states)
- [ ] Finalize influence dot behavior (visibility, color, height math)
- [ ] Finalize vote control UI placement (right-aligned in title row)
- [ ] Decide vote feedback between arrows (pie chart vs count)
- [ ] Define phased loading plan (timeline → markers → voting dots)

### Phase 2: Data & Architecture Plan
- [ ] Define storage approach (prototype vs. persisted; no schema change without approval)
- [ ] Define API shape for votes + summary (if backend work is approved)
- [ ] Decide frontend data flow + caching strategy for vote summaries

### Phase 3: UI Integration Plan
- [ ] Place Promote/Demote controls on post cards (Reddit-style)
- [ ] Place influence dots above markers (no connecting line)
- [ ] Keep vote-dot rendering independent of initial timeline render
- [ ] Ensure EventList card vote pill and EventPopup vote pill reflect the same vote data
- [ ] Add vote pill to all other EventPopup types (News, Media, Image, Video, Audio)

### Testing & Verification
- [ ] Verify vote controls are disabled for guest/lurker accounts
- [ ] Verify dot visibility + color rules (no dot on neutral)
- [ ] Verify phased loading does not impact timeline performance

---

## Notes & Context

### Key Requirements
- Voting is **per post (global)**, not per timeline
- Only authenticated users can vote (guest/lurker cannot)
- Vote score = promote + demote (total engagement)
- Dot color = green for net positive, red for net negative, invisible for net zero
- Dot height is based on total vote score first, then neighboring dots
- No hover tooltip; voting controls live on each post (Reddit-style)
- Voting dots load in a **separate phase** after timeline content
- Vote controls sit **right-aligned** in the same title row (cards + popups)
- Vote arrows are **unlabeled** (tutorial handles nomenclature)

### Design Decisions
- No connecting line between dots
- Neutral (equal promote/demote) renders **no dot**, but still influences neighbor scaling
- Dot height uses a capped range derived from timeline workspace (exact range TBD)
- Influence dot is a **single particle** with subtle brightness pulsing (no glow/bloom)
- Vote feedback between arrows (preferred): mini pie chart split green/red
- Pie chart appears only after the current user has cast a vote
- Interaction: arrows sit closer together when no vote; when a user votes, arrows slide apart and the equal-size pie chart animates into the gap
- Dot height math (explicit):
  - totalVotes = promote + demote
  - netVotes = promote - demote
  - Dot is visible only when netVotes != 0
  - Use neutral dots in scaling even if invisible
  - Global base height (total-first):
    - baseHeight = minHeight + (totalVotes / globalMaxVotes) * (maxHeight - minHeight)
  - Local neighbor influence (neighbor-second):
    - localMax = max(totalVotes in N-left + N-right + self)
    - localHeight = minHeight + (totalVotes / localMax) * (maxHeight - minHeight)
  - Final height (blend):
    - height = (0.7 * baseHeight) + (0.3 * localHeight)
  - If localMax exceeds maxHeight range, clamp with scale:
    - scale = maxHeight / localMax
    - height = height * scale
- Loading phases (preferred):
  - Phase 1: Timeline + Event List load (markers may be deferred)
  - Phase 2: Event markers render/grow in
  - Phase 3: Vote dots render in independently

---

## Completed Items

-  Feature ideation and requirements gathering
-  Design specifications finalized
-  Access control model defined
-  Layout and display location confirmed
-  Database schema structure planned
-  API endpoint structure planned
