[CmdletBinding(DefaultParameterSetName = 'PromptText', PositionalBinding = $false)]
param(
    [Parameter()]
    [ValidateSet('ask', 'edit')]
    [string]$Mode = 'ask',

    [Parameter(Mandatory = $true)]
    [string]$TargetAgent,

    [Parameter(ParameterSetName = 'PromptText', Mandatory = $true)]
    [string]$Prompt,

    [Parameter(ParameterSetName = 'PromptFile', Mandatory = $true)]
    [string]$PromptFile,

    [Parameter()]
    [string[]]$AddFile = @(),

    [Parameter()]
    [switch]$PassPromptAsArgument,

    [Parameter()]
    [switch]$PassPromptViaStdin,

    [Parameter()]
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RepositoryRoot {
    try {
        $root = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($root)) {
            return $root.Trim()
        }
    }
    catch {
    }

    return (Get-Location).Path
}

function Normalize-AddFileValues {
    param(
        [Parameter()]
        [string[]]$RawValues
    )

    $normalized = New-Object System.Collections.Generic.List[string]
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($value in $RawValues) {
        if ([string]::IsNullOrWhiteSpace($value)) {
            continue
        }

        foreach ($candidate in ($value -split ',')) {
            $trimmed = $candidate.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed)) {
                continue
            }

            if ($seen.Add($trimmed)) {
                $normalized.Add($trimmed)
            }
        }
    }

    return $normalized.ToArray()
}

function Quote-ForDisplay {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    if ($Value -match '[\s`"'']') {
        return '"' + ($Value -replace '"', '\"') + '"'
    }

    return $Value
}

function Resolve-CodeExecutable {
    $commands = Get-Command code -All -ErrorAction SilentlyContinue
    if ($null -eq $commands) {
        return 'code'
    }

    if ($IsWindows) {
        $cmdShim = $commands | Where-Object { -not [string]::IsNullOrWhiteSpace($_.Source) -and $_.Source -match '(?i)[\\/]code\.cmd$' } | Select-Object -First 1
        if ($null -ne $cmdShim) {
            return $cmdShim.Source
        }
    }

    $namedCode = $commands | Where-Object { $_.Name -ieq 'code' } | Select-Object -First 1
    if ($null -ne $namedCode -and -not [string]::IsNullOrWhiteSpace($namedCode.Source)) {
        return $namedCode.Source
    }

    $appCommand = $commands | Where-Object { $_.CommandType -eq 'Application' -and -not [string]::IsNullOrWhiteSpace($_.Source) } | Select-Object -First 1
    if ($null -ne $appCommand) {
        return $appCommand.Source
    }

    return 'code'
}

function Get-PromptSourceLabel {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ParameterSetName,
        [Parameter()]
        [string]$ResolvedPromptFilePath
    )

    if ($ParameterSetName -eq 'PromptFile' -and -not [string]::IsNullOrWhiteSpace($ResolvedPromptFilePath)) {
        return $ResolvedPromptFilePath
    }

    return '<inline-prompt>'
}

function Ensure-PathInList {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[string]]$List,
        [Parameter(Mandatory = $true)]
        [string]$PathToAdd
    )

    $alreadyExists = $false
    foreach ($item in $List) {
        if ($item -eq $PathToAdd) {
            $alreadyExists = $true
            break
        }
    }

    if (-not $alreadyExists) {
        $List.Add($PathToAdd)
    }
}

function Test-IsTemplateSourceFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPath
    )

    $normalized = $ResolvedPath -replace '/', '\\'

    if ($normalized -match '\\.github\\prompts\\' -or $normalized -match '\\.github\\templates\\') {
        return $true
    }

    if ($normalized -match '\\.prompt\.md$') {
        return $true
    }

    return $false
}

function Test-IsStaticPromptAttachment {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPath
    )

    $normalized = $ResolvedPath -replace '/', '\\'

    if ($normalized -match '\\.github\\prompts\\') {
        return $true
    }

    if ($normalized -match '\\.prompt\\.md$') {
        return $true
    }

    return $false
}

function Test-HandoffPayload {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Handoff,
        [Parameter(Mandatory = $true)]
        [string]$TargetAgent
    )

    $errors = [System.Collections.Generic.List[string]]::new()
    $warnings = [System.Collections.Generic.List[string]]::new()

    if (-not $Handoff.TrimStart().StartsWith('[Context]')) {
        $errors.Add('Handoff payload must start with [Context].')
    }

    $requiredHeaderFields = @(
        'Work Item:',
        'Chain Step:',
        'Target Agent:',
        'Source:',
        'Status:'
    )

    foreach ($field in $requiredHeaderFields) {
        if (-not ($Handoff -match ('(?mi)^\s*' + [regex]::Escape($field)))) {
            $errors.Add("Missing required header field: $field")
        }
    }

    $requiredSections = @(
        'Objective',
        'Required Actions',
        'Forbidden Actions',
        'Files to Inspect',
        'Acceptance Criteria',
        'Required GitHub Updates',
        'Validation Expectations',
        'Final Command Requirement'
    )

    foreach ($section in $requiredSections) {
        if (-not ($Handoff -match ('(?mi)^\s*' + [regex]::Escape($section) + '\s*$'))) {
            $errors.Add("Missing required section: $section")
        }
    }

    $targetAgentMatch = [regex]::Match($Handoff, '(?mi)^\s*Target Agent:\s*(?<agent>.+?)\s*$')
    if ($targetAgentMatch.Success) {
        $declaredAgent = $targetAgentMatch.Groups['agent'].Value.Trim().Trim('"')
        $normalizedDeclaredAgent = $declaredAgent.ToLowerInvariant()
        $normalizedParameterAgent = $TargetAgent.ToLowerInvariant()

        if ($normalizedDeclaredAgent -ne $normalizedParameterAgent) {
            $errors.Add("Target agent mismatch: header declares '$declaredAgent' but -TargetAgent is '$TargetAgent'.")
        }
    }

    $hasCodeChatDispatch = ($Handoff -match '(?mi)code\s+chat\s+-m')
    $hasHelperDispatch = ($Handoff -match '(?mi)(?:^|\s)(?:\.\\)?\.utils[\\/]dispatch-code-chat\.ps1(?:\s|$)')

    if (-not ($hasCodeChatDispatch -or $hasHelperDispatch)) {
        $warnings.Add('Final command requirement does not appear to contain a dispatch command (`.utils/dispatch-code-chat.ps1` or `code chat -m`).')
    }

    if ($Handoff -match '(?mi)\$handoff') {
        $errors.Add('Final command requirement must not include "$handoff" positional prompt transport. Use `.utils/dispatch-code-chat.ps1` with `-PromptFile` instead.')
    }

    return [PSCustomObject]@{
        Errors = $errors.ToArray()
        Warnings = $warnings.ToArray()
    }
}

$repositoryRoot = Resolve-RepositoryRoot
Push-Location -LiteralPath $repositoryRoot

try {
    if ($Mode -ne 'ask') {
        throw "Unsupported -Mode '$Mode'. This helper currently supports only -Mode ask."
    }

    $resolvedPromptFile = $null

    $handoff = if ($PSCmdlet.ParameterSetName -eq 'PromptFile') {
        $resolvedPromptFile = Resolve-Path -LiteralPath $PromptFile -ErrorAction Stop

        if (Test-IsTemplateSourceFile -ResolvedPath $resolvedPromptFile.Path) {
            throw "-PromptFile points to a template/prompt file ($($resolvedPromptFile.Path)). Provide a concrete handoff payload file (for example, planning/handoff-to-<agent>-issue-<id>.md)."
        }

        Get-Content -LiteralPath $resolvedPromptFile -Raw -ErrorAction Stop
    }
    else {
        $Prompt
    }

    if ([string]::IsNullOrWhiteSpace($handoff)) {
        throw 'Handoff prompt content is empty. Provide -Prompt or a non-empty -PromptFile.'
    }

    $validation = Test-HandoffPayload -Handoff $handoff -TargetAgent $TargetAgent

    foreach ($warning in $validation.Warnings) {
        Write-Warning $warning
    }

    if ($validation.Errors.Count -gt 0) {
        $errorText = ($validation.Errors | ForEach-Object { "- $_" }) -join [Environment]::NewLine
        throw ("Handoff payload failed validation:" + [Environment]::NewLine + $errorText)
    }

    $normalizedAddFiles = Normalize-AddFileValues -RawValues $AddFile
    $addFileList = [System.Collections.Generic.List[string]]::new()
    foreach ($file in $normalizedAddFiles) {
        $resolvedFile = Resolve-Path -LiteralPath $file -ErrorAction Stop

        if (Test-IsStaticPromptAttachment -ResolvedPath $resolvedFile.Path) {
            throw "-AddFile includes a static prompt template ($($resolvedFile.Path)). Use dynamic handoff content via -Prompt or a generated -PromptFile instead."
        }

        $addFileList.Add($resolvedFile.Path)
    }

    $tempHandoffFile = $null
    $useAttachmentMode = (-not $PassPromptAsArgument -and -not $PassPromptViaStdin)

    if ($useAttachmentMode) {
        if ($PSCmdlet.ParameterSetName -eq 'PromptFile') {
            Ensure-PathInList -List $addFileList -PathToAdd $resolvedPromptFile.Path
        }
        else {
            $tempHandoffFile = Join-Path ([System.IO.Path]::GetTempPath()) ("code-chat-handoff-" + [guid]::NewGuid().ToString() + ".md")
            Set-Content -LiteralPath $tempHandoffFile -Value $handoff -Encoding UTF8
            Ensure-PathInList -List $addFileList -PathToAdd $tempHandoffFile
        }
    }

    $codeArgs = @('chat', '-m', $TargetAgent)

    foreach ($file in $addFileList) {
        $codeArgs += @('--add-file', $file)
    }

    if ($PassPromptAsArgument) {
        $codeArgs += $handoff
    }
    elseif ($PassPromptViaStdin) {
        $codeArgs += 'The authoritative handoff is provided on stdin. Follow it exactly, including the [Context] header and required sections.'
        $codeArgs += '-'
    }
    else {
        $codeArgs += 'Execute the attached handoff file as authoritative instructions. Start by reading the attachment fully before taking action.'
    }

    if ($DryRun) {
        $displayArgs = $codeArgs | ForEach-Object { Quote-ForDisplay -Value $_ }
        Write-Host ('Dry run command:' + [Environment]::NewLine + 'code ' + ($displayArgs -join ' '))
        if ($PassPromptAsArgument) {
            Write-Host 'Prompt transport: argument'
        }
        elseif ($PassPromptViaStdin) {
            Write-Host 'Prompt transport: stdin'
        }
        else {
            Write-Host 'Prompt transport: attachment'
        }
        $resolvedPromptFilePath = if ($null -ne $resolvedPromptFile) { $resolvedPromptFile.Path } else { $null }
        $promptSourceLabel = Get-PromptSourceLabel -ParameterSetName $PSCmdlet.ParameterSetName -ResolvedPromptFilePath $resolvedPromptFilePath
        Write-Host ("Dispatch validation: passed | Target Agent: {0} | Prompt Source: {1} | Attachments: {2}" -f $TargetAgent, $promptSourceLabel, $addFileList.Count)
        return
    }

    $codeExecutable = Resolve-CodeExecutable
    $displayArgs = $codeArgs | ForEach-Object { Quote-ForDisplay -Value $_ }
    $resolvedPromptFilePath = if ($null -ne $resolvedPromptFile) { $resolvedPromptFile.Path } else { $null }
    $promptSourceLabel = Get-PromptSourceLabel -ParameterSetName $PSCmdlet.ParameterSetName -ResolvedPromptFilePath $resolvedPromptFilePath
    Write-Host ("Dispatch executable: {0}" -f $codeExecutable)
    Write-Host ("Dispatch start: Target Agent={0} | Prompt Source={1} | Attachments={2}" -f $TargetAgent, $promptSourceLabel, $addFileList.Count)
    Write-Host ('Dispatch command: code ' + ($displayArgs -join ' '))

    $dispatchExitCode = $null

    try {
        if ($PassPromptViaStdin) {
            $tempPromptFile = [System.IO.Path]::GetTempFileName()
            try {
                Set-Content -LiteralPath $tempPromptFile -Value $handoff -Encoding UTF8

                $process = Start-Process -FilePath $codeExecutable -ArgumentList $codeArgs -RedirectStandardInput $tempPromptFile -PassThru -Wait
                $dispatchExitCode = if ($null -eq $process.ExitCode) { 0 } else { $process.ExitCode }
                if ($dispatchExitCode -ne 0) {
                    throw "code chat exited with code $dispatchExitCode."
                }
            }
            finally {
                if (Test-Path -LiteralPath $tempPromptFile) {
                    Remove-Item -LiteralPath $tempPromptFile -Force -ErrorAction SilentlyContinue
                }
            }
        }
        else {
            & $codeExecutable @codeArgs

            $dispatchExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
            if ($dispatchExitCode -ne 0) {
                throw "code chat exited with code $dispatchExitCode."
            }
        }
    }
    finally {
        if ($null -ne $tempHandoffFile -and (Test-Path -LiteralPath $tempHandoffFile)) {
            Remove-Item -LiteralPath $tempHandoffFile -Force -ErrorAction SilentlyContinue
        }
    }

    if ($null -eq $dispatchExitCode) {
        $dispatchExitCode = 0
    }

    $global:LASTEXITCODE = $dispatchExitCode
    Write-Host ("Dispatch success: Target Agent={0} | Exit Code={1}" -f $TargetAgent, $dispatchExitCode)
}
finally {
    Pop-Location
}
