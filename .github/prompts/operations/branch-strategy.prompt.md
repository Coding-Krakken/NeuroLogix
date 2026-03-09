# Prompt: Branch Strategy

**Category:** operations  
**Purpose:** Guide agents to create, manage, and merge feature branches
properly  
**Complexity:** Medium  
**Expected Duration:** 5-10 minutes

---

## Objective

Create and manage feature branches for isolated development work following
strict naming conventions and merge protocols.

**Authority:**

- **Tech Lead** creates feature branches for epics/features
- **Solution Architect** creates branches for model-only changes
- **Engineers** work within assigned feature branches (cannot create)

---

## Context

You are operating in the Core-3 model (with specialist escalation) using Git
Flow with these branches:

- `main` — Production-ready code (protected)
- `feature/*` — New features/epics
- `fix/*` — Bug fixes
- `refactor/*` — Code restructuring
- `docs/*` — Documentation updates
- `chore/*` — Maintenance tasks
- `hotfix/*` — Emergency production fixes

---

## Branch Naming Convention

### Format

```
<type>/<issue-number>-<short-description>
```

**Components:**

- `<type>` — Branch type (feature, fix, refactor, docs, chore, hotfix)
- `<issue-number>` — GitHub issue number (e.g., 42)
- `<short-description>` — Kebab-case description (3-5 words)

### Examples

```
feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
fix/123-cart-duplicate-items
refactor/456-payment-handler
docs/789-runbook-update
chore/101-dependency-updates
hotfix/999-checkout-critical-bug
```

---

## Creating Branches

### Step 1: Verify GitHub Issue Exists

Before creating a branch, ensure the GitHub issue is created:

```powershell
gh issue view <issue-number>

# Example:
gh issue view 42
```

If issue doesn't exist, create it first (see
[manage-issue.prompt.md](manage-issue.prompt.md)).

---

### Step 2: Pull Latest from Main

```powershell
git checkout main
git pull origin main
```

**Verify you're on latest:**

```powershell
git log --oneline -n 5
```

---

### Step 3: Create Feature Branch

**Command:**

```powershell
git checkout -b <type>/<issue-number>-<description>

# Example: Feature branch for E009 SEO Foundation
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Example: Bug fix branch
git checkout -b fix/123-cart-duplicate-items

# Example: Refactor branch
git checkout -b refactor/456-payment-handler
```

---

### Step 4: Push Branch to Remote

```powershell
git push origin <branch-name>

# Example:
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Step 5: Update GitHub Issue

Link the branch to the issue:

```powershell
gh issue comment <issue-number> --body "Feature branch created: \`<branch-name>\`

Work starting. Assigned agents will commit to this branch."

# Example:
gh issue comment 42 --body "Feature branch created: \`feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>\`

Work starting. Assigned agents will commit to this branch."
```

---

## Working in Feature Branches

### Switch to Feature Branch

```powershell
git checkout <branch-name>

# Example:
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Verify Current Branch

```powershell
git branch --show-current

# Output:
feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Pull Latest Changes from Feature Branch

**Before starting work each session:**

```powershell
git pull origin <branch-name>

# Example:
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Commit Work to Feature Branch

See [git-commit.prompt.md](git-commit.prompt.md) for commit workflow.

**Short version:**

```powershell
git add <files>
git commit -m "<type>(<scope>): <message>"
git push origin <branch-name>
```

---

## Keeping Branch Up-to-Date

### Merge Main into Feature Branch (If Main Advances)

**When to do this:**

- Main branch has new commits since you created your feature branch
- You need latest changes from main
- Before creating PR

**Steps:**

```powershell
# Switch to your feature branch
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Pull latest from main
git fetch origin main

# Merge main into your feature branch
git merge origin/main

# Resolve conflicts if any (see "Resolving Conflicts" section)

# Push updated branch
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Rebase Feature Branch onto Main (Advanced)

**When to use:**

- You want a linear commit history
- Your feature branch has conflicts with main
- Before creating PR (cleaner history)

**Steps:**

```powershell
# Switch to your feature branch
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Rebase onto main
git pull origin main --rebase

# Resolve conflicts if any

# Force push (rewrites history)
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> --force-with-lease
```

**⚠️ Caution:** `--force-with-lease` rewrites history. Only use if you're the
sole contributor to the branch.

---

## Resolving Merge Conflicts

### Step 1: Identify Conflicts

After `git merge` or `git rebase`, git will report conflicts:

```
Auto-merging src/lib/seo/metadata.ts
CONFLICT (content): Merge conflict in src/lib/seo/metadata.ts
Automatic merge failed; fix conflicts and then commit the result.
```

---

### Step 2: View Conflicted Files

```powershell
git status

# Output:
Unmerged paths:
  both modified:   src/lib/seo/metadata.ts
```

---

### Step 3: Open File and Resolve

Conflicts look like this:

```typescript
// Changes from main
export function generateTitle(text: string, maxLength = 60): string {
  return text.slice(0, maxLength);
}
```

**Resolve:**

1. Choose one version OR combine both
2. Delete conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Save file

**Resolved:**

```typescript
export function generateTitle(text: string, maxLength = 60): string {
  return text.slice(0, maxLength); // Kept main's version with default param
}
```

---

### Step 4: Mark as Resolved

```powershell
git add src/lib/seo/metadata.ts
```

---

### Step 5: Complete Merge/Rebase

**For merge:**

```powershell
git commit  # Git will create a merge commit
```

**For rebase:**

```powershell
git rebase --continue
```

---

### Step 6: Push

```powershell
git push origin <branch-name>

# If rebased, use force push:
git push origin <branch-name> --force-with-lease
```

---

## Deleting Branches

### Delete Local Branch (After PR Merge)

```powershell
git checkout main
git branch -d <branch-name>

# Example:
git branch -d feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

**Force delete (if not merged):**

```powershell
git branch -D <branch-name>
```

---

### Delete Remote Branch

```powershell
git push origin --delete <branch-name>

# Example:
git push origin --delete feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

**Note:** GitHub auto-deletes remote branch when PR is merged with
`--delete-branch` flag.

---

## Branch Protection Rules

### Main Branch (Protected)

**Rules:**

- ❌ Cannot push directly to `main`
- ✅ Must use Pull Request
- ✅ Requires 2 approvals:
  1. Quality Director (mandatory)
  2. Chief of Staff OR Tech Lead OR Security Engineer
- ✅ All CI checks must pass
- ✅ No merge conflicts
- ✅ Branch must be up-to-date with `main`

**Who can merge to main:**

- Chief of Staff
- Quality Director (via PR approval)

---

### Feature Branches (Unprotected)

**Rules:**

- ✅ Assigned agents can push directly
- ✅ No PR required for inter-agent commits
- ✅ Latest changes should be pulled before pushing

---

## Branch Lifecycle

```
Issue Created (#42)
    ↓
Tech Lead creates feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
    ↓
Engineers commit to feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
    ↓
Quality Director validates all quality gates
    ↓
Quality Director creates PR (feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> → main)
    ↓
Chief of Staff approves PR
    ↓
PR merged to main
    ↓
feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> deleted
    ↓
Issue #<WORK_ITEM_ID> closed
```

---

## Common Workflows

### Workflow 1: Solo Agent Work

**Scenario:** Single agent implements a feature

```powershell
# Tech Lead creates branch
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Agent implements
git add src/lib/seo/metadata.ts
git commit -m "feat(seo): add metadata helpers"
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Quality Director creates PR after validation
gh pr create --base main --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Workflow 2: Multi-Agent Collaboration

**Scenario:** Frontend + Backend engineers collaborate

```powershell
# Tech Lead creates shared branch
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Frontend engineer commits S1, S2
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull  # Get latest
git add src/lib/seo/
git commit -m "feat(seo): add metadata and structured data helpers (S1, S2)"
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Backend engineer commits S3, S4
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull  # Get frontend's changes
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): update sitemap and robots (S3, S4)"
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Quality Director creates PR after both complete
gh pr create --base main --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Workflow 3: Hotfix (Emergency)

**Scenario:** Critical production bug

```powershell
# Chief of Staff creates hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/999-checkout-critical-bug
git push origin hotfix/999-checkout-critical-bug

# Engineer fixes immediately
git add src/app/api/checkout/route.ts
git commit -m "hotfix(checkout): fix payment processing error"
git push origin hotfix/999-checkout-critical-bug

# Quality Director fast-tracks PR (skip some gates if approved)
gh pr create --base main --head hotfix/999-checkout-critical-bug --label "hotfix,p0"

# Chief of Staff approves and merges immediately
gh pr merge --squash --delete-branch
```

---

## Validation Checklist

**Before creating a branch:**

- [ ] GitHub issue exists and assigned
- [ ] On latest `main` branch (`git pull origin main`)
- [ ] Branch name follows convention (`<type>/<issue>-<desc>`)

**While working in branch:**

- [ ] Pull latest before each work session
- [ ] Commit frequently (after each meaningful unit)
- [ ] Push to remote daily (minimum)
- [ ] Run quality gates before pushing

**Before creating PR:**

- [ ] All commits pushed to remote
- [ ] Branch up-to-date with `main` (merge or rebase)
- [ ] No merge conflicts
- [ ] All quality gates pass
- [ ] Handoff comments posted with URL references

---

## Troubleshooting

### Problem: Forgot which branch I'm on

```powershell
git branch --show-current
```

---

### Problem: Accidentally committed to wrong branch

**If not pushed yet:**

```powershell
# Undo last commit but keep changes
git reset --soft HEAD~1

# Switch to correct branch
git checkout <correct-branch>

# Re-commit
git add <files>
git commit -m "<message>"
```

---

### Problem: Accidentally committed to `main`

**If not pushed:**

```powershell
# Undo commit
git reset --soft HEAD~1

# Create feature branch from current state
git checkout -b feature/<issue>-<desc>

# Re-commit
git commit -m "<message>"

# Reset main to remote state
git checkout main
git reset --hard origin/main
```

**If already pushed:** ⚠️ Escalate to Chief of Staff immediately.

---

### Problem: Branch diverged from remote

```
error: failed to push some refs to 'origin'
hint: Updates were rejected because the tip of your current branch is behind
```

**Solution:**

```powershell
# Pull with rebase
git pull origin <branch-name> --rebase

# Resolve conflicts if any

# Push
git push origin <branch-name>
```

---

## Output

Provide:

1. **Branch name**
2. **Issue reference**
3. **Status** (created, updated, merged, deleted)
4. **Next steps**

**Example Output:**

```
✅ Feature branch created successfully

Branch: feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
Issue: #42 (feat: SEO Foundation)

Status: Created and pushed to remote

Assigned agents:
- solution-architect (model creation)
- tech-lead (implementation planning)
- frontend-engineer (S1, S2)
- backend-engineer (S3, S4)
- qa-test-engineer (S5)

Next steps:
⏭️  Agents will commit work to this branch
⏭️  Quality Director will create PR after all slices complete
⏭️  Chief of Staff will approve and merge

Local commands for agents:
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
# ... do work ...
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

## Related Prompts

- [git-commit.prompt.md](git-commit.prompt.md) — Commit work to feature branch
- [create-pr.prompt.md](create-pr.prompt.md) — Create PR from feature branch
- [manage-issue.prompt.md](manage-issue.prompt.md) — Link branch to GitHub issue

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-25  
**Owner:** Tech Lead
