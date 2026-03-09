param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('create-issue', 'comment-issue', 'create-branch', 'create-pr', 'request-review', 'merge-pr')]
  [string]$Action,

  [string]$Title,
  [string]$Body,
  [string]$Labels,
  [string]$Assignees,
  [int]$Issue,
  [string]$Type = 'feature',
  [string]$Slug,
  [string]$Base = 'main',
  [string]$Head,
  [int]$Pr,
  [string]$Reviewers,
  [ValidateSet('--squash', '--merge')]
  [string]$MergeMethod = '--squash'
)

$ErrorActionPreference = 'Stop'

function Split-Csv([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return @()
  }

  return $Value.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

function Write-Log([string]$Message) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Write-Output "[$stamp] $Message"
}

switch ($Action) {
  'create-issue' {
    if (-not $Title -or -not $Body) {
      throw 'Title and Body are required for create-issue'
    }

    $args = @('issue', 'create', '--title', $Title, '--body', $Body)
    foreach ($label in (Split-Csv $Labels)) {
      $args += @('--label', $label)
    }
    foreach ($assignee in (Split-Csv $Assignees)) {
      $args += @('--assignee', $assignee)
    }

    Write-Log 'Creating issue'
    gh @args
    break
  }

  'comment-issue' {
    if (-not $Issue -or -not $Body) {
      throw 'Issue and Body are required for comment-issue'
    }

    Write-Log "Adding comment to issue #$Issue"
    gh issue comment $Issue --body $Body
    break
  }

  'create-branch' {
    if (-not $Issue -or -not $Slug) {
      throw 'Issue and Slug are required for create-branch'
    }

    $branch = "$Type/$Issue-$Slug"
    Write-Log "Creating/switching to branch $branch"
    git checkout main
    git pull origin main

    $exists = git branch --list $branch
    if ($exists) {
      git checkout $branch
    } else {
      git checkout -b $branch
      git push -u origin $branch
    }

    Write-Output $branch
    break
  }

  'create-pr' {
    if (-not $Title -or -not $Body -or -not $Head -or -not $Issue) {
      throw 'Title, Body, Head, and Issue are required for create-pr'
    }

    if ($Body -notmatch '(?i)(closes|fixes)\s+#\d+') {
      $Body = "$Body`n`nCloses #$Issue"
    }

    $args = @('pr', 'create', '--title', $Title, '--body', $Body, '--base', $Base, '--head', $Head)
    foreach ($label in (Split-Csv $Labels)) {
      $args += @('--label', $label)
    }

    Write-Log "Creating PR from $Head to $Base"
    gh @args
    break
  }

  'request-review' {
    if (-not $Pr -or -not $Reviewers) {
      throw 'Pr and Reviewers are required for request-review'
    }

    Write-Log "Requesting review for PR #$Pr"
    gh pr edit $Pr --add-reviewer $Reviewers
    break
  }

  'merge-pr' {
    if (-not $Pr) {
      throw 'Pr is required for merge-pr'
    }

    Write-Log "Merging PR #$Pr with $MergeMethod"
    gh pr merge $Pr $MergeMethod --delete-branch
    break
  }
}
