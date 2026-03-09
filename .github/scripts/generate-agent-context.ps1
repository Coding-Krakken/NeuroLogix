[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [int]$IssueNumber,

  [Parameter(Mandatory = $false)]
  [string]$Repo = 'Coding-Krakken/.subzero',

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = '.github/.system-state/ops/context',

  [Parameter(Mandatory = $false)]
  [int]$MaxComments = 100,

  [Parameter(Mandatory = $false)]
  [string]$DefaultBranch = 'main'
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

function ConvertTo-CompactText([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ''
  }

  return ($Value -replace "`r", '' -replace "`n", ' ' -replace '\s+', ' ').Trim()
}

function Get-IssueData([string]$RepoSlug, [int]$IssueId) {
  $raw = gh issue view $IssueId --repo $RepoSlug --json number,title,body,state,url,labels,assignees,author,createdAt,updatedAt
  if ([string]::IsNullOrWhiteSpace($raw)) {
    throw "Unable to load issue #$IssueId"
  }

  return ($raw | ConvertFrom-Json)
}

function Get-IssueComments([string]$RepoSlug, [int]$IssueId, [int]$Limit) {
  $raw = gh api "repos/$RepoSlug/issues/$IssueId/comments?per_page=$Limit"
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return @()
  }

  $parsed = $raw | ConvertFrom-Json
  if ($parsed -is [System.Array]) {
    return $parsed
  }

  return @($parsed)
}

function Get-LatestMatchingComment($Comments, [string]$Pattern) {
  return $Comments |
    Where-Object { ($_.body -as [string]) -match $Pattern } |
    Select-Object -Last 1
}

function Get-NextAgentFromHandoff([string]$Body) {
  if ([string]::IsNullOrWhiteSpace($Body)) {
    return $null
  }

  $patterns = @(
    '(?im)^\*\*Handoff To:\*\*\s*`?([a-z0-9-]+)`?',
    '(?im)^\*\*Next Agent\*\*[\s\S]*?([a-z0-9-]+)',
    '(?im)Dispatch to:\s*`?([a-z0-9-]+)`?'
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($Body, $pattern)
    if ($match.Success) {
      return $match.Groups[1].Value.Trim()
    }
  }

  return $null
}

function Get-OpenChecklistItems([string]$Body) {
  if ([string]::IsNullOrWhiteSpace($Body)) {
    return @()
  }

  $matches = [regex]::Matches($Body, '(?im)^\s*-\s*\[\s\]\s+(.+)$')
  $items = @()
  foreach ($match in $matches) {
    $items += (ConvertTo-CompactText $match.Groups[1].Value)
  }

  return $items | Select-Object -Unique
}

function Invoke-GitSafe([string]$Command) {
  try {
    $result = Invoke-Expression $Command 2>$null
    if ($LASTEXITCODE -ne 0) {
      return @()
    }

    if ($result -is [System.Array]) {
      return $result
    }

    if ($null -eq $result) {
      return @()
    }

    return @($result)
  } catch {
    return @()
  }
}

Assert-CommandExists 'gh'
Assert-CommandExists 'git'

$issue = Get-IssueData -RepoSlug $Repo -IssueId $IssueNumber
$comments = Get-IssueComments -RepoSlug $Repo -IssueId $IssueNumber -Limit $MaxComments

$governanceComment = Get-LatestMatchingComment -Comments $comments -Pattern '<!-- deterministic-governance-report -->'
$verificationComment = Get-LatestMatchingComment -Comments $comments -Pattern '<!-- verification-mesh-report -->'
$latestHandoff = Get-LatestMatchingComment -Comments $comments -Pattern '(?im)^##\s+Handoff\b|\*\*Handoff To:\*\*|Handoff URL:'
$latestDispatchMarker = Get-LatestMatchingComment -Comments $comments -Pattern '(?im)dispatch token|DispatchExit='

$nextAgent = $null
$openChecklist = @()
if ($latestHandoff) {
  $nextAgent = Get-NextAgentFromHandoff -Body $latestHandoff.body
  $openChecklist = Get-OpenChecklistItems -Body $latestHandoff.body
}

$currentBranch = (Invoke-GitSafe 'git rev-parse --abbrev-ref HEAD' | Select-Object -First 1)
$branchDiff = Invoke-GitSafe "git diff --name-only $DefaultBranch...HEAD" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
$workingTree = Invoke-GitSafe 'git status --short' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

$labelNames = @()
foreach ($label in ($issue.labels | Where-Object { $_ })) {
  $labelNames += $label.name
}

$assigneeNames = @()
foreach ($assignee in ($issue.assignees | Where-Object { $_ })) {
  $assigneeNames += $assignee.login
}

$summary = [ordered]@{
  generatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  repo = $Repo
  issue = [ordered]@{
    number = $issue.number
    title = $issue.title
    state = $issue.state
    url = $issue.url
    updatedAt = $issue.updatedAt
    labels = $labelNames
    assignees = $assigneeNames
  }
  workflowSignals = [ordered]@{
    governance = [ordered]@{
      present = ($null -ne $governanceComment)
      lastUpdated = $governanceComment.updated_at
      summaryLine = (ConvertTo-CompactText (($governanceComment.body -split "`n" | Select-Object -First 8) -join ' '))
      url = $governanceComment.html_url
    }
    verification = [ordered]@{
      present = ($null -ne $verificationComment)
      lastUpdated = $verificationComment.updated_at
      summaryLine = (ConvertTo-CompactText (($verificationComment.body -split "`n" | Select-Object -First 10) -join ' '))
      url = $verificationComment.html_url
    }
    dispatch = [ordered]@{
      present = ($null -ne $latestDispatchMarker)
      lastUpdated = $latestDispatchMarker.updated_at
      summaryLine = (ConvertTo-CompactText (($latestDispatchMarker.body -split "`n" | Select-Object -First 5) -join ' '))
      url = $latestDispatchMarker.html_url
    }
  }
  handoff = [ordered]@{
    present = ($null -ne $latestHandoff)
    lastUpdated = $latestHandoff.updated_at
    author = $latestHandoff.user.login
    nextAgent = $nextAgent
    pendingChecklistCount = $openChecklist.Count
    pendingChecklistItems = $openChecklist
    handoffUrl = $latestHandoff.html_url
  }
  localWorkspace = [ordered]@{
    branch = $currentBranch
    defaultBranch = $DefaultBranch
    changedAgainstDefault = $branchDiff | Select-Object -First 100
    workingTree = $workingTree | Select-Object -First 100
  }
  guidance = [ordered]@{
    rediscoveryRequired = $false
    resumeInstruction = 'Consume this context packet first. Re-run full discovery only when issue metadata is missing, stale, or contradictory.'
  }
}

$null = New-Item -ItemType Directory -Path $OutputDir -Force
$jsonPath = Join-Path $OutputDir ("issue-$IssueNumber-agent-context.json")
$mdPath = Join-Path $OutputDir ("issue-$IssueNumber-agent-context.md")

$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding utf8

$markdown = @(
  "# Agent Context Snapshot: Issue #$IssueNumber"
  ""
  "Generated: $($summary.generatedAtUtc)"
  ""
  "## Issue"
  "- Title: $($summary.issue.title)"
  "- State: $($summary.issue.state)"
  "- Labels: $([string]::Join(', ', $summary.issue.labels))"
  "- Assignees: $([string]::Join(', ', $summary.issue.assignees))"
  "- URL: $($summary.issue.url)"
  ""
  "## Handoff Resume"
  "- Latest handoff present: $($summary.handoff.present)"
  "- Next agent: $($summary.handoff.nextAgent)"
  "- Pending checklist items: $($summary.handoff.pendingChecklistCount)"
)

if ($summary.handoff.pendingChecklistItems.Count -gt 0) {
  $markdown += ''
  $markdown += '### Pending Checklist Items'
  foreach ($item in ($summary.handoff.pendingChecklistItems | Select-Object -First 20)) {
    $markdown += "- [ ] $item"
  }
}

$markdown += @(
  ''
  '## Workflow Signals'
  "- Governance report present: $($summary.workflowSignals.governance.present)"
  "- Verification report present: $($summary.workflowSignals.verification.present)"
  "- Dispatch marker present: $($summary.workflowSignals.dispatch.present)"
  ''
  '## Workspace Delta'
  "- Branch: $($summary.localWorkspace.branch)"
  "- Changed files vs default: $($summary.localWorkspace.changedAgainstDefault.Count)"
  "- Working tree entries: $($summary.localWorkspace.workingTree.Count)"
)

if ($summary.localWorkspace.changedAgainstDefault.Count -gt 0) {
  $markdown += ''
  $markdown += '### Changed Files (vs default branch)'
  foreach ($path in $summary.localWorkspace.changedAgainstDefault) {
    $markdown += "- $path"
  }
}

$markdown += @(
  ''
  '## Resume Guidance'
  "- Rediscovery required: $($summary.guidance.rediscoveryRequired)"
  "- Instruction: $($summary.guidance.resumeInstruction)"
)

$markdown -join "`n" | Set-Content -Path $mdPath -Encoding utf8

Write-Output "jsonPath=$jsonPath"
Write-Output "markdownPath=$mdPath"