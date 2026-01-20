# Infinity Tournament Manager - Stability & Hardening Sprint

**Version:** 1.0
**Created:** 2026-01-20
**Last Updated:** 2026-01-20
**Author:** Ji (from THEALGORITHM analysis)
**Status:** Draft - Ready for Implementation

---

## 1. Problem Statement

### The Problem
The Infinity Tournament Manager has **zero test coverage** and several security/reliability gaps that create significant risk before production deployment. Tournament software handles critical data (pairings, scores, standings) where bugs cause immediate user-visible problems at live events.

### Current State
- 53/53 planned features complete for phases 0-6, 8
- **0% test coverage** - no unit, integration, or E2E tests exist
- Known bug: Admin actions reference wrong field (`is_suspended` vs `status`)
- Missing security headers (CSP, X-Frame-Options)
- No error boundaries - unhandled errors crash the app
- Safari users lose IndexedDB data after 7 days without PWA install prompt

### Opportunity
Addressing these issues now prevents production incidents and establishes a foundation for safe future development. Competitors like BCP have reliability issues - stability is a competitive advantage.

---

## 2. Target User

### Primary User: Tournament Organizers (TOs)
**Goals:** Run smooth events without software failures
**Pain Points:** Current lack of tests means any code change could break the app at a live event

### Secondary User: Players
**Goals:** Submit scores, view standings without errors
**Pain Points:** Safari users may lose offline data unexpectedly

---

## 3. Core Features (MVP Sprint)

### Feature 1: Testing Infrastructure
**Description:** Add Vitest + React Testing Library + Playwright foundation with initial test coverage for critical algorithms
**User Value:** Prevents regressions, enables confident deployments
**Acceptance Criteria:**
- [ ] Vitest configured with jsdom environment
- [ ] React Testing Library setup for component tests
- [ ] Playwright configured for E2E tests
- [ ] Unit tests for `swiss.ts` (pairing algorithm)
- [ ] Unit tests for `standings.ts` (tiebreaker calculation)
- [ ] CI workflow runs tests on every PR

### Feature 2: Admin Bug Fix
**Description:** Fix field mismatch in admin actions where code checks `is_suspended` but schema uses `status`
**User Value:** Prevents runtime errors when suspending/unsuspending users
**Acceptance Criteria:**
- [ ] `src/lib/admin/actions.ts` updated to use correct field name
- [ ] Unit test added to verify suspend/unsuspend behavior
- [ ] Manual verification in development environment

### Feature 3: Security Headers
**Description:** Add security headers to all responses via Next.js config
**User Value:** Protects against clickjacking, XSS, and content injection
**Acceptance Criteria:**
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Content-Security-Policy configured (report-only initially)
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Headers verified via securityheaders.com

### Feature 4: React Error Boundaries
**Description:** Add error boundaries to catch and display user-friendly error states
**User Value:** Graceful degradation instead of white screen crashes
**Acceptance Criteria:**
- [ ] Root error boundary in app layout
- [ ] Tournament-specific error boundary
- [ ] Error UI shows "something went wrong" with recovery action
- [ ] Errors logged to console (Sentry integration deferred)

### Feature 5: Safari PWA Install Prompt
**Description:** Prompt Safari users to install PWA to prevent 7-day IndexedDB eviction
**User Value:** Prevents surprise data loss for iOS/Safari users
**Acceptance Criteria:**
- [ ] Detect Safari/iOS users not in standalone mode
- [ ] Show non-intrusive install prompt after 2nd visit
- [ ] Include instructions for "Add to Home Screen"
- [ ] Prompt dismissable with 30-day cookie

---

## 4. User Stories

### Epic: Testing Foundation

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-001 | As a developer, I want tests to run automatically on PR, so that I catch regressions before merge | P0 | GitHub Actions |
| US-002 | As a developer, I want unit tests for the Swiss pairing algorithm, so that I can safely modify it | P0 | Edge cases: odd players, rematches |
| US-003 | As a developer, I want unit tests for standings calculation, so that tiebreakers are verified | P0 | SoS calculation critical |

### Epic: Bug Fixes & Security

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-004 | As an admin, I want to suspend users without errors, so that I can moderate the platform | P0 | Current bug blocks this |
| US-005 | As a user, I want the app to show an error page instead of crashing, so that I can recover | P1 | Error boundary |
| US-006 | As a user, I want the app protected from clickjacking, so that my actions are secure | P1 | X-Frame-Options |

### Epic: Safari/PWA

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-007 | As a Safari user, I want to be prompted to install the PWA, so that my offline data persists | P1 | iOS critical |

---

## 5. Technical Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    infinity-tournament                       │
├─────────────────────────────────────────────────────────────┤
│  src/                                                        │
│  ├── app/                                                    │
│  │   ├── layout.tsx          ← Add ErrorBoundary wrapper    │
│  │   └── error.tsx           ← Add root error UI            │
│  ├── components/                                             │
│  │   └── pwa/                                                │
│  │       └── SafariInstallPrompt.tsx  ← NEW                 │
│  ├── lib/                                                    │
│  │   ├── admin/actions.ts    ← Fix is_suspended bug         │
│  │   ├── pairing/swiss.ts    ← Add tests                    │
│  │   └── scoring/standings.ts ← Add tests                   │
│  └── test/                   ← NEW directory                │
│      ├── setup.ts                                            │
│      └── mocks/handlers.ts                                   │
├─────────────────────────────────────────────────────────────┤
│  Configuration Files                                         │
│  ├── vitest.config.mts       ← NEW                          │
│  ├── playwright.config.ts    ← NEW                          │
│  ├── next.config.js          ← Add security headers         │
│  └── .github/workflows/ci.yml ← NEW                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Unit Test Framework | Vitest | 10-20x faster than Jest, native ESM, modern |
| E2E Framework | Playwright | Best async RSC support, multi-browser |
| Component Testing | React Testing Library | Industry standard, user-centric |
| Mocking | MSW (Mock Service Worker) | Works in browser and Node, realistic |

### New Files to Create

```
src/test/setup.ts                    # Test configuration
src/test/mocks/handlers.ts           # MSW handlers for Supabase
src/lib/pairing/swiss.test.ts        # Swiss pairing tests
src/lib/scoring/standings.test.ts    # Standings calculation tests
src/lib/admin/actions.test.ts        # Admin action tests
src/app/error.tsx                    # Root error UI
src/components/pwa/SafariInstallPrompt.tsx
vitest.config.mts
playwright.config.ts
.github/workflows/ci.yml
```

---

## 6. Success Metrics

### Primary Metrics
| Metric | Definition | Target | Timeframe |
|--------|------------|--------|-----------|
| Test Coverage (critical paths) | % of swiss.ts + standings.ts covered | >80% | Sprint end |
| CI Pass Rate | % of PRs with passing tests | 100% | Ongoing |
| Error Boundary Catches | Unhandled errors caught by boundary | 100% | Sprint end |

### Secondary Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| Security Headers Score | securityheaders.com grade | A or B |
| Safari PWA Installs | Users who add to home screen | Track baseline |

### Anti-Metrics
- Test count alone (quality > quantity)
- 100% coverage (diminishing returns beyond critical paths)

---

## 7. Out of Scope (Post-Sprint)

| Feature | Why Not Now | Potential Timeline |
|---------|-------------|-------------------|
| Sentry error tracking | Need tests first | Next sprint |
| Rate limiting | Requires Supabase edge functions | v1.1 |
| E2E test suite | Need unit tests foundation first | Next sprint |
| CSRF tokens | Complex, lower risk with RLS | v1.1 |
| Full CSP (non-report-only) | Need to audit inline scripts first | v1.1 |

---

## 8. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Should we use `status` enum or boolean `is_suspended`? | Admin action fix approach | Dev | Before implementation |
| CSP report-uri endpoint? | Where to send CSP violations | Dev | Sprint end |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests slow down dev velocity | Medium | Medium | Fast test runner (Vitest), run only changed |
| Safari prompt annoys users | Low | Low | Dismissable, only show after 2nd visit |
| CSP breaks functionality | Medium | Medium | Start in report-only mode |

---

## 10. Implementation Tasks

### Task Breakdown for Wiggum

| ID | Task | Depends On | Complexity |
|----|------|------------|------------|
| T1 | Install and configure Vitest | - | Low |
| T2 | Create test setup file and MSW handlers | T1 | Medium |
| T3 | Write swiss.ts unit tests | T2 | Medium |
| T4 | Write standings.ts unit tests | T2 | Medium |
| T5 | Fix admin actions field mismatch | - | Low |
| T6 | Write admin actions tests | T2, T5 | Low |
| T7 | Add security headers to next.config.js | - | Low |
| T8 | Create error boundary components | - | Low |
| T9 | Create Safari PWA install prompt | - | Medium |
| T10 | Create GitHub Actions CI workflow | T1 | Low |
| T11 | Install and configure Playwright | T10 | Medium |

### Suggested Execution Order
```
Phase 1 (Foundation):    T1 → T2 → T10
Phase 2 (Critical Bugs): T5 → T6
Phase 3 (Tests):         T3, T4 (parallel)
Phase 4 (Security/UX):   T7, T8, T9 (parallel)
Phase 5 (E2E Setup):     T11
```

---

## Appendix

### A. Research/Evidence
- Deep analysis: `~/.claude/plans/infinity-tournament-deep-analysis.md`
- Tournament app research: BCP reliability issues, TopDeck offline-first success
- Safari eviction: MDN Storage API documentation

### B. Code Snippets

**Security Headers (next.config.js):**
```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Content-Security-Policy-Report-Only',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
      },
    ],
  }];
}
```

**Vitest Config:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['**/*.test.{ts,tsx}'],
  },
})
```

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Ji | Initial draft from THEALGORITHM analysis |
