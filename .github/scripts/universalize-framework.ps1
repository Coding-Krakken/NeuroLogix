[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
  [string]$RootPath = (Get-Location).Path,
  [string]$ConfigPath = ".github/framework-config/universalization-policy.json",
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'

function Get-NormalizedRelativePath {
  param(
    [string]$Root,
    [string]$FullPath
  )

  return [System.IO.Path]::GetRelativePath($Root, $FullPath).Replace('\', '/')
}

function Test-GlobMatch {
  param(
    [string]$Path,
    [string[]]$Globs
  )

  foreach ($glob in $Globs) {
    if ([string]::IsNullOrWhiteSpace($glob)) {
      continue
    }

    $escaped = [regex]::Escape($glob.Replace('\', '/'))
    $regexPattern = '^' + $escaped.Replace('\*\*', '___RECURSIVE___').Replace('\*', '[^/]*').Replace('___RECURSIVE___', '.*').Replace('\?', '.') + '$'

    if ($Path -match $regexPattern) {
      return $true
    }
  }

  return $false
}

function Test-RegexMatch {
  param(
    [string]$Path,
    [string[]]$Regexes
  )

  foreach ($regex in $Regexes) {
    if ([string]::IsNullOrWhiteSpace($regex)) {
      continue
    }

    if ($Path -match $regex) {
      return $true
    }
  }

  return $false
}

function Write-Preview {
  param([string]$Message)
  Write-Output "[DRY RUN] $Message"
}

$resolvedRoot = (Resolve-Path -LiteralPath $RootPath).Path
$resolvedConfig = if ([System.IO.Path]::IsPathRooted($ConfigPath)) {
  $ConfigPath
} else {
  Join-Path $resolvedRoot $ConfigPath
}

if (-not (Test-Path -LiteralPath $resolvedConfig)) {
  throw "Config file not found: $resolvedConfig"
}

$config = Get-Content -LiteralPath $resolvedConfig -Raw | ConvertFrom-Json
$previewOnly = -not $Apply.IsPresent

if ($previewOnly) {
  Write-Output "Universalization preview mode enabled. No files will be changed."
} else {
  Write-Output "Universalization apply mode enabled. Files will be modified."
}

$allFiles = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File -Force |
  Where-Object {
    $_.FullName -notmatch "[\\/](\.git|node_modules)[\\/]"
  }

$deletedDirectories = 0
$deletedFiles = 0
$rewrittenFiles = 0

foreach ($relativeDir in @($config.removeDirectories)) {
  $fullDir = Join-Path $resolvedRoot $relativeDir
  if (-not (Test-Path -LiteralPath $fullDir)) {
    continue
  }

  if ($previewOnly) {
    Write-Preview "Remove directory $relativeDir"
    $deletedDirectories++
    continue
  }

  if ($PSCmdlet.ShouldProcess($relativeDir, 'Remove directory recursively')) {
    Remove-Item -LiteralPath $fullDir -Recurse -Force
    Write-Output "Removed directory $relativeDir"
    $deletedDirectories++
  }
}

$filesToDelete = @{}
foreach ($file in $allFiles) {
  $relative = Get-NormalizedRelativePath -Root $resolvedRoot -FullPath $file.FullName

  $matchesGlob = Test-GlobMatch -Path $relative -Globs @($config.removeFileGlobs)
  $matchesRegex = Test-RegexMatch -Path $relative -Regexes @($config.removeFileRegex)

  if ($matchesGlob -or $matchesRegex) {
    $filesToDelete[$file.FullName] = $relative
  }
}

foreach ($entry in $filesToDelete.GetEnumerator()) {
  $fullPath = $entry.Key
  $relativePath = $entry.Value

  if (-not (Test-Path -LiteralPath $fullPath)) {
    continue
  }

  if ($previewOnly) {
    Write-Preview "Remove file $relativePath"
    $deletedFiles++
    continue
  }

  if ($PSCmdlet.ShouldProcess($relativePath, 'Remove file')) {
    Remove-Item -LiteralPath $fullPath -Force
    Write-Output "Removed file $relativePath"
    $deletedFiles++
  }
}

$includeGlobs = @($config.scrub.includeFileGlobs)
$excludeGlobs = @($config.scrub.excludeFileGlobs)
$replacements = @($config.scrub.replacements)

foreach ($file in $allFiles) {
  $fullPath = $file.FullName
  if (-not (Test-Path -LiteralPath $fullPath)) {
    continue
  }

  if ($filesToDelete.ContainsKey($fullPath)) {
    continue
  }

  $relative = Get-NormalizedRelativePath -Root $resolvedRoot -FullPath $fullPath

  if (-not (Test-GlobMatch -Path $relative -Globs $includeGlobs)) {
    continue
  }

  if (Test-GlobMatch -Path $relative -Globs $excludeGlobs) {
    continue
  }

  $original = Get-Content -LiteralPath $fullPath -Raw
  $updated = $original

  foreach ($replacement in $replacements) {
    $pattern = [string]$replacement.pattern
    $value = [string]$replacement.replacement
    $isRegex = $true
    if ($replacement.PSObject.Properties.Name -contains 'isRegex') {
      $isRegex = [bool]$replacement.isRegex
    }

    if ($isRegex) {
      $updated = [regex]::Replace($updated, $pattern, $value)
    } else {
      $updated = $updated.Replace($pattern, $value)
    }
  }

  if ($updated -ceq $original) {
    continue
  }

  if ($previewOnly) {
    Write-Preview "Rewrite file $relative"
    $rewrittenFiles++
    continue
  }

  if ($PSCmdlet.ShouldProcess($relative, 'Rewrite file content with universal replacements')) {
    Set-Content -LiteralPath $fullPath -Value $updated -Encoding utf8
    Write-Output "Rewrote file $relative"
    $rewrittenFiles++
  }
}

Write-Output ''
Write-Output 'Universalization summary:'
Write-Output "- Directories targeted: $deletedDirectories"
Write-Output "- Files targeted for removal: $deletedFiles"
Write-Output "- Files targeted for rewrite: $rewrittenFiles"

if ($previewOnly) {
  Write-Output ''
  Write-Output 'Preview complete. Re-run with -Apply to execute changes.'
}
