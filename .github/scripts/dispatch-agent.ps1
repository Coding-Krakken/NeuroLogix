[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
param(
  [Parameter(Mandatory = $true)]
  [int]$IssueNumber,

  [Parameter(Mandatory = $true)]
  [string]$TargetAgent,

  [Parameter(Mandatory = $false)]
  [string]$Repo = 'Coding-Krakken/.subzero',

  [Parameter(Mandatory = $false)]
  [string]$HandoffFile,

  [Parameter(Mandatory = $false)]
  [string[]]$ContextFiles = @(),

  [Parameter(Mandatory = $false)]
  [bool]$GenerateContext = $true,

  [Parameter(Mandatory = $false)]
  [string]$ContextScript = '.github/scripts/generate-agent-context.ps1',

  [Parameter(Mandatory = $false)]
  [string]$ContextOutputDir = '.github/.system-state/ops/context',

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$Message) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Write-Output "[$stamp] $Message"
}

function Assert-CommandExists([string]$CommandName) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $CommandName"
  }
}

function Get-Sha256Hex([string]$Value) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
  $hashBytes = [System.Security.Cryptography.SHA256]::HashData($bytes)
  return ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
}

function Get-IssueComments([string]$RepoSlug, [int]$IssueId) {
  $raw = gh api "repos/$RepoSlug/issues/$IssueId/comments?per_page=100"
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return @()
  }

  $parsed = $raw | ConvertFrom-Json
  if ($parsed -is [System.Array]) {
    return $parsed
  }

  return @($parsed)
}

function Post-IssueComment([string]$RepoSlug, [int]$IssueId, [string]$Body) {
  $payload = @{ body = $Body } | ConvertTo-Json -Compress
  $response = $payload | gh api "repos/$RepoSlug/issues/$IssueId/comments" --method POST --input -
  return ($response | ConvertFrom-Json)
}

function Resolve-ContextSnapshotPath([int]$IssueId, [string]$DirectoryPath) {
  $candidate = Join-Path $DirectoryPath "issue-$IssueId-agent-context.json"
  if (Test-Path -LiteralPath $candidate) {
    return (Resolve-Path -LiteralPath $candidate).Path
  }

  return $null
}

function New-DefaultHandoffBody([int]$IssueId, [string]$AgentId, [string]$ContextPath) {
  $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss K')

  return @"
## Handoff

**Agent:** 00-chief-of-staff
**Work Item:** Issue #$IssueId
**Status:** Partial
**Timestamp:** $timestamp

---

### Scope Completed

- [x] Built reusable context snapshot for issue handoff continuity.

---

### Next Agent

**Handoff To:** `$AgentId`

---

### Next Actions (Explicit Checklist)

- [ ] Consume the context snapshot at: $ContextPath
- [ ] Continue from pending checklist items and latest governance signals.
- [ ] Skip full repository rediscovery unless the snapshot is stale or contradictory.
- [ ] Post handoff comment with updated progress and evidence.

---

### Links

- **Handoff Comment (self):** N/A (created by dispatch script)

---

**End of Handoff**
"@
}

Assert-CommandExists 'gh'
Assert-CommandExists 'code'

$repoPath = (Get-Location).Path
$generatedContextJson = $null

if ($GenerateContext) {
  if (-not (Test-Path -LiteralPath $ContextScript)) {
    throw "Context generator script not found: $ContextScript"
  }

  Write-Log 'Generating fresh agent context snapshot'
  $contextOutput = & $ContextScript -IssueNumber $IssueNumber -Repo $Repo -OutputDir $ContextOutputDir
  foreach ($line in $contextOutput) {
    if ($line -match '^jsonPath=(.+)$') {
      $generatedContextJson = $Matches[1]
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($generatedContextJson)) {
  $generatedContextJson = Resolve-ContextSnapshotPath -IssueId $IssueNumber -DirectoryPath $ContextOutputDir
}

if ([string]::IsNullOrWhiteSpace($generatedContextJson)) {
  throw 'Unable to resolve context snapshot path. Generate it first or provide a valid ContextOutputDir.'
}

$generatedContextJson = (Resolve-Path -LiteralPath $generatedContextJson).Path

$handoffBody = $null
$handoffSourceLabel = 'generated-default'
if (-not [string]::IsNullOrWhiteSpace($HandoffFile)) {
  if (-not (Test-Path -LiteralPath $HandoffFile)) {
    throw "Handoff file not found: $HandoffFile"
  }

  $handoffBody = Get-Content -LiteralPath $HandoffFile -Raw
  $handoffSourceLabel = $HandoffFile
} else {
  $handoffBody = New-DefaultHandoffBody -IssueId $IssueNumber -AgentId $TargetAgent -ContextPath $generatedContextJson
}

$handoffHash = Get-Sha256Hex $handoffBody
$tokenSeed = "$Repo|$IssueNumber|$TargetAgent|$handoffHash"
$dispatchToken = (Get-Sha256Hex $tokenSeed).Substring(0, 20)
$markerPrefix = "Dispatch token: $dispatchToken"

$comments = Get-IssueComments -RepoSlug $Repo -IssueId $IssueNumber
$existingMarker = $comments |
  Where-Object { ($_.body -as [string]) -like "*$markerPrefix*" } |
  Select-Object -Last 1

if ($existingMarker -and -not $Force.IsPresent) {
  Write-Log "Skip: dispatch already recorded for token $dispatchToken"
  Write-Output 'skip=true'
  Write-Output 'reason=existing-dispatch-token'
  Write-Output "token=$dispatchToken"
  Write-Output "markerUrl=$($existingMarker.html_url)"
  return
}

$existingHandoffComment = $comments |
  Where-Object { ($_.body -as [string]) -eq $handoffBody } |
  Select-Object -Last 1

$handoffUrl = $null
if ($existingHandoffComment) {
  $handoffUrl = $existingHandoffComment.html_url
  Write-Log "Reusing existing handoff comment: $handoffUrl"
} else {
  if ($PSCmdlet.ShouldProcess("Issue #$IssueNumber", 'Post handoff comment')) {
    $postedHandoff = Post-IssueComment -RepoSlug $Repo -IssueId $IssueNumber -Body $handoffBody
    $handoffUrl = $postedHandoff.html_url
    Write-Log "Posted handoff comment: $handoffUrl"
  }
}

if ([string]::IsNullOrWhiteSpace($handoffUrl)) {
  throw 'Missing handoff URL; aborting dispatch.'
}

$contextPack = New-Object System.Collections.Generic.List[string]
$contextPack.Add($generatedContextJson)

if (-not [string]::IsNullOrWhiteSpace($HandoffFile) -and (Test-Path -LiteralPath $HandoffFile)) {
  $contextPack.Add((Resolve-Path -LiteralPath $HandoffFile).Path)
}

foreach ($contextFile in $ContextFiles) {
  if (-not [string]::IsNullOrWhiteSpace($contextFile) -and (Test-Path -LiteralPath $contextFile)) {
    $contextPack.Add((Resolve-Path -LiteralPath $contextFile).Path)
  }
}

$defaultAux = @('.github/AGENTS.md', '.github/GIT_WORKFLOW.md')
foreach ($auxPath in $defaultAux) {
  if ($contextPack.Count -ge 3) {
    break
  }

  if (Test-Path -LiteralPath $auxPath) {
    $contextPack.Add((Resolve-Path -LiteralPath $auxPath).Path)
  }
}

$uniqueContextPack = @($contextPack | Select-Object -Unique)

$dispatchLines = @(
  "[Issue#$IssueNumber] [Task] [To: $TargetAgent]",
  "Handoff URL: $handoffUrl",
  "Context Snapshot: $generatedContextJson",
  'Execute pending checklist items from the context snapshot first.',
  'Skip full repo discovery unless snapshot data is stale or contradictory.'
)
$dispatchMessage = ($dispatchLines -join "`n")

$dispatchArgs = @('chat', '-m', $TargetAgent, '--add-file', $repoPath)
foreach ($contextPath in $uniqueContextPack) {
  $dispatchArgs += @('--add-file', $contextPath)
}
$dispatchArgs += $dispatchMessage

$dispatchExit = -1
if ($PSCmdlet.ShouldProcess($TargetAgent, 'Dispatch agent via code chat')) {
  & code @dispatchArgs
  $dispatchExit = $LASTEXITCODE
  Write-Log "Dispatch exit code: $dispatchExit"
}

$timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss K')
$markerBody = @(
  $markerPrefix,
  "Dispatch executed ($timestamp): [Issue#$IssueNumber] [To: $TargetAgent]",
  "Handoff URL: $handoffUrl",
  "Handoff Source: $handoffSourceLabel",
  "Context Snapshot: $generatedContextJson",
  "Context Pack: $($uniqueContextPack -join ' + ')",
  "DispatchExit=$dispatchExit",
  "HandoffHash=$handoffHash"
) -join "`n"

if ($PSCmdlet.ShouldProcess("Issue #$IssueNumber", 'Post dispatch marker comment')) {
  $markerComment = Post-IssueComment -RepoSlug $Repo -IssueId $IssueNumber -Body $markerBody
  Write-Log "Posted dispatch marker: $($markerComment.html_url)"
}

Write-Output 'skip=false'
Write-Output "token=$dispatchToken"
Write-Output "handoffUrl=$handoffUrl"
Write-Output "contextJson=$generatedContextJson"
Write-Output "dispatchExit=$dispatchExit"