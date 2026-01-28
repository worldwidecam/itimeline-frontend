# GOALPLAN - Voting System (2026-01-15)

## Main Goal
Design and integrate a Promote/Demote voting system for posts with influence dots that reflect total engagement and sentiment.

---

## Current Subgoal

**Phase**: Timeline Cleanup & Optimization (Post Vote Dots)
- [ ] Remove legacy debug logs from TimelineV3 and related components
- [ ] Audit year view behavior vs other views
- [ ] Re-verify timeline performance after cleanup

---

## Completed Phases

### ✅ Phase 1: Product & Visual Spec (COMPLETE)
- [x] Finalize voting rules (who can vote, per-post scope, vote states)
- [x] Finalize influence dot behavior (visibility, color, height math)
- [x] Finalize vote control UI placement (right-aligned in title row)
- [x] Decide vote feedback between arrows (pie chart vs count)
- [x] Define phased loading plan (timeline → markers → voting dots)

### ✅ Phase 2: Data & Architecture Plan (COMPLETE)
- [x] Define storage approach (backend-persisted with PostgreSQL)
- [x] Define API shape for votes + summary
- [x] Decide frontend data flow + caching strategy for vote summaries

### ✅ Phase 3: Backend Implementation (COMPLETE - Jan 15, 2026)
- [x] Create Vote SQLAlchemy model with event_id, user_id, vote_type, timestamps
- [x] Implement backend Flask endpoints (`/api/v1/events/{id}/vote` POST/GET/DELETE)
- [x] Add JWT authentication to vote endpoints
- [x] Create PostgreSQL migration script for vote table
- [x] Run migration and verify table creation

### ✅ Phase 4: Frontend API Integration (COMPLETE - Jan 15, 2026)
- [x] Create voteApi.js utility functions (castVote, getVoteStats, removeVote)
- [x] Wire RemarkCard to backend vote API
- [x] Wire NewsCard to backend vote API
- [x] Wire MediaCard to backend vote API
- [x] Wire NewsEventPopup to backend vote API
- [x] Wire ImageEventPopup to backend vote API
- [x] Wire VideoEventPopup to backend vote API
- [x] Wire AudioMediaPopup to backend vote API
- [x] Fix AudioWaveformVisualizer import error

### Phase 5: Testing & Verification (IN PROGRESS)
- [x] Verify vote persistence after page refresh (all card types)
- [x] Verify vote loading in popups on open
- [x] Verify vote state sync between cards and popups
- [ ] Verify error handling for network failures
- [ ] Verify vote controls are disabled for guest/lurker accounts
- [x] Verify dot visibility + color rules (no dot on neutral)
- [ ] Visually set correct vote control positioning per Popup type

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
 - Vote dot scan direction confirmed left-to-right (Jan 28, 2026)

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
