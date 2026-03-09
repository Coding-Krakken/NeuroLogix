param(
  [string]$Repo = "Coding-Krakken/.subzero",
  [string]$Branch = "main",
  [string[]]$RequiredContexts = @(
    "enforce-pr-governance",
    "enforce-loop-coupling"
  ),
  [switch]$SoftFail
)

$ErrorActionPreference = "Stop"

function Get-EnabledValue {
  param([object]$InputObject)

  if ($null -eq $InputObject) { return $false }
  if ($InputObject -is [bool]) { return $InputObject }
  if ($InputObject.PSObject -and $InputObject.PSObject.Properties.Name -contains "enabled") {
    return [bool]$InputObject.enabled
  }

  return [bool]$InputObject
}

function Add-CheckResult {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [string]$Name,
    [bool]$Passed,
    [string]$Remediation
  )

  $status = if ($Passed) { "PASS" } else { "FAIL" }
  $Results.Add([pscustomobject]@{
      Check = $Name
      Status = $status
      Remediation = if ($Passed) { "" } else { $Remediation }
    }) | Out-Null
}

$null = gh auth status

Write-Output "Validating branch protection for $Repo branch $Branch..."

$protectionJson = gh api "repos/$Repo/branches/$Branch/protection" -H "Accept: application/vnd.github+json"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to fetch branch protection. gh exit code: $LASTEXITCODE"
}

$protection = $protectionJson | ConvertFrom-Json

$results = New-Object 'System.Collections.Generic.List[object]'

$requirePR = $null -ne $protection.required_pull_request_reviews
Add-CheckResult -Results $results -Name "Require pull request before merging" -Passed $requirePR -Remediation "Enable required pull request reviews for main branch."

$statusChecksConfigured = $null -ne $protection.required_status_checks
Add-CheckResult -Results $results -Name "Require status checks before merge" -Passed $statusChecksConfigured -Remediation "Enable required status checks in branch protection."

$strictUpToDate = $false
$contexts = @()
if ($statusChecksConfigured) {
  $strictUpToDate = [bool]$protection.required_status_checks.strict
  $contexts = @($protection.required_status_checks.contexts)
}
Add-CheckResult -Results $results -Name "Require branch up to date" -Passed $strictUpToDate -Remediation "Set required_status_checks.strict=true."

foreach ($required in $RequiredContexts) {
  $present = $contexts -contains $required
  Add-CheckResult -Results $results -Name "Required check: $required" -Passed $present -Remediation "Add '$required' to required status check contexts."
}

$conversationResolution = Get-EnabledValue -InputObject $protection.required_conversation_resolution
Add-CheckResult -Results $results -Name "Require conversation resolution" -Passed $conversationResolution -Remediation "Enable required conversation resolution."

$forcePushDisabled = -not (Get-EnabledValue -InputObject $protection.allow_force_pushes)
Add-CheckResult -Results $results -Name "Restrict force pushes" -Passed $forcePushDisabled -Remediation "Disable force pushes on main branch."

$deletionsDisabled = -not (Get-EnabledValue -InputObject $protection.allow_deletions)
Add-CheckResult -Results $results -Name "Restrict branch deletion" -Passed $deletionsDisabled -Remediation "Disable branch deletions on main branch."

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })

Write-Output ""
$results | Format-Table -AutoSize
Write-Output ""

if ($failed.Count -eq 0) {
  Write-Output "✅ Branch protection validation PASSED."
  exit 0
}

Write-Output "❌ Branch protection validation FAILED ($($failed.Count) checks)."
Write-Output ""
Write-Output "Remediation summary:"
$failed | ForEach-Object {
  Write-Output "- $($_.Check): $($_.Remediation)"
}

if ($SoftFail) {
  exit 0
}

exit 1
