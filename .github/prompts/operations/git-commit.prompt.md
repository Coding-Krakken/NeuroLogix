# Prompt: Git Commit

**Category:** operations  
**Purpose:** Guide agents to commit code changes properly  
**Complexity:** Simple  
**Expected Duration:** 2-5 minutes

---

## Objective

Commit code changes to git with proper conventional commit messages, ensuring all quality gates pass before committing.

---

## Context

You are an AI agent in a 27-agent engineering organization. Your team uses strict git workflows with conventional commits and quality gates. Every commit must:

- Pass local quality gates (lint, typecheck, test)
- Use conventional commit message format
- Reference the GitHub issue number
- Include only related files (≤5 files per commit)

---

## Input

Provide:

1. **Files to commit** (absolute paths)
2. **Commit type** (feat, fix, refactor, docs, test, chore, security, perf)
3. **Scope** (seo, cart, checkout, payment, api, ui, etc.)
4. **Subject** (≤72 chars, imperative mood)
5. **Body** (optional, detailed explanation)
6. **Issue number** (e.g., #42)

---

## Execution Steps

### Step 0: Git Context Preflight (MANDATORY)

Capture current repository state before making or committing changes:

```powershell
git branch --show-current
git status --short
git log -1 --oneline
```

Include this snapshot in your work notes or issue comment.

### Step 1: Pre-Commit Quality Gates

Run these commands and ensure they ALL pass:

```powershell
# Hook-equivalent local gate (fast mode)
npm run hook:precommit

# Optional strict CI-parity gate
npm run hook:precommit:ci
```

**If any fail:** Fix issues before proceeding.

---

### Step 2: Stage Files

Stage ONLY the files you changed for this specific task:

```powershell
git add <file1> <file2> <file3>

# Example:
git add src/lib/seo/metadata.ts src/lib/seo/__tests__/metadata.test.ts
```

**Verify staged files:**

```powershell
git status
```

---

### Step 3: Craft Commit Message

**Format:**

```
<type>(<scope>): <subject>

<body (optional)>

<footer>
```

**Example 1: Feature commit**

```
feat(seo): enforce INV-SEO-1 metadata length constraints

- Title truncated to ≤60 chars
- Description truncated to ≤160 chars
- Added unit tests for edge cases

Tests: 13 passing
Coverage: metadata.ts 100%

Issue #42
```

**Example 2: Fix commit**

```
fix(cart): prevent duplicate items in cart state

Resolves race condition when user double-clicks "Add to Cart" button.
Added debounce logic to addToCart mutation.

Fixes #123
```

**Example 3: Test commit**

```
test(sitemap): add coverage for INV-SEO-3 validation

Ensures sitemap includes all 481 active products.

Issue #42
```

---

### Step 4: Commit

### Step 3.5: Pre-Push Gate (Before `git push`)

Run the CI-like pre-push gate:

```powershell
npm run hook:prepush
```

Optional strict mode:

```powershell
npm run hook:prepush:ci
```

---

### Step 4: Commit

**Short message (≤72 chars total):**

```powershell
git commit -m "feat(seo): enforce INV-SEO-1 metadata constraints"
```

**Multi-line message:**

```powershell
git commit -m "feat(seo): enforce INV-SEO-1 metadata constraints" -m "- Title ≤60 chars
- Description ≤160 chars
- Added unit tests

Tests: 13 passing
Coverage: metadata.ts 100%

Issue #42"
```

---

### Step 5: Push to Remote

```powershell
git push origin <branch-name>

# Example:
git push origin feature/42-seo-foundation

# Verify clean checkpoint state
git status --short
```

---

### Step 6: Update GitHub Issue

After successful push, add a comment to the GitHub issue:

```powershell
gh issue comment 42 --body "Committed metadata helpers (feat: enforce INV-SEO-1). Tests passing."

# Preferred detailed format:
gh issue comment 42 --body "Checkpoint update:\n\n- Branch: feature/42-seo-foundation\n- Commit: <short-sha>\n- Scope: metadata helpers\n- Checks: lint ✅, typecheck ✅, test ✅\n- Git status: clean\n- Next: proceed to next slice"
```

---

## Commit Types Reference

| Type       | Usage                                   | Example                                   |
| ---------- | --------------------------------------- | ----------------------------------------- |
| `feat`     | New feature or enhancement              | `feat(seo): add BreadcrumbList schema`    |
| `fix`      | Bug fix                                 | `fix(cart): prevent duplicate items`      |
| `refactor` | Code restructuring (no behavior change) | `refactor(payment): extract validation`   |
| `docs`     | Documentation changes                   | `docs(readme): update setup instructions` |
| `test`     | Adding or updating tests                | `test(checkout): add e2e test for flow`   |
| `chore`    | Maintenance (deps, config, etc.)        | `chore(deps): update Next.js to 16.1.7`   |
| `security` | Security improvements/fixes             | `security(auth): sanitize user input`     |
| `perf`     | Performance improvements                | `perf(api): cache product catalog`        |
| `style`    | Formatting only (no code change)        | `style(cart): format with Prettier`       |

---

## Common Scopes

- `seo` — SEO-related (metadata, sitemap, robots)
- `cart` — Shopping cart
- `checkout` — Checkout flow
- `payment` — Payment processing
- `api` — API routes
- `ui` — UI components
- `store` — State management (Zustand)
- `square` — Square API integration
- `test` — Test infrastructure
- `deps` — Dependencies
- `config` — Configuration files

---

## Validation Checklist

**Before committing:**

- [ ] All quality gates pass (lint, format, typecheck, test)
- [ ] Only related files staged (≤5 files)
- [ ] Commit message follows conventional format
- [ ] Commit message references issue number
- [ ] Subject line ≤72 chars
- [ ] Subject uses imperative mood ("add" not "added")
- [ ] Git context preflight captured (`branch`, `status`, `head`)

**After committing:**

- [ ] Pushed to remote branch
- [ ] GitHub issue commented with update
- [ ] Post-push `git status --short` recorded
- [ ] No secrets committed (.env, tokens, keys)

---

## Anti-Patterns (DO NOT DO)

### ❌ Committing without running quality gates

```powershell
git add .
git commit -m "quick fix"
# BAD: No quality gates run, might commit broken code
```

### ❌ Vague commit messages

```powershell
git commit -m "updates"
git commit -m "misc changes"
git commit -m "fix"
# BAD: No context, no traceability
```

### ❌ Committing unrelated files together

```powershell
git add src/lib/seo/metadata.ts src/app/api/checkout/route.ts
git commit -m "various updates"
# BAD: SEO and checkout are unrelated, should be separate commits
```

### ❌ Committing work-in-progress

```powershell
git commit -m "WIP: halfway done"
# BAD: Breaks build for other developers
```

---

## Output

Provide:

1. **Commit SHA** (first 7 chars)
2. **Commit message** (full text)
3. **Files committed** (list)
4. **Quality gate results** (pass/fail)
5. **Next steps** (e.g., "Pushed to remote, ready for QA review")

**Example Output:**

```
✅ Commit successful

SHA: a3f2c91
Branch: feature/42-seo-foundation

Commit message:
feat(seo): enforce INV-SEO-1 metadata constraints
- Title ≤60 chars
- Description ≤160 chars
Tests: 13 passing
Issue #42

Files committed:
- src/lib/seo/metadata.ts (+45, -12)
- src/lib/seo/__tests__/metadata.test.ts (+67, -5)

Quality gates:
✅ Lint: PASS
✅ Format: PASS
✅ Typecheck: PASS
✅ Tests: PASS (13/13)

Next steps:
✅ Pushed to origin/feature/42-seo-foundation
✅ Issue #42 updated
⏭️  Ready for handoff to backend-engineer
```

---

## Related Prompts

- [branch-strategy.prompt.md](branch-strategy.prompt.md) — Creating and managing branches
- [create-pr.prompt.md](create-pr.prompt.md) — Creating pull requests
- [manage-issue.prompt.md](manage-issue.prompt.md) — Managing GitHub issues

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-25  
**Owner:** operations (git workflows)
