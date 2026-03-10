# Performance Audit

> **Category:** Optimization
> **File:** `optimization/performance-audit.prompt.md`

---

## Purpose

Conduct a comprehensive performance audit of the application. Measure Core Web Vitals, analyze bundle sizes, identify rendering bottlenecks, and produce optimization recommendations.

## When to Use

- Periodic performance review
- After major feature additions
- Before production deployment
- When users report slowness
- When Lighthouse scores drop

## Inputs Required

- Application URL (or local build)
- Performance budgets
- Current Lighthouse scores (if known)
- Previous audit results (for comparison)

## Outputs Required

```markdown
## Performance Audit Report

### Core Web Vitals

| Metric  | Value | Budget | Status |
| ------- | ----- | ------ | ------ |
| LCP     | X.Xs  | <1.2s  | ✅/❌  |
| FID/INP | Xms   | <10ms  | ✅/❌  |
| CLS     | X.XX  | <0.05  | ✅/❌  |

### Lighthouse Scores

| Category       | Score | Target | Status |
| -------------- | ----- | ------ | ------ |
| Performance    | XX    | ≥90    | ✅/❌  |
| Accessibility  | XX    | ≥95    | ✅/❌  |
| Best Practices | XX    | ≥90    | ✅/❌  |
| SEO            | XX    | ≥95    | ✅/❌  |

### Bundle Analysis

| Route      | JS Size | Budget | Status |
| ---------- | ------- | ------ | ------ |
| First Load | XXkB    | <100kB | ✅/❌  |
| /products  | XXkB    | <50kB  | ✅/❌  |

### Rendering Analysis

- Server Components: X% of components
- Client Components: X% (list reasons)
- Hydration time: Xms

### Top Optimization Opportunities

1. [Optimization with expected impact]
2. [Optimization with expected impact]
3. [Optimization with expected impact]

### Images

- Optimized: X/Y
- Using next/image: X/Y
- Missing alt text: X
- Oversized: X

### Caching

- Static pages: X
- ISR pages: X (revalidation intervals)
- Dynamic pages: X (should any be static?)
```

## Quality Expectations

- All metrics measured (not estimated)
- Compared against budgets
- Optimization recommendations have expected impact
- Issues prioritized by user impact
- Before/after comparison (if optimization applied)

## Failure Cases

- Cannot run Lighthouse → Use browser DevTools Performance tab
- No baseline → Establish baseline now, compare on next audit
- Metrics vary between runs → Run 3 times, report median

## Evidence Expectations

- Lighthouse report
- Bundle analysis output
- Network waterfall analysis
- Component render profiling
