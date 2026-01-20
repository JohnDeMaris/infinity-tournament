# Infinity Tournament Manager - CI/CD, PWA & E2E Testing Sprint

**Version:** 1.0
**Created:** 2026-01-20
**Last Updated:** 2026-01-20
**Author:** Ji (PRDWriter from Stability Sprint continuation)
**Status:** Draft - Ready for Implementation

---

## 1. Problem Statement

### The Problem
The Infinity Tournament Manager now has unit test coverage (36 tests for critical algorithms), but lacks:
1. **Automated CI pipeline** - Tests don't run automatically on PRs
2. **Safari data persistence** - Safari users lose IndexedDB data after 7 days without PWA install
3. **End-to-end testing** - No browser-based tests verify actual user flows

### Current State
- Unit tests exist but must be run manually
- Safari/iOS users can lose offline tournament data unexpectedly
- No E2E tests to catch integration issues between components
- Code can be merged without running tests

### Opportunity
Completing these P1/P2 items establishes professional CI/CD practices, protects Safari users' data, and creates a foundation for comprehensive E2E testing.

---

## 2. Target User

### Primary User: Developers
**Goals:** Confident deployments, automated quality gates
**Pain Points:** Manual test running, no PR checks

### Secondary User: Safari/iOS Players
**Goals:** Reliable offline data persistence
**Pain Points:** 7-day IndexedDB eviction loses tournament data

### Secondary User: Tournament Organizers
**Goals:** Reliable app behavior at events
**Pain Points:** Untested edge cases could surface during live events

---

## 3. Core Features (MVP Sprint)

### Feature 1: GitHub Actions CI Workflow
**Description:** Automated CI pipeline that runs on every PR and push to main
**User Value:** Prevents broken code from being merged, ensures tests always pass
**Acceptance Criteria:**
- [ ] Workflow triggers on push to main and all PRs
- [ ] Installs dependencies with pnpm
- [ ] Runs lint check (eslint)
- [ ] Runs TypeScript type check (tsc --noEmit)
- [ ] Runs unit tests (vitest)
- [ ] Runs production build (next build)
- [ ] Fails PR if any step fails
- [ ] Caches node_modules for faster runs

### Feature 2: Safari PWA Install Prompt
**Description:** Non-intrusive prompt for Safari users to install PWA, preventing 7-day IndexedDB eviction
**User Value:** Prevents surprise data loss for iOS/Safari users
**Acceptance Criteria:**
- [ ] Detect Safari/iOS users not in standalone PWA mode
- [ ] Show install prompt after 2nd visit (not first - too aggressive)
- [ ] Include clear "Add to Home Screen" instructions with iOS steps
- [ ] Prompt is dismissable with X button
- [ ] Dismissed state persists for 30 days (cookie/localStorage)
- [ ] Prompt appears as non-modal banner (doesn't block app use)
- [ ] Prompt doesn't show for non-Safari browsers
- [ ] Prompt doesn't show if already installed as PWA

### Feature 3: Playwright E2E Testing Setup
**Description:** End-to-end testing framework for browser-based testing
**User Value:** Catches integration issues, ensures real user flows work
**Acceptance Criteria:**
- [ ] Playwright installed and configured
- [ ] Config points to local dev server (localhost:3000)
- [ ] Example test verifies homepage loads
- [ ] Example test verifies navigation works
- [ ] Tests run in CI workflow (separate job)
- [ ] Screenshots on failure for debugging
- [ ] Multiple browser support configured (chromium, webkit)

---

## 4. User Stories

### Epic: Continuous Integration

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-001 | As a developer, I want tests to run automatically on my PR, so that I catch issues before merge | P1 | Core CI |
| US-002 | As a developer, I want the build to be verified on every PR, so that I know my changes compile | P1 | Build check |
| US-003 | As a developer, I want CI to cache dependencies, so that pipelines run faster | P2 | Performance |
| US-004 | As a reviewer, I want to see CI status on PRs, so that I know if code is safe to merge | P1 | Visibility |

### Epic: Safari PWA Prompt

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-005 | As a Safari user, I want to be prompted to install the PWA, so that my offline data persists | P1 | Data safety |
| US-006 | As a user, I want to dismiss the prompt without being annoyed, so that I can use the app | P1 | UX |
| US-007 | As a returning user who dismissed the prompt, I don't want to see it again for a month | P2 | UX |

### Epic: E2E Testing

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| US-008 | As a developer, I want E2E tests to verify critical flows, so that integration issues are caught | P2 | Foundation |
| US-009 | As a developer, I want screenshots on test failure, so that I can debug issues | P2 | DX |

---

## 5. Technical Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                         │
├─────────────────────────────────────────────────────────────┤
│  Trigger: push/PR to main                                    │
│  ├── Job: lint-and-test                                      │
│  │   ├── pnpm install (cached)                               │
│  │   ├── pnpm lint                                           │
│  │   ├── pnpm tsc --noEmit                                   │
│  │   ├── pnpm test:run                                       │
│  │   └── pnpm build                                          │
│  └── Job: e2e (needs: lint-and-test)                         │
│      ├── Start dev server                                    │
│      └── Run Playwright tests                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PWA Install Prompt                        │
├─────────────────────────────────────────────────────────────┤
│  src/components/pwa/                                         │
│  ├── SafariInstallPrompt.tsx    ← Prompt UI component       │
│  └── use-pwa-status.ts          ← Detection hook            │
│                                                              │
│  Detection Logic:                                            │
│  1. Check if Safari (navigator.userAgent)                    │
│  2. Check if iOS (navigator.platform)                        │
│  3. Check if NOT standalone (display-mode media query)       │
│  4. Check visit count (localStorage)                         │
│  5. Check dismissed state (localStorage with expiry)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Playwright E2E                            │
├─────────────────────────────────────────────────────────────┤
│  playwright.config.ts           ← Configuration              │
│  e2e/                                                        │
│  ├── home.spec.ts              ← Homepage tests              │
│  └── navigation.spec.ts        ← Navigation tests            │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CI Platform | GitHub Actions | Native to GitHub, free for public repos, excellent caching |
| E2E Framework | Playwright | Best async RSC support, multi-browser, excellent DX |
| PWA Detection | Media query + UA | display-mode: standalone is reliable, UA for Safari detection |
| Persistence | localStorage | Simple, no cookies needed, works offline |

### New Files to Create

```
.github/workflows/ci.yml              # CI workflow
src/components/pwa/SafariInstallPrompt.tsx
src/components/pwa/index.ts
src/hooks/use-pwa-status.ts
playwright.config.ts
e2e/home.spec.ts
e2e/navigation.spec.ts
```

---

## 6. Success Metrics

### Primary Metrics
| Metric | Definition | Target | Timeframe |
|--------|------------|--------|-----------|
| CI Pass Rate | % of PRs where CI passes first time | >90% | Ongoing |
| CI Duration | Time from push to completion | <5 min | Sprint end |
| Safari Install Rate | % of Safari users who install PWA | Track baseline | Ongoing |

### Secondary Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| E2E Coverage | Number of critical flows covered | 3+ flows |
| Prompt Dismissal Rate | % who dismiss vs install | Track |

### Anti-Metrics
- E2E test count alone (quality > quantity)
- PWA install pressure (don't annoy users)

---

## 7. Out of Scope (Post-Sprint)

| Feature | Why Not Now | Potential Timeline |
|---------|-------------|-------------------|
| Full E2E test suite | Foundation first | Next sprint |
| Android PWA prompt | iOS/Safari is critical path | v1.1 |
| Deploy previews | Need CI foundation first | Next sprint |
| Coverage reporting | Have tests first | Next sprint |
| Performance testing | Feature complete first | v1.1 |

---

## 8. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Should E2E tests run against preview deploys? | CI complexity | Dev | Post-sprint |
| PWA prompt copy - what messaging works best? | UX | Dev | Implementation |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CI too slow | Medium | Medium | Use pnpm caching, parallel jobs |
| Safari detection breaks | Low | Medium | Feature detect, not UA-only |
| E2E tests flaky | Medium | Low | Start with simple tests, add waits |
| Prompt annoys users | Medium | Medium | Respect dismissal, 30-day expiry |

---

## 10. Implementation Tasks

### Task Breakdown for Wiggum

| ID | Task | Depends On | Complexity | Priority |
|----|------|------------|------------|----------|
| T1 | Create GitHub Actions CI workflow | - | Low | P1 |
| T2 | Create Safari/iOS detection hook | - | Low | P1 |
| T3 | Create SafariInstallPrompt component | T2 | Medium | P1 |
| T4 | Integrate prompt into app layout | T3 | Low | P1 |
| T5 | Install and configure Playwright | - | Medium | P2 |
| T6 | Write homepage E2E test | T5 | Low | P2 |
| T7 | Write navigation E2E test | T5 | Low | P2 |
| T8 | Add E2E job to CI workflow | T1, T5 | Low | P2 |

### Suggested Execution Order
```
Phase 1 (CI Foundation):     T1
Phase 2 (PWA Prompt):        T2 → T3 → T4
Phase 3 (E2E Foundation):    T5 → T6, T7 (parallel)
Phase 4 (Integration):       T8
```

---

## Appendix

### A. Safari PWA Detection Logic

```typescript
// Pseudo-code for detection
function shouldShowPrompt(): boolean {
  // Must be Safari on iOS
  const isSafari = /Safari/.test(navigator.userAgent) &&
                   !/Chrome/.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.platform);

  // Must NOT be in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;

  // Must be 2nd+ visit
  const visitCount = parseInt(localStorage.getItem('pwa-visits') || '0');

  // Must not be dismissed recently
  const dismissedAt = localStorage.getItem('pwa-dismissed');
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentlyDismissed = dismissedAt && parseInt(dismissedAt) > thirtyDaysAgo;

  return isSafari && isIOS && !isStandalone && visitCount >= 2 && !recentlyDismissed;
}
```

### B. CI Workflow Structure

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm exec tsc --noEmit
      - run: pnpm test:run
      - run: pnpm build

  e2e:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
```

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Ji | Initial draft from Phase 10 continuation |
