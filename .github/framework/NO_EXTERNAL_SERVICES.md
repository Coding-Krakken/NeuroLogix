# Framework = Self-Contained Library (No External Services)

## TL;DR

**The framework is NOT a separate service. It's library code agents import and call directly.**

Think of it like:
- **Old:** `fs.writeFileSync()` then `exec('code chat')`  
- **New:** `provider.postHandoff()` then `dispatcher.dispatch()`

Same concept. Just posting to GitHub instead of writing files.

---

## Process Model

```
Agent Process
│
├─ Agent code runs
├─ Imports framework functions
├─ Calls postHandoffAndDispatch()
│   ├─ Spawns `gh` → posts comment → exits
│   └─ Spawns `code` → dispatches agent → exits
└─ Agent exits
```

**Duration:** Seconds  
**Persistent processes:** None  
**External services:** None

---

## CLI Tools Used (Already Installed)

| Tool | Purpose | Status |
|------|---------|--------|
| `gh` | Post GitHub comments | ✅ Already have (GitHub CLI) |
| `code` | Dispatch agents | ✅ Already have (VS Code) |
| `git` | Detect context | ✅ Already have (Git) |

**These are commands, not services.** The framework just wraps them with `execFile()`.

---

## No Deployment Needed

The framework is just `.ts` files. Agents import them:

```typescript
import { postHandoffAndDispatch } from './.github/framework/dispatcher'
```

No:
- ❌ HTTP server
- ❌ Background daemon  
- ❌ Docker container
- ❌ Separate process
- ❌ Database
- ❌ Message queue

Just:
- ✅ TypeScript files
- ✅ Node.js child_process
- ✅ CLI tool wrappers

---

## Dry-Run Mode (No Network Calls)

```typescript
const provider = createGitHubHandoffProvider({ dryRun: true })
const dispatcher = new AgentDispatcher({ dryRun: true })

await postHandoffAndDispatch(provider, dispatcher, context, handoffData)
// Simulates everything, makes NO actual system calls
```

Perfect for testing without touching GitHub.

---

## Summary

**Your concern:** "Sounds like a separate service"  
**Reality:** Library code agents call directly (like `fs` or `path`)

**Your requirement:** "No external dependencies"  
**Reality:** Only CLI tools already installed (`gh`, `code`, `git`)

**Your workflow:** "Post comment → dispatch agent"  
**Reality:** That's EXACTLY what `postHandoffAndDispatch()` does

✅ **The implementation matches your requirements perfectly.**
