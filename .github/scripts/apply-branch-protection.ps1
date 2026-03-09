param(
  [string]$Repo = "Coding-Krakken/.subzero",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$null = gh auth status

$body = @{
  required_status_checks = @{
    strict = $true
    contexts = @(
      "governance-pr / enforce-pr-governance"
    )
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $true
    required_approving_review_count = 2
    require_last_push_approval = $false
  }
  restrictions = $null
  required_linear_history = $true
  allow_force_pushes = $false
  allow_deletions = $false
  required_conversation_resolution = $true
}

$bodyJson = $body | ConvertTo-Json -Depth 10

Write-Output "Applying branch protection to $Repo branch $Branch..."

$bodyJson | gh api -X PUT "repos/$Repo/branches/$Branch/protection" -H "Accept: application/vnd.github+json" --input -
if ($LASTEXITCODE -ne 0) {
  throw "Failed to apply branch protection. gh exit code: $LASTEXITCODE"
}

Write-Output "Branch protection applied."
