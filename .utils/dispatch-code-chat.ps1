[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('ask')]
    [string]$Mode,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$TargetAgent,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$PromptFile,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$AddFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RepositoryRoot {
    try {
        $repositoryRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
        if ([string]::IsNullOrWhiteSpace($repositoryRoot)) {
            throw 'git did not return a repository root path.'
        }

        return $repositoryRoot
    }
    catch {
        throw 'Unable to resolve repository root. Run this command from inside the NeuroLogix repository.'
    }
}

function Resolve-ExistingFilePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$ParameterName,

        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        throw "Parameter -$ParameterName cannot be empty."
    }

    $resolvedCandidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path -Path $RepositoryRoot -ChildPath $Path
    }

    if (-not (Test-Path -LiteralPath $resolvedCandidate -PathType Leaf)) {
        throw "File provided to -$ParameterName was not found: '$Path' (resolved: '$resolvedCandidate')."
    }

    return (Resolve-Path -LiteralPath $resolvedCandidate).Path
}

function Resolve-CodeCliPath {
    $codeCommand = Get-Command -Name 'code.cmd' -ErrorAction SilentlyContinue
    if ($null -ne $codeCommand) {
        return $codeCommand.Source
    }

    $codeCommand = Get-Command -Name 'code' -ErrorAction SilentlyContinue
    if ($null -ne $codeCommand) {
        return $codeCommand.Source
    }

    $fallbackPath = Join-Path -Path $env:LOCALAPPDATA -ChildPath 'Programs\Microsoft VS Code\bin\code.cmd'
    if (Test-Path -LiteralPath $fallbackPath -PathType Leaf) {
        return $fallbackPath
    }

    throw 'Unable to locate the VS Code CLI (`code` or `code.cmd`). Install it from VS Code and ensure it is on PATH.'
}

try {
    $repositoryRoot = Resolve-RepositoryRoot
    $resolvedPromptFile = Resolve-ExistingFilePath -Path $PromptFile -ParameterName 'PromptFile' -RepositoryRoot $repositoryRoot

    $addFileEntries = @(
        $AddFile -split ',' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )

    if ($addFileEntries.Count -eq 0) {
        throw 'Parameter -AddFile did not contain any file paths. Provide one or more comma-separated paths.'
    }

    $resolvedAddFiles = @()
    foreach ($entry in $addFileEntries) {
        $resolvedAddFiles += Resolve-ExistingFilePath -Path $entry -ParameterName 'AddFile' -RepositoryRoot $repositoryRoot
    }

    $promptContent = Get-Content -LiteralPath $resolvedPromptFile -Raw
    if ([string]::IsNullOrWhiteSpace($promptContent)) {
        throw "Prompt file '$PromptFile' is empty."
    }

    $codeCliPath = Resolve-CodeCliPath

    $arguments = @('chat', '-m', $TargetAgent)
    foreach ($filePath in $resolvedAddFiles) {
        $arguments += @('--add-file', $filePath)
    }

    $arguments += $promptContent

    Write-Host "Dispatching mode '$Mode' to agent '$TargetAgent'..."
    & $codeCliPath @arguments

    $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
    if ($exitCode -ne 0) {
        throw "VS Code chat dispatch failed with exit code $exitCode."
    }

    Write-Host 'Dispatch completed successfully.'
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
