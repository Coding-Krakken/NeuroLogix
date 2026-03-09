[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
param(
  [Parameter(Mandatory = $true)]
  [int]$IssueNumber,

  [Parameter(Mandatory = $false)]
  [string]$Repo = 'Coding-Krakken/.subzero',

  [Parameter(Mandatory = $false)]
  [string]$TargetAgent = '99-quality-director',

  [Parameter(Mandatory = $false)]
  [string]$HandoffFile = '.github/.handoffs/quality-director/handoff-20260303-issue45-final-signoff-request.md',

  [Parameter(Mandatory = $false)]
  [string[]]$ContextFiles = @(
    'artifacts/issue-45/qa-ac-verification-matrix.md',
    'artifacts/issue-45/qa-command-output.md'
  ),

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
  $raw = gh api --paginate "repos/$RepoSlug/issues/$IssueId/comments"
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

Assert-CommandExists 'gh'
Assert-CommandExists 'code'

if (-not (Test-Path -LiteralPath $HandoffFile)) {
  throw "Handoff file not found: $HandoffFile"
}

$repoPath = (Get-Location).Path
$handoffBody = Get-Content -LiteralPath $HandoffFile -Raw
$handoffHash = Get-Sha256Hex $handoffBody
$tokenSeed = "$Repo|$IssueNumber|$TargetAgent|$handoffHash"
$dispatchToken = (Get-Sha256Hex $tokenSeed).Substring(0, 20)
$markerPrefix = "Chief-of-Staff final-signoff dispatch token: $dispatchToken"

$comments = Get-IssueComments -RepoSlug $Repo -IssueId $IssueNumber
$existingMarker = $comments |
  Where-Object { ($_.body -as [string]) -like "*$markerPrefix*" } |
  Select-Object -Last 1

if ($existingMarker -and -not $Force.IsPresent) {
  Write-Log "Skip: dispatch already recorded for token $dispatchToken"
  Write-Output "skip=true"
  Write-Output "reason=existing-dispatch-token"
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
  if ($PSCmdlet.ShouldProcess("Issue #$IssueNumber", 'Post final-signoff handoff comment')) {
    $postedHandoff = Post-IssueComment -RepoSlug $Repo -IssueId $IssueNumber -Body $handoffBody
    $handoffUrl = $postedHandoff.html_url
    Write-Log "Posted handoff comment: $handoffUrl"
  }
}

if ([string]::IsNullOrWhiteSpace($handoffUrl)) {
  throw 'Missing handoff URL; aborting dispatch.'
}

$dispatchLines = @(
  "[Issue#$IssueNumber] [Final Signoff] [To: $TargetAgent]",
  "Handoff URL: $handoffUrl",
  'Execute final independent assurance adjudication and publish SHIP/NO-SHIP with G1-G10 and AC-1..AC-7 evidence.'
)
$dispatchMessage = ($dispatchLines -join "`n")

$dispatchArgs = @('chat', '-m', $TargetAgent, '--add-file', $repoPath, '--add-file', $HandoffFile)
foreach ($contextFile in $ContextFiles) {
  if (-not [string]::IsNullOrWhiteSpace($contextFile) -and (Test-Path -LiteralPath $contextFile)) {
    $dispatchArgs += @('--add-file', $contextFile)
  }
}
$dispatchArgs += $dispatchMessage

$dispatchExit = -1
if ($PSCmdlet.ShouldProcess($TargetAgent, 'Run final-signoff dispatch')) {
  & code @dispatchArgs
  $dispatchExit = $LASTEXITCODE
  Write-Log "Dispatch exit code: $dispatchExit"
}

$contextPack = @('repo', $HandoffFile)
foreach ($contextFile in $ContextFiles) {
  if (-not [string]::IsNullOrWhiteSpace($contextFile) -and (Test-Path -LiteralPath $contextFile)) {
    $contextPack += $contextFile
  }
}

$timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss K')
$markerBody = @(
  "$markerPrefix",
  "Chief-of-Staff dispatch executed ($timestamp): [Issue#$IssueNumber] [Final Signoff] [To: $TargetAgent]",
  "Handoff URL: $handoffUrl",
  "Context pack: $($contextPack -join ' + ')",
  "DispatchExit=$dispatchExit",
  "HandoffHash=$handoffHash"
) -join "`n"

if ($PSCmdlet.ShouldProcess("Issue #$IssueNumber", 'Post final-signoff dispatch marker')) {
  $markerComment = Post-IssueComment -RepoSlug $Repo -IssueId $IssueNumber -Body $markerBody
  Write-Log "Posted dispatch marker: $($markerComment.html_url)"
}

Write-Output "skip=false"
Write-Output "token=$dispatchToken"
Write-Output "handoffUrl=$handoffUrl"
Write-Output "dispatchExit=$dispatchExit"