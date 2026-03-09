# Prompt: Manage GitHub Issues

**Category:** operations  
**Purpose:** Guide agents to create and update GitHub issues for work tracking  
**Complexity:** Simple  
**Expected Duration:** 5-10 minutes

---

## Objective

Create, update, and close GitHub issues to track all work items (features, bugs, epics, technical debt).

**Authority:**

- **Chief of Staff** creates issues for all user requests
- **Program Manager** manages issue lifecycle
- **All agents** can comment/update issues they're assigned to

---

## Context

You are operating in the Core-3 model (with specialist escalation). Every significant work item must be tracked in GitHub Issues with:

- Clear title and description
- Acceptance criteria
- Epic/Phase reference
- Complexity estimate
- Agent assignment
- Status tracking

---

## Issue Types

| Type           | Label       | Created By         | Example                                 |
| -------------- | ----------- | ------------------ | --------------------------------------- |
| Epic           | `epic`      | Chief of Staff     | E009 SEO Foundation                     |
| Feature        | `feature`   | Chief of Staff     | Add BreadcrumbList schema generator     |
| Bug            | `bug`       | Chief of Staff, QA | Cart duplicate items race condition     |
| Security       | `security`  | Security Engineer  | XSS vulnerability in JSON-LD serializer |
| Technical Debt | `tech-debt` | Tech Lead          | Refactor payment handler                |
| Documentation  | `docs`      | Documentation Eng  | Update RUNBOOK.md                       |
| Infrastructure | `infra`     | Platform Engineer  | Add Lighthouse CI integration           |

---

## Creating Issues

### Step 1: Prepare Issue Body

Use deterministic templates from `.github/ISSUE_TEMPLATE/deterministic-*.yml` and ensure the issue body includes:

```markdown
## Issue Title

[Type] Brief description (≤60 chars)

## Description

What needs to be done and why.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Epic/Phase (if applicable)

Epic: <E00X Epic Name>  
Phase: <P# Phase Name>

## Complexity Estimate

Points: <number> (within phase budget)

## Assigned Agent

@<agent-id>

## Related Files

- `<file1>`
- `<file2>`

## References

- ADR-XXX: <Decision title>
- Related issue: #<number>
```

---

### Step 2: Create Issue via GitHub CLI

**Command:**

```powershell
gh issue create \
  --title "<title>" \
  --body-file .github/issue-bodies/issue-<name>.md \
  --label "<label1>,<label2>" \
  --assignee "<agent-id>"
```

**Example: Epic**

```powershell
gh issue create \
  --title "feat: SEO Foundation (E009)" \
  --body-file .github/issue-bodies/issue-e009.md \
  --label "epic,feature,agent:solution-architect" \
  --assignee "solution-architect"
```

**Example: Bug**

```powershell
gh issue create \
  --title "fix: cart duplicate items on double-click" \
  --body "User can add duplicate items by double-clicking \"Add to Cart\".\n\nExpected: Single item added.\nActual: Duplicate items added." \
  --label "bug,p0,agent:frontend-engineer" \
  --assignee "frontend-engineer"
```

**Example: Security**

```powershell
gh issue create \
  --title "security: XSS risk in JSON-LD serialization" \
  --body "Script-breakout possible if product names contain </script> tag.\n\nSeverity: HIGH\nCVE: None (internal finding)" \
  --label "security,p0,agent:security-engineer" \
  --assignee "security-engineer"
```

---

### Step 3: Capture Issue Number

After creation, GitHub CLI returns the issue number:

```
$ gh issue create ...
Created issue #<WORK_ITEM_ID>
https://github.com/<ORGANIZATION_NAME>/<REPOSITORY_NAME>/issues/<WORK_ITEM_ID>
```

**Save this number** — all commits, branches, and PRs will reference it.

---

## Updating Issues

### Add Comments

```powershell
gh issue comment <issue-number> --body "<comment text>"

# Example: Agent provides status update
gh issue comment 42 --body "Model artifacts complete. ADR-007 created. Dispatching to tech-lead."
```

---

### Add Labels

```powershell
gh issue edit <issue-number> --add-label "<label>"

# Example: Mark in-progress
gh issue edit 42 --add-label "in-progress"

# Example: Mark blocked
gh issue edit 42 --add-label "blocked" --body "Blocked by upstream <PAYMENT_PROVIDER> API issue."
```

---

### Update Assignee

```powershell
gh issue edit <issue-number> --add-assignee "<agent-id>"

# Example: Reassign to different agent
gh issue edit 42 --remove-assignee "solution-architect" --add-assignee "tech-lead"
```

---

### Change Title

```powershell
gh issue edit <issue-number> --title "<new title>"

# Example: Add epic reference
gh issue edit 42 --title "feat: SEO Foundation (E009)"
```

---

## Closing Issues

### Close via PR Merge (Automatic)

If PR body contains `Closes #<issue-number>`, issue auto-closes on PR merge.

**PR Body:**

```markdown
Closes #42
```

When PR #123 merges → Issue #<WORK_ITEM_ID> automatically closes.

---

### Close Manually

```powershell
gh issue close <issue-number> --comment "<closure reason>"

# Example: Completed via PR
gh issue close 42 --comment "Completed via PR #123. All quality gates passed."

# Example: Won't fix
gh issue close 42 --comment "Closing as won't fix. Out of scope for current phase."

# Example: Duplicate
gh issue close 42 --comment "Duplicate of #40. Closing."
```

---

## Issue Labels Reference

### Type Labels

- `epic` — Epic-level work (E001-E013+)
- `feature` — New feature or enhancement
- `bug` — Bug fix
- `security` — Security vulnerability or improvement
- `tech-debt` — Technical debt/refactoring
- `docs` — Documentation changes
- `infra` — Infrastructure/deployment
- `chore` — Maintenance tasks

### Priority Labels

- `p0` — Critical (blocks production)
- `p1` — High (blocks development)
- `p2` — Medium (normal priority)
- `p3` — Low (nice to have)

### Status Labels

- `open` — Not started (default)
- `in-progress` — Work started
- `blocked` — Blocked by external dependency
- `ready-for-review` — Implementation complete, awaiting review
- `ready-for-qa` — Code merged, ready for QA validation

### Agent Labels

- `agent:00-chief-of-staff`
- `agent:solution-architect`
- `agent:tech-lead`
- `agent:frontend-engineer`
- `agent:backend-engineer`
- `agent:qa-test-engineer`
- `agent:security-engineer`
- `agent:quality-director`

### Epic Labels

- `epic:e001` — Foundation (routing, layouts, <PAYMENT_PROVIDER> SDK)
- `epic:e009` — SEO Foundation
- `epic:e010` — Conversion Optimization

---

## Issue Lifecycle

```
Open
  ↓ (Chief of Staff assigns agent)
In Progress
  ↓ (Agent implements, commits)
Ready for Review
  ↓ (QA validates)
Ready for QA
  ↓ (Quality Director creates PR)
PR Created
  ↓ (PR approved & merged)
Closed
```

**State Transitions:**

| Current State    | Next State       | Triggered By                      | Action                                               |
| ---------------- | ---------------- | --------------------------------- | ---------------------------------------------------- |
| Open             | In Progress      | Agent starts work                 | Add label `in-progress`, comment with plan           |
| In Progress      | Blocked          | External dependency               | Add label `blocked`, comment with blocker details    |
| Blocked          | In Progress      | Blocker resolved                  | Remove label `blocked`, comment with resolution      |
| In Progress      | Ready for Review | Implementation complete           | Add label `ready-for-review`, request code review    |
| Ready for Review | In Progress      | Review requests changes           | Comment with feedback, agent addresses               |
| Ready for Review | Ready for QA     | Code review approved              | Agent merges to feature branch, QA starts validation |
| Ready for QA     | In Progress      | QA finds bugs                     | Comment with bug report, agent fixes                 |
| Ready for QA     | PR Created       | QA passes, Quality Dir creates PR | Link PR in issue comment                             |
| PR Created       | Closed           | PR merged                         | Auto-close via `Closes #<issue>`                     |

---

## Best Practices

### ✅ DO

1. **Create issues for all user requests**
   - Even small requests get an issue for tracking

2. **Use descriptive titles**
   - Good: `fix: cart duplicate items on double-click`
   - Bad: `fix cart`

3. **Include acceptance criteria**
   - Makes "done" definition clear

4. **Link related issues/PRs**
   - `Related to #40`, `Closes #42`, `Blocked by #50`

5. **Update status regularly**
   - Comment when starting work, when blocked, when complete

6. **Reference issues in commits**
   - Every commit should mention issue number

---

### ❌ DON'T

1. **Don't create issues without acceptance criteria**
   - Makes it impossible to know when work is done

2. **Don't leave issues stale**
   - If no progress for 7 days, comment with status update

3. **Don't use vague labels**
   - Bad: `bug`, `in-progress`, `p2` (no context)
   - Good: `bug`, `in-progress`, `p2`, `agent:frontend-engineer`, `epic:e009`

4. **Don't close issues without explanation**
   - Always comment why closing (completed, duplicate, won't fix)

5. **Don't assign multiple agents**
   - One owner per issue (can collaborate but single owner)

---

## Advanced: Issue Queries

### View All Open Issues

```powershell
gh issue list --state open
```

### View Issues Assigned to Me

```powershell
gh issue list --assignee "@me"
```

### View Issues by Label

```powershell
gh issue list --label "epic:e009"
gh issue list --label "bug,p0"
```

### View Issue Details

```powershell
gh issue view <issue-number>

# Example:
gh issue view 42
```

### Search Issues

```powershell
gh issue list --search "SEO"
gh issue list --search "cart"
```

---

## Output

Provide:

1. **Issue number**
2. **Issue URL**
3. **Assignee**
4. **Labels**
5. **Status**
6. **Next steps**

**Example Output:**

```
✅ GitHub Issue created successfully

Issue #<WORK_ITEM_ID>: feat: SEO Foundation (E009)
URL: https://github.com/<ORGANIZATION_NAME>/<REPOSITORY_NAME>/issues/42

Assignee: @solution-architect

Labels:
- epic
- feature
- agent:solution-architect
- in-progress

Description:
Implement SEO invariants INV-SEO-1 through INV-SEO-5.
Includes metadata helpers, structured data, sitemap, robots.txt.

Acceptance Criteria:
- [ ] Metadata helpers enforce title ≤60, description ≤160
- [ ] Structured data includes Product, Organization, BreadcrumbList
- [ ] Sitemap covers 100% of 481 SKUs
- [ ] Canonical URLs are absolute
- [ ] Robots.txt disallows sensitive paths

Complexity: 15 points (Phase P4 budget: 30)

Next steps:
⏭️  Solution Architect will create domain models
⏭️  Tech Lead will create implementation plan
⏭️  Engineers will implement vertical slices S1-S5
```

---

## Related Prompts

- [git-commit.prompt.md](git-commit.prompt.md) — Commit changes (reference issue number)
- [create-pr.prompt.md](create-pr.prompt.md) — Create PR (links to issue)
- [branch-strategy.prompt.md](branch-strategy.prompt.md) — Create branches (named after issue)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-25  
**Owner:** Chief of Staff, Program Manager

