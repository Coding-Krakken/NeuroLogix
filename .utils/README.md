# .utils

Shared utility scripts for local workflow automation.

## `dispatch-code-chat.ps1`

Safely dispatches to `code chat` with:
- one `--add-file` flag per context file,
- `-PromptFile` loaded using `Get-Content -Raw`,
- optional comma-separated `-AddFile` values normalized into separate arguments,
- prompt delivered via attached handoff file by default,
- validation that payload includes required handoff header/sections,
- explicit start/validation/success telemetry for deterministic agent handoff confirmation,
- guardrails that reject `.github/prompts/*` and `.github/templates/*` as `-PromptFile`,
- guardrails that reject static prompt templates (for example `.github/prompts/*.prompt.md`) in `-AddFile`,
- guardrails that reject handoff payloads containing `"$handoff"` positional prompt transport,
- optional `-DryRun` to inspect the command without executing.

Current mode support:
- `-Mode ask` is supported.
- `-Mode edit` is reserved and intentionally rejected for now.

Prompt transport:
- default: attachment (recommended)
- optional argument mode: `-PassPromptAsArgument`
- optional stdin mode: `-PassPromptViaStdin`
- stdin implementation detail: redirected from a temp file for deterministic multiline delivery

Success semantics:
- `-DryRun` prints `Dispatch validation: passed ...` when handoff payload and attachments are valid.
- Live runs print `Dispatch executable ...`, then `Dispatch start ...`, followed by `Dispatch success ...` on completion.
- Any validation or launch failure throws and exits non-zero.

Executable selection:
- On Windows, the helper prefers `code.cmd` over `Code.exe` for CLI-dispatch reliability.

### Usage examples

Prompt from inline text:

```powershell
Set-Location "C:\Users\david\Desktop\.subzero"
$handoff = @'
[Context]
Work Item: Issue#53
Chain Step: 3
Target Agent: Builder
Source: Issue#53
Status: Ready
'@

.\.utils\dispatch-code-chat.ps1 `
  -Mode ask `
  -TargetAgent builder `
  -Prompt $handoff `
  -AddFile '.github/templates/implementation-plan.md'
```

Prompt from file:

```powershell
Set-Location "C:\Users\david\Desktop\.subzero"
.\.utils\dispatch-code-chat.ps1 `
  -Mode ask `
  -TargetAgent planner-architect `
  -PromptFile 'planning/handoff-to-planner-issue-53.md' `
  -AddFile '.github/templates/merge-record.md,.github/templates/closure-record.md'
```

Common mistake to avoid:

```powershell
# Incorrect: passing a prompt/template as the authoritative handoff payload
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile '.github/prompts/builder-handoff.prompt.md'

# Incorrect: attaching static prompt templates through -AddFile
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile 'planning/handoff-to-builder-issue-53.md' -AddFile '.github/prompts/builder-handoff.prompt.md'

# Correct: pass a generated handoff payload file and attach only non-prompt context
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile 'planning/handoff-to-builder-issue-53.md' -AddFile '.github/templates/implementation-plan.md'
```

Dry run preview:

```powershell
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile 'planning/handoff.md' -AddFile '.github/templates/handoff-message.md' -DryRun
```

Optional argument transport:

```powershell
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile 'planning/handoff.md' -AddFile '.github/templates/handoff-message.md' -PassPromptAsArgument
```

Optional stdin transport:

```powershell
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent builder -PromptFile 'planning/handoff.md' -AddFile '.github/templates/handoff-message.md' -PassPromptViaStdin
```
