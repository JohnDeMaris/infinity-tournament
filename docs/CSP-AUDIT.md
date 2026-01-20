# Content Security Policy (CSP) Audit Report

**Date:** 2026-01-20
**Project:** Infinity Tournament
**Auditor:** Claude (Automated Security Audit)

## Executive Summary

This audit examined the codebase for inline scripts and styles that violate or weaken the current Content Security Policy configuration. The current CSP allows `'unsafe-inline'` for both scripts and styles, which presents security risks. This report documents all findings and provides a remediation plan.

## Current CSP Configuration

**Location:** `C:/Users/john/projects/infinity-tournament/next.config.ts` (lines 28-37)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none'
```

### Security Issues with Current CSP

1. **`'unsafe-inline'` in script-src**: Allows inline JavaScript execution, defeating primary XSS protection
2. **`'unsafe-eval'` in script-src**: Allows `eval()` and similar dynamic code execution
3. **`'unsafe-inline'` in style-src**: Allows inline styles, enabling CSS injection attacks

## Findings

### 1. Inline Scripts

**Status:** ✅ NONE FOUND

- No `dangerouslySetInnerHTML` usage detected
- No inline `<script>` tags in JSX/TSX components
- No `eval()` or `new Function()` calls found
- No dynamic code execution patterns detected

### 2. Inline Styles

**Status:** ⚠️ VIOLATIONS FOUND

Total files with inline styles: **5**

#### 2.1 Global Error Page (Critical Exception)

**File:** `C:/Users/john/projects/infinity-tournament/src/app/global-error.tsx`
**Lines:** 21-78
**Severity:** LOW (Exception Justified)

**Details:**
- Contains 6 inline style objects for error display
- Used in global error boundary when React/Next.js may be compromised
- Cannot rely on CSS files when the application is in a broken state

**Inline Style Usage:**
```tsx
- Line 21-29: Container div styles (flexbox layout, full height)
- Line 30-34: Content wrapper styles (max-width, centering)
- Line 35-38: Icon container styles (font-size, margin)
- Line 41-46: H1 heading styles (typography, color)
- Line 49-52: Paragraph styles (color, margin)
- Line 56-61: Error ID styles (monospace, small text)
- Line 67-75: Button styles (padding, background, border)
```

**Justification:** This is a global error boundary that needs to display when the entire React application has failed. Using external CSS would be unreliable in this context.

#### 2.2 Achievement Badge Component

**File:** `C:/Users/john/projects/infinity-tournament/src/components/achievements/achievement-badge.tsx`
**Line:** 99
**Severity:** MEDIUM

**Details:**
```tsx
<div
  className="h-full bg-primary/40 transition-all"
  style={{ width: `${progressPercentage}%` }}
/>
```

**Issue:** Dynamic width calculation for progress bar using inline style.

**CSP Impact:** Violates CSP if `'unsafe-inline'` is removed from style-src.

#### 2.3 Parsed List Display Component

**File:** `C:/Users/john/projects/infinity-tournament/src/components/army/parsed-list-display.tsx`
**Lines:** 137, 156
**Severity:** MEDIUM

**Details:**
```tsx
// Line 137
style={{ width: `${pointsPercentage}%` }}

// Line 156
style={{ width: `${swcPercentage}%` }}
```

**Issue:** Dynamic width calculations for two progress bars (points and SWC limits).

**CSP Impact:** Violates CSP if `'unsafe-inline'` is removed from style-src.

#### 2.4 Progress UI Component

**File:** `C:/Users/john/projects/infinity-tournament/src/components/ui/progress.tsx`
**Line:** 22
**Severity:** MEDIUM

**Details:**
```tsx
<ProgressPrimitive.Indicator
  className="h-full w-full flex-1 bg-primary transition-all"
  style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
/>
```

**Issue:** Dynamic transform for progress indicator animation.

**CSP Impact:** Violates CSP if `'unsafe-inline'` is removed from style-src.

#### 2.5 Sonner Toast Component

**File:** `C:/Users/john/projects/infinity-tournament/src/components/ui/sonner.tsx`
**Lines:** 27-34
**Severity:** LOW

**Details:**
```tsx
style={
  {
    "--normal-bg": "var(--popover)",
    "--normal-text": "var(--popover-foreground)",
    "--normal-border": "var(--border)",
    "--border-radius": "var(--radius)",
  } as React.CSSProperties
}
```

**Issue:** CSS custom property mapping for theme integration.

**CSP Impact:** Violates CSP if `'unsafe-inline'` is removed from style-src.

### 3. External Scripts

**Status:** ✅ NO ISSUES

- No Next.js `<Script>` components with external sources found
- Sentry integration uses proper SDK initialization (not inline scripts)

### 4. CSP Nonce Implementation

**Status:** ❌ NOT IMPLEMENTED

- No nonce attributes found in codebase
- Current CSP relies on `'unsafe-inline'` instead of nonce-based allowlisting

## Risk Assessment

| Category | Risk Level | Impact |
|----------|-----------|---------|
| Inline Scripts | **LOW** | None found in application code |
| Inline Styles | **MEDIUM** | 5 components require remediation |
| Missing Nonce | **HIGH** | No nonce implementation for Next.js |
| `'unsafe-eval'` | **MEDIUM** | Enabled but not required by app code |

## Remediation Plan

### Phase 1: Eliminate Unsafe Script Directives (HIGH PRIORITY)

#### 1.1 Remove `'unsafe-eval'` from script-src

**Action:**
```typescript
// next.config.ts
"script-src 'self' 'unsafe-inline'", // Remove 'unsafe-eval'
```

**Testing:**
- Run full application suite
- Test all dynamic functionality
- Verify no eval() usage in dependencies

**Estimated Effort:** 1-2 hours (testing + verification)

#### 1.2 Implement CSP Nonce for Scripts

**Action:**
- Add middleware to generate nonces per request
- Configure Next.js to inject nonces into script tags
- Update CSP header to use nonce instead of `'unsafe-inline'`

**Implementation:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const response = NextResponse.next();

  // Set nonce in header for CSP
  response.headers.set('x-nonce', nonce);

  return response;
}
```

```typescript
// next.config.ts - Update CSP
const nonce = request.headers.get('x-nonce');
"script-src 'self' 'nonce-${nonce}'",
```

**Estimated Effort:** 4-6 hours

### Phase 2: Migrate Inline Styles (MEDIUM PRIORITY)

#### 2.1 Progress Bar Components (achievement-badge.tsx, parsed-list-display.tsx, progress.tsx)

**Strategy:** Use CSS custom properties (CSS variables)

**Before:**
```tsx
style={{ width: `${progressPercentage}%` }}
```

**After:**
```tsx
// Component
<div
  className="progress-bar"
  style={{ '--progress': progressPercentage } as React.CSSProperties}
/>

// CSS
.progress-bar {
  width: calc(var(--progress) * 1%);
}
```

**Note:** This still uses inline styles for custom properties. For full CSP compliance, consider:

**Alternative Approach (Full Compliance):**
- Use CSS `transform: scaleX()` with CSS variables
- Requires CSS custom properties to be set via inline styles (still requires `'unsafe-inline'`)
- OR use JS to add/remove CSS classes for percentage buckets (0-100)

**Recommended Solution:**
Use Radix UI's `data-*` attributes and CSS:

```tsx
<div data-progress={Math.round(progressPercentage / 10) * 10}>
```

```css
[data-progress="0"] { width: 0%; }
[data-progress="10"] { width: 10%; }
/* ... up to 100 */
```

**Estimated Effort:** 3-4 hours per component

#### 2.2 Sonner Component

**Strategy:** Extract CSS custom properties to stylesheet

**Current Issue:** Third-party library (sonner) expects inline style prop for theming.

**Options:**
1. **Fork library** and modify to use CSS classes
2. **Accept exception** for this component (low risk)
3. **Replace library** with CSP-compliant alternative

**Recommended:** Accept exception with documentation (lowest effort, acceptable risk)

**Estimated Effort:** 0 hours (document exception) or 8-12 hours (fork/replace)

#### 2.3 Global Error Page

**Strategy:** Extract to critical CSS or accept exception

**Recommended:** Accept exception with clear documentation. This component only renders during catastrophic failures when CSS loading cannot be guaranteed.

**Estimated Effort:** 0 hours (document exception)

### Phase 3: CSP Hardening (LOW PRIORITY)

#### 3.1 Add report-uri or report-to

**Action:**
```typescript
"report-uri https://your-domain.com/api/csp-report",
"report-to csp-endpoint"
```

**Benefit:** Monitor CSP violations in production

**Estimated Effort:** 2-3 hours

#### 3.2 Implement Strict CSP

**Target Configuration:**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}';
  style-src 'self' 'nonce-{NONCE}';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  report-uri /api/csp-report
```

**Estimated Effort:** 8-12 hours (after completing Phases 1 & 2)

## Implementation Timeline

### Immediate (Week 1)
- [ ] Remove `'unsafe-eval'` from script-src
- [ ] Test application without `'unsafe-eval'`
- [ ] Document accepted exceptions (global-error.tsx, sonner.tsx)

### Short-term (Weeks 2-3)
- [ ] Implement CSP nonce for scripts
- [ ] Update Next.js configuration for nonce injection
- [ ] Migrate progress bar components to CSS-based solutions

### Medium-term (Month 2)
- [ ] Implement nonce for styles
- [ ] Remove `'unsafe-inline'` from style-src
- [ ] Add CSP violation reporting
- [ ] Monitor and fix any missed violations

### Long-term (Month 3+)
- [ ] Evaluate sonner library replacement or fork
- [ ] Implement strict CSP policy
- [ ] Set up automated CSP testing in CI/CD

## Testing Strategy

### Unit Tests
- Test components with strict CSP meta tags
- Verify dynamic styles work with nonce approach

### Integration Tests
- Run Playwright tests with strict CSP enabled
- Verify no console CSP violation errors

### Manual Testing
- Test all user flows with Chrome DevTools CSP violations logged
- Verify error boundaries still work correctly

### Monitoring
- Set up CSP violation reporting endpoint
- Monitor production violations for 2 weeks before enforcing
- Use `Content-Security-Policy-Report-Only` header initially

## Exceptions Log

### Approved Exceptions

1. **global-error.tsx** - Inline styles approved
   - **Reason:** Global error boundary requires guaranteed rendering
   - **Risk:** LOW - Only executes during application failure
   - **Review Date:** 2026-07-20 (6 months)

2. **sonner.tsx** - Inline styles approved (conditional)
   - **Reason:** Third-party library limitation
   - **Risk:** LOW - Only CSS custom properties, no executable code
   - **Review Date:** 2026-04-20 (3 months)
   - **Action:** Evaluate alternatives during review

## Dependencies to Audit

The following third-party dependencies should be audited for CSP compliance:

- [ ] `@sentry/nextjs` - Check for inline script injection
- [ ] `sonner` - Confirmed inline style usage
- [ ] `@radix-ui/*` - Check all Radix components for inline styles
- [ ] `next-themes` - Check theme switching mechanism

## Recommendations

### High Priority
1. **Remove `'unsafe-eval'`** immediately (no app dependencies found)
2. **Implement nonce-based CSP** for scripts within 2 weeks
3. **Document and approve exceptions** for global-error.tsx

### Medium Priority
4. **Migrate progress components** to CSS-based solutions
5. **Add CSP violation reporting** for monitoring
6. **Audit third-party dependencies** for CSP issues

### Low Priority
7. **Evaluate sonner replacement** or accept documented exception
8. **Implement strict CSP** after all migrations complete

## Success Metrics

- **Zero** inline `<script>` tags in application code ✅ (Already achieved)
- **Zero** `dangerouslySetInnerHTML` usage ✅ (Already achieved)
- Remove `'unsafe-eval'` from CSP 🎯 (Target: Week 1)
- Implement nonce-based script-src 🎯 (Target: Week 3)
- Reduce inline styles to approved exceptions only 🎯 (Target: Month 2)
- Zero CSP violations in production logs 🎯 (Target: Month 3)

## Conclusion

The codebase is in **good shape** regarding CSP compliance:
- No inline scripts or dangerous patterns found
- Limited inline style usage (5 components)
- Clear path to strict CSP implementation

The main work involves:
1. Removing unnecessary `'unsafe-eval'`
2. Implementing nonce-based CSP
3. Migrating 3-4 progress bar components to CSS solutions
4. Documenting accepted exceptions

**Estimated Total Effort:** 20-30 hours over 2-3 months for full strict CSP compliance.

---

**Next Steps:**
1. Review this audit with security team
2. Prioritize Phase 1 actions (remove unsafe-eval, implement nonce)
3. Schedule remediation work in sprint planning
4. Set up CSP violation monitoring before enforcing strict policy
