# Framework Monitoring Rubric

> **Category:** Framework Audit
> **File:** `framework-audit/monitoring-rubric.prompt.md`

---

## Purpose

Real-time monitoring of framework audit execution. Track metrics, detect failures, abort on critical errors, and provide live progress updates.

## When to Use

- During synthetic task execution
- Concurrent with task battery
- For live audit status updates

## Inputs Required

- Audit plan (expected outcomes)
- Task execution logs
- Real-time framework state

## Outputs Required

```markdown
## Real-Time Monitoring Dashboard

**Audit Mode:** [FAST|STANDARD|THOROUGH]
**Start Time:** [timestamp]
**Elapsed:** [XX:XX]
**Estimated Remaining:** [XX:XX]

### Progress

Tasks: ⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜ 3/12 (25%)

### Current Task

**T-007:** Update Component Props  
**Status:** In Progress (Frontend Engineer → QA Test Engineer)  
**Started:** 14:23:15  
**Duration:** 8 min (expected: 12 min)  
**Handoffs:** 2 (expected: 3)

### Metrics So Far

| Metric                | Current | Expected | Status |
| --------------------- | ------- | -------- | ------ |
| Avg Execution Time    | 11 min  | 12 min   | ✅     |
| Avg Handoffs          | 2.7     | 3.0      | ✅     |
| Express Lane Usage    | 33%     | 25%      | ✅     |
| Task Success Rate     | 100%    | 100%     | ✅     |
| Quality Gate Failures | 0       | 0        | ✅     |

### Failures Detected

None

### Warnings

- Task T-006 took 13 min (expected 10 min) - within tolerance
- Quality gate G4 (build) took 45s (target: 30s) - performance concern

### Next Actions

1. Continue with Task T-008 (Add Error Logging)
2. Monitor quality gate performance
3. Update progress every 5 minutes
```

## Workflow Steps

### 1. Setup Monitoring Infrastructure

Create PowerShell monitoring script:

```powershell
# monitoring-dashboard.ps1

$auditStart = Get-Date
$taskCount = 12
$tasksCompleted = 0
$metrics = @{
    executionTimes = @()
    handoffCounts = @()
    expressLaneUsed = 0
    failures = @()
    warnings = @()
}

function Update-Dashboard {
    Clear-Host
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " FRAMEWORK AUDIT - REAL-TIME MONITORING" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $elapsed = (Get-Date) - $auditStart
    $progress = [Math]::Round(($tasksCompleted / $taskCount) * 100)

    Write-Host "Mode: STANDARD" -ForegroundColor White
    Write-Host "Start: $($auditStart.ToString('HH:mm:ss'))" -ForegroundColor White
    Write-Host "Elapsed: $($elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor White
    Write-Host ""

    # Progress bar
    $bar = ""
    for ($i = 0; $i -lt $taskCount; $i++) {
        if ($i -lt $tasksCompleted) {
            $bar += "█"
        } else {
            $bar += "░"
        }
    }
    Write-Host "Progress: $bar $tasksCompleted/$taskCount ($progress%)" -ForegroundColor Green
    Write-Host ""

    # Current task
    if ($global:currentTask) {
        Write-Host "Current Task:" -ForegroundColor Yellow
        Write-Host "  $($global:currentTask.id): $($global:currentTask.name)" -ForegroundColor White
        Write-Host "  Status: $($global:currentTask.status)" -ForegroundColor White
        Write-Host "  Duration: $($global:currentTask.duration) min" -ForegroundColor White
        Write-Host ""
    }

    # Metrics
    if ($metrics.executionTimes.Count -gt 0) {
        $avgExec = ($metrics.executionTimes | Measure-Object -Average).Average
        $avgHandoffs = ($metrics.handoffCounts | Measure-Object -Average).Average
        $expressRate = [Math]::Round(($metrics.expressLaneUsed / $tasksCompleted) * 100)

        Write-Host "Metrics So Far:" -ForegroundColor Cyan
        Write-Host "  Avg Execution Time: $([Math]::Round($avgExec, 1)) min" -ForegroundColor White
        Write-Host "  Avg Handoffs: $([Math]::Round($avgHandoffs, 1))" -ForegroundColor White
        Write-Host "  Express Lane Usage: $expressRate%" -ForegroundColor White
        Write-Host "  Success Rate: $(100 - (($metrics.failures.Count / $tasksCompleted) * 100))%" -ForegroundColor White
        Write-Host ""
    }

    # Failures
    if ($metrics.failures.Count -gt 0) {
        Write-Host "Failures:" -ForegroundColor Red
        foreach ($failure in $metrics.failures) {
            Write-Host "  ❌ $failure" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Warnings
    if ($metrics.warnings.Count -gt 0) {
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $metrics.warnings) {
            Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

# Run dashboard update every 5 seconds
while ($tasksCompleted -lt $taskCount) {
    Update-Dashboard
    Start-Sleep -Seconds 5
}

Write-Host "AUDIT COMPLETE" -ForegroundColor Green
```

### 2. Track Task Execution

For each task, capture:

```powershell
# Before task starts
$taskStart = Get-Date
$global:currentTask = @{
    id = "T-007"
    name = "Update Component Props"
    status = "Dispatching to Chief of Staff"
    duration = 0
}

# During task (update status)
$global:currentTask.status = "Frontend Engineer → QA Test Engineer"
$global:currentTask.duration = ((Get-Date) - $taskStart).TotalMinutes

# After task completes
$taskEnd = Get-Date
$duration = ($taskEnd - $taskStart).TotalMinutes
$metrics.executionTimes += $duration
$metrics.handoffCounts += 3
if ($expressLaneUsed) { $metrics.expressLaneUsed++ }
$tasksCompleted++
```

### 3. Detect Failures

Monitor for failure modes:

```powershell
# Deadlock detection (no progress for 15 min)
if (((Get-Date) - $lastProgressUpdate).TotalMinutes -gt 15) {
    $metrics.failures += "DEADLOCK: No progress for 15 minutes"
    Write-Host "🚨 ABORTING: Deadlock detected" -ForegroundColor Red
    exit 1
}

# Task failure rate
$failureRate = ($metrics.failures.Count / $tasksCompleted) * 100
if ($failureRate -gt 50) {
    Write-Host "🚨 ABORTING: Failure rate $failureRate% exceeds 50%" -ForegroundColor Red
    exit 1
}

# Execution time exceeded
if ($elapsed.TotalHours -gt ($expectedDuration * 2)) {
    Write-Host "🚨 ABORTING: Execution time exceeded 2x expected" -ForegroundColor Red
    exit 1
}

# Critical errors
if (Test-Path ".github/.audit-abort") {
    $reason = Get-Content ".github/.audit-abort"
    Write-Host "🚨 ABORTING: $reason" -ForegroundColor Red
    exit 1
}
```

### 4. Generate Warnings

Identify concerning trends:

```powershell
# Task took longer than expected
if ($duration -gt ($expectedDuration * 1.2)) {
    $metrics.warnings += "Task $taskId took $([Math]::Round($duration, 1)) min (expected $expectedDuration min)"
}

# Quality gate slow
if ($gateTime -gt ($targetGateTime * 1.5)) {
    $metrics.warnings += "Quality gate $gateName took $gateTime s (target $targetGateTime s)"
}

# Handoffs exceeded
if ($actualHandoffs -gt ($expectedHandoffs + 1)) {
    $metrics.warnings += "Task $taskId had $actualHandoffs handoffs (expected $expectedHandoffs)"
}

# Low express lane usage
if (($metrics.expressLaneUsed / $tasksCompleted) -lt 0.15) {
    $metrics.warnings += "Express lane usage $expressRate% below target 25%"
}
```

### 5. Update Progress

Update dashboard every 5 seconds (during execution) or 30 seconds (between tasks).

## Quality Expectations

- Dashboard updates in real-time (<5 sec lag)
- Failures detected within 1 minute
- Abort triggers work correctly
- Metrics calculated accurately
- Warnings are actionable (not noise)

## Failure Cases

- Monitoring script crashes → Manual tracking
- Cannot parse handoff logs → Estimate handoff count
- Deadlock not detected → Manual abort after 30 min no progress

## Evidence Expectations

- Monitoring log (timestamped events)
- Metrics snapshot every 5 minutes
- Failure/warning log
- Final metrics at completion

---

## Example Monitoring Log

```
[14:00:00] AUDIT START - Mode: STANDARD, Tasks: 12
[14:00:05] Baseline captured
[14:00:10] Task T-001 started (Fix Typo)
[14:05:15] Task T-001 completed (5 min, 2 handoffs, express lane: Yes)
[14:05:20] Task T-002 started (Update Changelog)
[14:10:25] Task T-002 completed (5 min, 2 handoffs, express lane: Yes)
[14:10:30] Task T-006 started (Add Unit Test)
[14:23:45] Task T-006 completed (13 min, 2 handoffs, express lane: Yes)
[14:23:45] ⚠️  WARNING: Task T-006 took 13 min (expected 10 min)
[14:23:50] Task T-007 started (Update Component Props)
[14:36:00] Task T-007 completed (12 min, 3 handoffs, express lane: No)
...
[18:30:00] Task T-017 completed (45 min, 5 handoffs, express lane: No)
[18:30:05] AUDIT COMPLETE - Total: 4h 30m, Tasks: 12/12, Failures: 0
```

---

## Abort Scenarios

### Scenario 1: Deadlock Detected

```
[15:30:00] Task T-013 started (Refactor Shared Utility)
[15:35:00] Task T-013 status: Tech Lead → Engineer (handoff created)
[15:40:00] Task T-013 status: No change (waiting for Engineer)
[15:45:00] Task T-013 status: No change (waiting for Engineer)
[15:50:00] ⚠️  WARNING: No progress for 15 minutes
[15:50:05] 🚨 ABORTING: Deadlock detected
[15:50:10] Escalating to Chief of Staff
```

### Scenario 2: High Failure Rate

```
[16:00:00] Task T-008 FAILED (quality gates - lint errors)
[16:15:00] Task T-009 FAILED (missing ADR template)
[16:30:00] Task T-011 FAILED (accessibility violations)
[16:30:05] Failure rate: 60% (3/5 tasks failed)
[16:30:10] 🚨 ABORTING: Failure rate exceeds 50%
[16:30:15] Escalating to Chief of Staff + Quality Director
```

### Scenario 3: Critical Framework Error

```
[17:00:00] Task T-016 started (Design Caching Layer)
[17:05:00] ERROR: Routing optimizer crashed
[17:05:05] ERROR: Cannot dispatch to Solution Architect
[17:05:10] 🚨 ABORTING: Critical framework error (routing failure)
[17:05:15] Emergency escalation to Chief of Staff
```

---

## Handoff to Next Prompt

After all tasks complete (or audit aborted), proceed to:

- **Next Prompt:** `framework-audit/scoring-metrics.prompt.md`
- **Input:** Monitoring log, metrics data, task results
- **Task:** Calculate 12 performance metrics and assign grade
