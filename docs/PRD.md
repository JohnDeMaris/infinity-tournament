# Infinity Tournament Manager - Product Requirements Document

**Version:** 1.0
**Created:** 2026-01-19
**Last Updated:** 2026-01-19
**Author:** John DeMaris
**Status:** Draft

---

## 1. Problem Statement

### The Problem
Infinity the Game tournament organizers (TOs) need specialized software to manage ITS (Infinity Tournament System) format tournaments. Current solutions like BestCoast Pairings are designed for other miniature games and don't properly support Infinity's unique scoring system (OP/VP/AP), ITS-specific formats, or army list code imports from the official Army builder.

### Current State
TOs currently use:
- Generic tournament software that doesn't understand ITS scoring
- Spreadsheets for manual pairing and score tracking
- BestCoast Pairings (designed for Warhammer, lacks ITS support)
- Paper-based systems at smaller events

These solutions lead to scoring errors, slower round turnaround, and a poor experience for players trying to track standings.

### Opportunity
The Infinity community needs a purpose-built tournament management solution that:
- Understands ITS scoring (Objective Points, Victory Points, Army Points)
- Supports proper Swiss pairing with ITS tiebreakers
- Integrates with Army builder codes
- Provides real-time standings for players on mobile devices

---

## 2. Target User

### Primary User: Tournament Organizer (TO)
**Persona:** Alex the Tournament Organizer
**Description:** Experienced Infinity player who runs local and regional events. Comfortable with technology but wants efficiency over complexity. Runs 2-4 events per year, ranging from 8-32 players.
**Goals:**
- Run smooth, professional tournaments
- Minimize administrative overhead between rounds
- Provide accurate standings and pairings quickly
**Pain Points:**
- Manual pairing is error-prone and slow
- Explaining standings tiebreakers to players
- Managing army list submissions via email/Discord

### Secondary User: Player
**Persona:** Sam the Competitor
**Description:** Competitive Infinity player who attends 3-8 tournaments per year. Uses smartphone for everything. Wants to focus on games, not paperwork.
**Goals:**
- Find and register for events easily
- Submit army lists without friction
- See pairings and standings instantly
- Confirm game results quickly
**Pain Points:**
- Unclear when lists are due
- Waiting for TO to post pairings
- Disputes over score entry
- Can't see live standings

### User Context
- Mobile-first: 80%+ of player interactions happen on phones at events
- Event venues often have poor connectivity (consider offline-resilient patterns)
- Time pressure: Rounds run on strict schedules, every minute matters

---

## 3. Core Features (MVP)

### Feature 1: User Management
**Description:** Account creation and authentication for players and TOs with role-based permissions.
**User Value:** Single identity across all tournaments, secure access to TO tools
**Acceptance Criteria:**
- [ ] Users can register with email/password
- [ ] Users can log in and maintain session
- [ ] Users have profile with name and faction preference
- [ ] TO role grants access to tournament management tools
- [ ] Password reset functionality works

### Feature 2: Tournament Management
**Description:** TOs can create, configure, and manage tournament events with ITS-specific settings.
**User Value:** Complete control over tournament setup and execution
**Acceptance Criteria:**
- [ ] Create tournament with name, date(s), location
- [ ] Configure point limit (150, 200, 300, 400, custom)
- [ ] Set number of rounds and time limits
- [ ] Open/close registration with capacity limits
- [ ] Support multi-day events

### Feature 3: Player Registration
**Description:** Players can discover events, register, and submit army lists.
**User Value:** Frictionless event participation
**Acceptance Criteria:**
- [ ] Browse upcoming tournaments
- [ ] Register for open events
- [ ] Submit army list code from Army builder
- [ ] View registration status and submitted list
- [ ] Waitlist support when capacity reached

### Feature 4: Swiss Pairing System
**Description:** Automatic Swiss-system pairing with manual override capability.
**User Value:** Fair, efficient matchmaking that avoids repeat opponents
**Acceptance Criteria:**
- [ ] Generate pairings based on current standings
- [ ] Avoid repeat matchups within tournament
- [ ] Handle odd player count with bye assignment
- [ ] TO can manually adjust pairings if needed
- [ ] Assign table numbers

### Feature 5: ITS Scoring
**Description:** Score entry and confirmation with ITS-specific fields (OP, VP, AP).
**User Value:** Accurate, verified game results
**Acceptance Criteria:**
- [ ] Enter Objective Points (0-10)
- [ ] Enter Victory Points (0-300+)
- [ ] Enter Army Points destroyed (0-300+)
- [ ] Both players or TO can enter scores
- [ ] Score confirmation flow (both players confirm OR TO validates)

### Feature 6: Live Standings
**Description:** Real-time standings calculation and display with ITS tiebreakers.
**User Value:** Always know where you stand in the tournament
**Acceptance Criteria:**
- [ ] Calculate standings: OP > VP > AP > SoS
- [ ] Update in real-time as scores are entered
- [ ] Display round-by-round results
- [ ] Show win/loss/draw record
- [ ] Export final standings

---

## 4. User Stories

### Epic: Account Management

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-001 | As a player, I want to create an account so that I can register for tournaments | P0 | |
| US-002 | As a user, I want to log in so that I can access my account | P0 | |
| US-003 | As a user, I want to set my preferred faction so that TOs know what I play | P1 | |
| US-004 | As a user, I want to reset my password so that I can recover access | P1 | |

### Epic: Tournament Discovery & Registration

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-010 | As a player, I want to browse upcoming tournaments so that I can find events to attend | P0 | |
| US-011 | As a player, I want to register for a tournament so that I can participate | P0 | |
| US-012 | As a player, I want to submit my army list so that I'm eligible to play | P0 | |
| US-013 | As a player, I want to see my registration status so that I know if I'm in | P1 | |
| US-014 | As a player, I want to join a waitlist when capacity is reached so that I can get in if someone drops | P2 | |

### Epic: Tournament Management (TO)

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-020 | As a TO, I want to create a tournament so that players can register | P0 | |
| US-021 | As a TO, I want to configure ITS format settings so that the tournament runs correctly | P0 | |
| US-022 | As a TO, I want to view registered players and their lists so that I can prepare for the event | P0 | |
| US-023 | As a TO, I want to start a round and generate pairings so that matches can begin | P0 | |
| US-024 | As a TO, I want to adjust pairings manually so that I can handle special circumstances | P1 | |
| US-025 | As a TO, I want to enter/override scores so that I can resolve disputes | P0 | |

### Epic: Gameplay Flow

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-030 | As a player, I want to see my current pairing and table so that I know where to go | P0 | |
| US-031 | As a player, I want to enter my game results so that standings update | P0 | |
| US-032 | As a player, I want to confirm opponent's score entry so that results are verified | P0 | |
| US-033 | As a player, I want to see live standings so that I know my position | P0 | |
| US-034 | As a player, I want to see round-by-round results so that I can review the tournament | P1 | |

---

## 5. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Public Pages│ │Player Views │ │  TO Admin   │ │   Auth    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Auth       │ │  Database   │ │  Real-time  │ │   RLS     │ │
│  │  (Email)    │ │ (PostgreSQL)│ │(Subscriptions│ │ (Security)│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | React ecosystem, SSR, easy Vercel deployment |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, accessible components |
| Database | Supabase (PostgreSQL) | Real-time subscriptions, built-in auth, free tier |
| Auth | Supabase Auth | Email/password, integrates with RLS |
| Hosting | Vercel | Zero-config Next.js, generous free tier |

### Data Model

```
User
├── id: uuid (PK)
├── email: string (unique)
├── name: string
├── role: enum (player, to, admin)
└── faction_preference: string (nullable)

Tournament
├── id: uuid (PK)
├── name: string
├── date_start: date
├── date_end: date (nullable)
├── location: string
├── organizer_id: uuid (FK → User)
├── point_limit: integer
├── rounds: integer
├── time_limit: integer (minutes)
├── status: enum (draft, registration, active, completed)
└── settings: jsonb

Registration
├── id: uuid (PK)
├── tournament_id: uuid (FK → Tournament)
├── user_id: uuid (FK → User)
├── army_list_code: text (nullable)
├── army_faction: string (nullable)
├── status: enum (registered, waitlist, dropped)
└── created_at: timestamp

Round
├── id: uuid (PK)
├── tournament_id: uuid (FK → Tournament)
├── round_number: integer
├── status: enum (pairing, active, completed)
└── created_at: timestamp

Match
├── id: uuid (PK)
├── round_id: uuid (FK → Round)
├── player1_id: uuid (FK → User)
├── player2_id: uuid (FK → User, nullable for bye)
├── table_number: integer
├── player1_op: integer (nullable)
├── player1_vp: integer (nullable)
├── player1_ap: integer (nullable)
├── player2_op: integer (nullable)
├── player2_vp: integer (nullable)
├── player2_ap: integer (nullable)
├── confirmed_by_p1: boolean (default false)
├── confirmed_by_p2: boolean (default false)
└── winner_id: uuid (FK → User, nullable)
```

### Privacy & Security Architecture
- Row Level Security (RLS) on all tables
- Users can only view/edit their own data
- TOs can view/edit data for their tournaments
- Scores require dual confirmation or TO override
- No sensitive personal data beyond email

### Infrastructure
- Vercel for frontend (auto-scaling, CDN)
- Supabase for backend (managed PostgreSQL, auth)
- Real-time subscriptions for live standings
- PWA for mobile installability

---

## 6. Success Metrics

### Primary Metrics

| Metric | Definition | Target | Timeframe |
|--------|------------|--------|-----------|
| Tournament Completion Rate | % of started tournaments that finish without critical issues | >95% | Per event |
| TO Adoption | Number of TOs using the platform | 10 active TOs | 6 months post-launch |
| Player Registration | Number of unique player accounts | 200 players | 6 months post-launch |
| Score Entry Speed | Time from game end to both scores confirmed | <3 minutes average | Ongoing |

### Secondary Metrics
- Mobile usage percentage (target: >70%)
- Average rounds per tournament
- Player return rate (play in 2+ events)

### Anti-Metrics
- NOT optimizing for: Number of features (avoid feature creep)
- NOT optimizing for: Daily active users (tournament apps are episodic)

---

## 7. Out of Scope (Post-MVP)

| Feature | Why Not MVP | Potential Timeline |
|---------|-------------|-------------------|
| Official ITS integration/sync | Requires Corvus Belli partnership | v2+ |
| Army list validation | Complex rules engine, not core need | v1.1 |
| Spectator/streaming mode | Nice-to-have, not essential | v1.2 |
| Payment processing | Adds complexity, legal concerns | v2+ |
| Achievements/badges | Gamification, post-adoption feature | v1.2 |
| Chat/messaging | Adds moderation burden | TBD |
| Push notifications | Requires additional infrastructure | v1.1 |
| Full offline mode | Significant complexity | v2+ |
| Social login (Google, Discord) | Email auth sufficient for MVP | v1.1 |

---

## 8. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Army list code format documentation? | Affects parsing reliability | John | Before Phase 2 |
| Strength of Schedule (SoS) exact calculation? | Affects tiebreaker logic | John | Before Phase 3 |
| Multi-day tournament flow (separate Swiss pools?) | Affects data model | John | Before Phase 2 |
| ITS mission/scenario tracking needed? | Could expand scope | John | Before Phase 2 |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Army builder changes code format | Medium | High | Abstract parser, monitor for changes |
| Poor mobile connectivity at events | High | Medium | Optimize for low bandwidth, consider offline-first patterns |
| TO resistance to new tool | Medium | High | Make onboarding friction-free, focus on time savings |
| Score disputes | Medium | Low | Dual confirmation system, TO override capability |
| Supabase free tier limits | Low | Medium | Monitor usage, plan for paid tier if needed |

---

## 10. Timeline & Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| Phase 1: Foundation | Week 1-2 | Auth, user profiles, project setup |
| Phase 2: Tournament Core | Week 3-4 | Tournament CRUD, registration, army lists |
| Phase 3: Pairing & Scoring | Week 5-6 | Swiss pairing, score entry, confirmation |
| Phase 4: Standings | Week 7 | Live standings, real-time updates |
| Phase 5: Polish | Week 8 | Mobile responsiveness, PWA, bug fixes |
| Beta Launch | Week 9 | Deploy to production, invite beta TOs |

---

## Appendix

### A. Competitive Analysis

| Product | Strengths | Weaknesses for Infinity |
|---------|-----------|------------------------|
| BestCoast Pairings | Established, feature-rich | No ITS scoring, Warhammer-focused |
| Tabletop.to | Good pairing system | Limited scoring customization |
| Spreadsheets | Flexible, familiar | Manual, error-prone, no mobile |

### B. ITS Scoring Reference

**Scoring Components:**
- **Objective Points (OP):** 0-10 per game, primary ranking
- **Victory Points (VP):** Points scored during game (varies by mission)
- **Army Points (AP):** Enemy points destroyed

**Tiebreaker Order:**
1. Total OP (higher is better)
2. Total VP (higher is better)
3. Total AP (higher is better)
4. Strength of Schedule (opponents' combined OP)

### C. Swiss Pairing Rules

1. Players paired by standing (best vs best)
2. No repeat opponents within tournament
3. Odd player count: lowest unpaired player gets bye
4. Bye awards maximum points (typically 10 OP, 0 VP, 0 AP)

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | John DeMaris | Initial draft from plan |
