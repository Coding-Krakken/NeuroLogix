# Agent Handoff Usage Example

This shows how agents use the framework functions directly (NO external services
required).

## Simple Agent Handoff (3 Lines of Code)

```typescript
import { postHandoffAndDispatch } from './framework/dispatcher'
import { createGitHubHandoffProvider } from './framework/github-handoff-provider'
import { defaultContextResolver } from './framework/context-resolver'

// Agent completes their work...
console.log('✅ Frontend implementation complete')

// 1. Prepare handoff data (what you did, what's next)
const handoffData = {
  agent: 'frontend-engineer',
  workItem: { issueNumber: 42, prNumber: 123 },
  status: 'Done',
  scopeCompleted: ['Built UI components', 'Added tests'],
  keyDecisions: [{ title: 'Used React Query', rationale: 'Better caching' }],
  changesSummary: { filesChanged: 5, linesAdded: 250, commits: [...] },
  verification: { status: 'Passed', commandsRun: ['npm test'] },
  risks: [],
  followUps: [],
  nextAgent: 'backend-engineer',
  nextActions: ['Build API endpoints', 'Add integration tests'],
  links: {}
}

// 2. Auto-detect context (repo, issue, PR, branch)
const context = await defaultContextResolver.resolve()

// 3. Post handoff + dispatch next agent (ATOMIC - both or neither)
const provider = createGitHubHandoffProvider()
const dispatcher = new AgentDispatcher()

await postHandoffAndDispatch(provider, dispatcher, context, handoffData)
// ✅ Comment posted to GitHub
// ✅ Next agent dispatched via code chat
// Done!
```

## What Actually Happens Under the Hood

### Step 1: Post Comment to GitHub

```typescript
// github-handoff-provider.ts internally runs:
gh issue comment 123 --body "Handoff: frontend-engineer → backend-engineer..."
// OR
gh pr comment 123 --body "Handoff: frontend-engineer → backend-engineer..."
```

### Step 2: Dispatch Next Agent

```typescript
// dispatcher.ts internally runs:
code chat -m backend-engineer --add-file /path/to/repo \
  "[Issue #<WORK_ITEM_ID>] [Task 2] [To: backend-engineer]
   Handoff URL: https://github.com/owner/repo/pull/123#issuecomment-456
   Complete the next actions from the handoff comment..."
```

## Zero External Services Required

**What you need (already installed):**

- ✅ `gh` CLI (GitHub CLI) - for posting comments
- ✅ `code` CLI (VS Code) - for `code chat` dispatch
- ✅ `git` CLI - for auto-detecting context

**What you DON'T need:**

- ❌ No separate service running
- ❌ No HTTP server
- ❌ No background daemon
- ❌ No Docker container
- ❌ No deployment

## The Framework IS the Agent Code

Agents import these functions **directly** and call them **in their own
process**.

Think of it like this:

- **Old system:** `fs.writeFileSync('.handoffs/agent/handoff.md')` then
  `exec('code chat')`
- **New system:** `provider.postHandoff()` then `dispatcher.dispatch()`

Same concept, just posting to GitHub instead of writing files.

## Dry-Run Mode (No Network Calls)

```typescript
// Test without actually posting to GitHub or dispatching
const provider = createGitHubHandoffProvider({ githubDryRun: true });
const dispatcher = new AgentDispatcher({ dryRun: true });

await postHandoffAndDispatch(provider, dispatcher, context, handoffData);
// Logs what WOULD happen, makes no actual API calls
```

## Command-Line Dependencies

| Command | Purpose              | Already Have It?         |
| ------- | -------------------- | ------------------------ |
| `gh`    | Post GitHub comments | ✅ If using GitHub       |
| `code`  | Dispatch agents      | ✅ If using Copilot Chat |
| `git`   | Detect repo/branch   | ✅ Always                |

These are **CLI tools**, not services. The framework just wraps them.
