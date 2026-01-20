# Infinity Tournament Manager - v1.1 to v2 Roadmap PRD

**Version:** 1.0
**Created:** 2026-01-20
**Last Updated:** 2026-01-20
**Author:** Ji (generated from roadmap analysis)
**Status:** Draft - Ready for Review

---

## 1. Problem Statement

### The Problem
The Infinity Tournament Manager MVP (v1.0) is feature-complete with 69 implemented tasks covering core tournament management, real-time features, admin tools, and offline support. However, several areas need enhancement for production readiness and competitive feature parity:

1. **Integration gaps** - Game system selector not wired through UI
2. **Observability** - No production error tracking
3. **Security hardening** - CSP in report-only mode, no rate limiting, no CSRF
4. **Authentication friction** - Email-only auth, competitors offer social login
5. **Engagement features** - No gamification to drive retention
6. **Future growth** - Official ITS integration, payments, and communication features

### Current State
- MVP complete: Authentication, tournaments, Swiss pairing, ITS scoring, standings, offline sync, admin dashboard
- 52 unit tests passing, Playwright E2E configured
- Security headers in report-only mode
- No production error monitoring
- Email-only authentication

### Opportunity
Completing this roadmap will:
- Make the platform production-ready with proper observability and security
- Reduce friction for new users with social login
- Increase engagement with achievements
- Position for growth with ITS integration and monetization options

---

## 2. Target Users

### Primary: Tournament Organizers (TOs)
**Goals:** Run professional events with minimal issues
**New Pain Points:**
- Want better visibility into errors
- Need to see player engagement metrics
- Want official ITS data sync

### Secondary: Players
**Goals:** Easy registration, track progress
**New Pain Points:**
- Want social login (already have Discord/Google accounts)
- Want to track achievements across tournaments
- Want in-app communication

### Tertiary: Platform Administrators
**Goals:** Maintain healthy platform
**New Pain Points:**
- Need error monitoring
- Need rate limiting against abuse
- Need security compliance

---

## 3. Core Features by Phase

### Phase A: Integration & Cleanup (Immediate)

#### Feature A1: Game System Selector UI
**Description:** Add game system dropdown to tournament creation form and wire gameSystemId through all relevant components.
**User Value:** TOs can create tournaments for different game systems (future-proofing)
**Acceptance Criteria:**
- [ ] Tournament creation form has game system dropdown (default: Infinity)
- [ ] gameSystemId passed to score forms
- [ ] gameSystemId passed to standings calculation
- [ ] Existing tournaments default to 'infinity'

#### Feature A2: TypeScript Cleanup
**Description:** Fix pre-existing TypeScript errors in score-form.tsx and create-tournament-form.tsx
**User Value:** Developer experience, prevents runtime errors
**Acceptance Criteria:**
- [ ] `npm run build` passes with no type errors
- [ ] `npx tsc --noEmit` passes cleanly
- [ ] No `any` types in modified files

---

### Phase B: Production Readiness (Next Sprint)

#### Feature B1: Sentry Error Tracking
**Description:** Integrate Sentry for production error monitoring and performance tracking
**User Value:** Faster bug detection and resolution
**Acceptance Criteria:**
- [ ] Sentry SDK installed and configured
- [ ] Client-side errors captured with stack traces
- [ ] Server-side errors captured (API routes, server actions)
- [ ] Source maps uploaded for readable traces
- [ ] Environment separation (dev/staging/prod)
- [ ] Error boundary integration sends to Sentry

#### Feature B2: E2E Test Expansion
**Description:** Expand Playwright test suite to cover critical user flows
**User Value:** Confidence in deployments
**Acceptance Criteria:**
- [ ] Test: User registration flow
- [ ] Test: Tournament creation flow
- [ ] Test: Player registration for event
- [ ] Test: Score entry and confirmation
- [ ] Test: Standings calculation display
- [ ] CI runs E2E tests on PR
- [ ] >70% coverage of critical paths

---

### Phase C: Security Hardening (v1.1)

#### Feature C1: Social Login (OAuth)
**Description:** Add Google and Discord OAuth providers alongside email auth
**User Value:** Faster registration, familiar auth flow
**Acceptance Criteria:**
- [ ] Google OAuth provider configured in Supabase
- [ ] Discord OAuth provider configured in Supabase
- [ ] Login page shows social login buttons
- [ ] Account linking for existing email users
- [ ] Profile shows connected providers
- [ ] Works on mobile browsers

#### Feature C2: Rate Limiting
**Description:** Implement rate limiting on API routes and server actions to prevent abuse
**User Value:** Platform stability, prevents DoS
**Acceptance Criteria:**
- [ ] Rate limiting on auth endpoints (5 attempts/minute)
- [ ] Rate limiting on score submission (30/minute per user)
- [ ] Rate limiting on tournament creation (5/hour per user)
- [ ] Graceful error messages for rate-limited users
- [ ] Admin IPs can bypass (optional)

#### Feature C3: Full CSP Enforcement
**Description:** Transition Content Security Policy from report-only to enforced mode
**User Value:** XSS protection
**Acceptance Criteria:**
- [ ] Audit all inline scripts and styles
- [ ] Add nonces or hashes for legitimate inline code
- [ ] Change header from Report-Only to enforced
- [ ] OBS overlay still functions
- [ ] No console CSP errors in normal operation

#### Feature C4: CSRF Protection
**Description:** Add CSRF tokens to all state-changing operations
**User Value:** Prevents cross-site request forgery attacks
**Acceptance Criteria:**
- [ ] CSRF tokens generated per session
- [ ] All forms include CSRF token
- [ ] Server actions validate CSRF token
- [ ] Token rotation on sensitive operations
- [ ] Clear error message on CSRF failure

---

### Phase D: Engagement (v1.2)

#### Feature D1: Achievement System
**Description:** Track and display player achievements and badges
**User Value:** Gamification drives engagement and retention
**Acceptance Criteria:**
- [ ] Achievement definitions table in database
- [ ] Achievement progress tracking per user
- [ ] Achievements: First Tournament, First Win, 10 Tournaments, etc.
- [ ] Badge display on player profile
- [ ] Achievement unlock notifications
- [ ] Shareable achievement cards (social preview)

**Achievement Categories:**
| Category | Examples |
|----------|----------|
| Participation | First Tournament, 10 Tournaments, Tournament Streak |
| Performance | First Win, Undefeated Event, Tournament Champion |
| Faction | Faction Loyalist, Faction Explorer, Master of All |
| Community | TO Badge, Early Adopter, Beta Tester |

---

### Phase E: Platform Growth (v2+)

#### Feature E1: Official ITS Integration
**Description:** Sync tournament data with Corvus Belli's official ITS system
**User Value:** Official rankings, legitimacy
**Acceptance Criteria:**
- [ ] ITS API integration (pending Corvus Belli partnership)
- [ ] Tournament registration sync
- [ ] Results submission to ITS
- [ ] Player ITS rank display
- [ ] ITS mission/scenario support

**Dependencies:** Requires partnership agreement with Corvus Belli

#### Feature E2: Payment Processing
**Description:** Accept tournament entry fees and process payments
**User Value:** Streamlined registration, TO revenue management
**Acceptance Criteria:**
- [ ] Stripe integration for payments
- [ ] TOs can set entry fees per tournament
- [ ] Players can pay during registration
- [ ] Refund workflow for cancellations
- [ ] TO payout system
- [ ] Fee reporting for tax purposes

**Dependencies:** Legal review, business entity setup

#### Feature E3: Full Offline Mode
**Description:** Complete offline-first architecture with full functionality without internet
**User Value:** Works in venues with no connectivity
**Acceptance Criteria:**
- [ ] All tournament operations work offline
- [ ] Automatic sync when connectivity restored
- [ ] Conflict resolution for simultaneous offline edits
- [ ] Offline mode indicator
- [ ] Data never lost

#### Feature E4: Chat & Messaging
**Description:** In-app communication between players and TOs
**User Value:** Centralized communication, announcements
**Acceptance Criteria:**
- [ ] TO announcements to all registered players
- [ ] Player-to-player messaging (optional)
- [ ] Match chat for game discussion
- [ ] Push notifications for messages
- [ ] Moderation tools

**Dependencies:** Moderation strategy, abuse prevention

---

## 4. User Stories

### Epic: Integration & Cleanup

| ID | Story | Priority | Phase |
|----|-------|----------|-------|
| US-A01 | As a TO, I want to select a game system when creating a tournament | P0 | A |
| US-A02 | As a developer, I want clean TypeScript compilation | P0 | A |

### Epic: Production Readiness

| ID | Story | Priority | Phase |
|----|-------|----------|-------|
| US-B01 | As a developer, I want to see production errors in Sentry | P0 | B |
| US-B02 | As a developer, I want E2E tests to catch regressions | P0 | B |
| US-B03 | As a user, I want errors to be fixed quickly | P1 | B |

### Epic: Security

| ID | Story | Priority | Phase |
|----|-------|----------|-------|
| US-C01 | As a player, I want to log in with my Google account | P0 | C |
| US-C02 | As a player, I want to log in with my Discord account | P0 | C |
| US-C03 | As an admin, I want the platform protected from abuse | P1 | C |
| US-C04 | As a user, I want my session protected from CSRF attacks | P1 | C |

### Epic: Engagement

| ID | Story | Priority | Phase |
|----|-------|----------|-------|
| US-D01 | As a player, I want to earn achievements for tournament participation | P1 | D |
| US-D02 | As a player, I want to display badges on my profile | P1 | D |
| US-D03 | As a player, I want to share my achievements on social media | P2 | D |

### Epic: Growth

| ID | Story | Priority | Phase |
|----|-------|----------|-------|
| US-E01 | As a TO, I want tournament results synced to official ITS | P1 | E |
| US-E02 | As a TO, I want to collect entry fees online | P1 | E |
| US-E03 | As a player, I want the app to work without internet | P2 | E |
| US-E04 | As a player, I want to message other players | P2 | E |

---

## 5. Technical Architecture

### System Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                    infinity-tournament v1.1+                     │
├─────────────────────────────────────────────────────────────────┤
│  NEW: External Services                                          │
│  ├── Sentry (error tracking)                                    │
│  ├── Google OAuth (via Supabase)                                │
│  ├── Discord OAuth (via Supabase)                               │
│  └── Stripe (v2 - payments)                                     │
├─────────────────────────────────────────────────────────────────┤
│  NEW: Database Tables                                            │
│  ├── achievements (id, name, description, criteria, icon)       │
│  ├── user_achievements (user_id, achievement_id, unlocked_at)   │
│  └── messages (v2 - sender_id, recipient_id, content, read_at) │
├─────────────────────────────────────────────────────────────────┤
│  MODIFIED: Security Layer                                        │
│  ├── middleware.ts - rate limiting, CSRF validation             │
│  ├── next.config.ts - enforced CSP                              │
│  └── auth/ - social OAuth providers                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error Tracking | Sentry | Industry standard, Next.js integration |
| OAuth | Supabase Auth | Already using Supabase, minimal config |
| Rate Limiting | Upstash Redis | Serverless-friendly, Vercel integration |
| Payments | Stripe | Industry standard, good docs |
| Real-time Chat | Supabase Realtime | Already have infrastructure |

### New Dependencies

| Package | Purpose | Phase |
|---------|---------|-------|
| @sentry/nextjs | Error tracking | B |
| @upstash/ratelimit | Rate limiting | C |
| @upstash/redis | Rate limit storage | C |
| stripe | Payment processing | E |

---

## 6. Success Metrics

### Phase A & B (Production Readiness)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Build errors | 0 | CI pipeline |
| Type errors | 0 | `tsc --noEmit` |
| E2E test coverage | >70% critical paths | Playwright |
| Error detection time | <5 minutes | Sentry alerts |

### Phase C (Security - v1.1)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Social login adoption | 50% of new signups | Analytics |
| Rate limit triggers | <1% of legitimate requests | Logs |
| CSP violations | 0 in production | Sentry/logs |

### Phase D (Engagement - v1.2)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Achievement unlock rate | 80% of users have 1+ | Database |
| Profile views increase | +25% | Analytics |
| Return user rate | +15% | Analytics |

### Phase E (Growth - v2)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment conversion | 90% of paid events | Stripe |
| ITS sync success | 99% | API logs |
| Offline usage | Track adoption | Analytics |

---

## 7. Out of Scope

| Feature | Why Not Now | Potential Timeline |
|---------|-------------|-------------------|
| Mobile native apps | PWA sufficient, reduces maintenance | v3+ |
| Tournament streaming integration | Nice-to-have, not core | v2.5 |
| AI-powered pairings | Interesting but complex | Research |
| Multi-language support | English market first | v2+ |
| Tournament series/circuits | Complex, wait for demand | v2+ |

---

## 8. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Corvus Belli ITS API access? | Blocks E1 | John | Before Phase E |
| Stripe business requirements? | Blocks E2 | John | Before Phase E |
| Discord OAuth client ID? | Needed for C1 | John | Before Phase C |
| Google OAuth client ID? | Needed for C1 | John | Before Phase C |
| Upstash account setup? | Needed for C2 | John | Before Phase C |
| Sentry DSN? | Needed for B1 | John | Before Phase B |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Corvus Belli declines API access | Medium | High | Build value without it, revisit later |
| OAuth provider changes | Low | Medium | Abstract auth layer, support fallback |
| Rate limiting too aggressive | Medium | Medium | Start lenient, tune based on data |
| Payment disputes | Medium | Medium | Clear refund policy, Stripe tools |
| Chat abuse | High | Medium | Strong moderation, reporting tools |

---

## 10. Timeline & Milestones

| Phase | Milestone | Target | Deliverables |
|-------|-----------|--------|--------------|
| A | Integration Complete | Week 1 | Game system selector, TS cleanup |
| B | Production Ready | Week 2-3 | Sentry, E2E tests |
| C | v1.1 Release | Week 4-6 | Social login, rate limiting, CSP, CSRF |
| D | v1.2 Release | Week 8-10 | Achievement system |
| E | v2.0 Release | Q2 2026 | ITS integration, payments, offline, chat |

---

## 11. Implementation Tasks (Wiggum Ready)

### Phase A: Integration & Cleanup
| ID | Task | Size | Depends On |
|----|------|------|------------|
| A-001 | Add game system selector to create-tournament-form | S | - |
| A-002 | Wire gameSystemId to score-form component | S | A-001 |
| A-003 | Wire gameSystemId to standings calculation | S | A-001 |
| A-004 | Fix TypeScript errors in score-form.tsx | S | - |
| A-005 | Fix TypeScript errors in create-tournament-form.tsx | S | - |

### Phase B: Production Readiness
| ID | Task | Size | Depends On |
|----|------|------|------------|
| B-001 | Install and configure @sentry/nextjs | M | - |
| B-002 | Add Sentry to error boundaries | S | B-001 |
| B-003 | Configure source map uploads | S | B-001 |
| B-004 | Write E2E test: user registration | M | - |
| B-005 | Write E2E test: tournament creation | M | - |
| B-006 | Write E2E test: player event registration | M | - |
| B-007 | Write E2E test: score entry flow | M | - |
| B-008 | Write E2E test: standings display | M | - |
| B-009 | Add E2E tests to CI workflow | S | B-004 |

### Phase C: Security (v1.1)
| ID | Task | Size | Depends On |
|----|------|------|------------|
| C-001 | Configure Google OAuth in Supabase | S | - |
| C-002 | Configure Discord OAuth in Supabase | S | - |
| C-003 | Add social login buttons to login page | M | C-001, C-002 |
| C-004 | Add account linking UI | M | C-003 |
| C-005 | Install Upstash Redis and ratelimit packages | S | - |
| C-006 | Create rate limiting middleware | M | C-005 |
| C-007 | Apply rate limits to auth endpoints | S | C-006 |
| C-008 | Apply rate limits to score submission | S | C-006 |
| C-009 | Audit inline scripts for CSP | M | - |
| C-010 | Implement CSP nonces | M | C-009 |
| C-011 | Enable enforced CSP | S | C-010 |
| C-012 | Implement CSRF token generation | M | - |
| C-013 | Add CSRF validation to server actions | M | C-012 |
| C-014 | Add CSRF tokens to all forms | M | C-012 |

### Phase D: Engagement (v1.2)
| ID | Task | Size | Depends On |
|----|------|------|------------|
| D-001 | Create achievements database schema | S | - |
| D-002 | Define initial achievement set | M | D-001 |
| D-003 | Create achievement unlock logic | L | D-002 |
| D-004 | Add achievements to player profile | M | D-003 |
| D-005 | Create achievement notification component | M | D-003 |
| D-006 | Add shareable achievement cards | M | D-004 |

### Phase E: Growth (v2)
| ID | Task | Size | Depends On |
|----|------|------|------------|
| E-001 | Research ITS API (pending partnership) | L | - |
| E-002 | Implement ITS sync | XL | E-001 |
| E-003 | Set up Stripe account and integration | L | - |
| E-004 | Add payment flow to registration | L | E-003 |
| E-005 | Create TO payout system | L | E-003 |
| E-006 | Enhance offline sync for full offline mode | XL | - |
| E-007 | Design chat data model | M | - |
| E-008 | Implement real-time chat | L | E-007 |
| E-009 | Add moderation tools | M | E-008 |

---

## Appendix

### A. Existing Project Structure
```
infinity-tournament/
├── docs/PRD.md                    # Original MVP PRD
├── docs/PRD-Stability-Hardening.md # Stability sprint PRD
├── specs/                         # Feature specifications
├── IMPLEMENTATION_PLAN.md         # Completed: 69/69 tasks
└── src/                           # Application code
```

### B. Related Documents
- Original PRD: `docs/PRD.md`
- Stability PRD: `docs/PRD-Stability-Hardening.md`
- Technical Debt PRD: `docs/PRD-TechnicalDebt.md`

### C. Dependency Links
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Stripe Next.js](https://stripe.com/docs/payments/quickstart)

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Ji | Initial draft from roadmap analysis |
