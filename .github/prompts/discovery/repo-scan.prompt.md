# Repo Scan

> **Category:** Discovery
> **File:** `discovery/repo-scan.prompt.md`

---

## Purpose

Perform a comprehensive scan of the repository to understand its current state, structure, technology stack, health, and areas needing attention.

## When to Use

- First contact with an unfamiliar repo
- Before planning any significant work
- When the Chief of Staff needs to route a request
- Periodic health checks

## Inputs Required

- Repository root (workspace context)
- Access to file system

## Outputs Required

Produce a structured report containing:

1. **Tech Stack Summary**
   - Framework, language, runtime versions
   - Key dependencies and their purposes
   - Dev tooling (linters, formatters, test framework)

2. **Architecture Overview**
   - Directory structure analysis
   - Component organization pattern
   - State management approach
   - API route structure
   - Data flow (client ↔ server ↔ external)

3. **Health Assessment**
   - CI/CD status and quality gates
   - Test coverage (if measurable)
   - Dependency freshness (outdated?)
   - Security posture (secrets scanning, dependency scanning)
   - Documentation completeness

4. **Risk Inventory**
   - Technical debt areas
   - Missing tests
   - Stale documentation
   - Potential security concerns
   - Performance concerns

5. **Recommended Next Actions** (prioritized)

## Quality Expectations

- Every claim backed by file evidence (path + line reference)
- No speculation — only report what is observed
- Prioritize findings by impact
- Use consistent severity ratings: Critical, High, Medium, Low

## Failure Cases

- Repository is empty → Report as empty, suggest initialization
- Cannot access files → Report access error, suggest permissions
- Monorepo → Scan each package, report individual and aggregate

## Evidence Expectations

- File paths for every finding
- Package.json dependency analysis
- Config file review (tsconfig, eslint, etc.)
- CI workflow analysis
- Test file inventory

## Example Output

```markdown
## Repo Scan: <REPOSITORY_NAME>

### Tech Stack

- **Framework:** <WEB_FRAMEWORK> 16.1.6 (App Router)
- **Language:** TypeScript 5.6 (strict mode)
- **UI:** React 19.2 + Tailwind CSS 3.4
- **State:** Zustand 4.5
- **Backend:** <PAYMENT_PROVIDER> API (SDK v44)
- **Testing:** Jest 29 + React Testing Library
- **Deployment:** <DEPLOYMENT_PLATFORM>

### Architecture

- App Router with colocated routes
- Component-based UI organization
- Zustand stores for client state
- <PAYMENT_PROVIDER> SDK for backend integration

### Health: 7/10

- ✅ CI pipeline (lint, format, typecheck, test, build)
- ✅ TypeScript strict mode
- ⚠️ Test coverage: 65% (target: 80%)
- ⚠️ 3 dependencies outdated
- ❌ No E2E tests

### Top 3 Actions

1. Increase test coverage to 80%
2. Add E2E tests for checkout flow
3. Update outdated dependencies
```

