# Framework Scoring Metrics

> **Category:** Framework Audit **File:**
> `framework-audit/scoring-metrics.prompt.md`

---

## Purpose

Calculate 12 performance metrics from audit execution data. Compare against
targets from Issue #<WORK_ITEM_ID>. Assign overall grade (A-F) based on rubric.

## When to Use

- After synthetic task execution completes
- Before generating final report
- To quantify framework performance

## Inputs Required

- Monitoring log (all task execution data)
- Baseline framework state
- Performance targets (Issue #<WORK_ITEM_ID>)

## Outputs Required

```markdown
## Framework Performance Metrics

**Audit Mode:** [FAST|STANDARD|THOROUGH] **Date:** [YYYY-MM-DD] **Tasks
Executed:** [N] **Overall Grade:** [A|B|C|D|F]

### Metric Scorecard

| #   | Metric                   | Formula                           | Current | Target | Status |
| --- | ------------------------ | --------------------------------- | ------- | ------ | ------ |
| 1   | Avg Execution Time       | ΣTime / N                         | 18 min  | 15 min | ⚠️     |
| 2   | Avg Handoff Count        | ΣHandoffs / N                     | 3.8     | 3-4    | ✅     |
| 3   | Express Lane Usage       | ExpressLane / N × 100%            | 35%     | 40%    | ⚠️     |
| 4   | Routing Accuracy         | CorrectRoutes / N × 100%          | 96%     | >95%   | ✅     |
| 5   | Quality Gate Pass Rate   | PassedGates / TotalGates × 100%   | 98%     | >95%   | ✅     |
| 6   | Quality Gate Exec Time   | ΣGateTime / TotalGates            | 3.2 min | 3 min  | ⚠️     |
| 7   | Avg Handoff Payload Size | ΣPayloadSize / Handoffs           | 45 KB   | <50 KB | ✅     |
| 8   | Telemetry Overhead       | TelemetryTime / TotalTime × 100%  | 0.8%    | <1%    | ✅     |
| 9   | Task Completion Rate     | Completed / N × 100%              | 100%    | >98%   | ✅     |
| 10  | Deadlock Detection Rate  | Deadlocks / N × 100%              | 0%      | 0%     | ✅     |
| 11  | Error Rate               | Errors / N × 100%                 | 0%      | <1%    | ✅     |
| 12  | Agent Utilization        | UniqueAgents / TotalAgents × 100% | 74%     | >70%   | ✅     |

### Grade Calculation

**Metrics Met:** 9 / 12 (75%)

**Grade:** B

- A: ≥95% metrics met (11-12 of 12)
- B: ≥75% metrics met (9-10 of 12)
- C: ≥50% metrics met (6-8 of 12)
- D: ≥25% metrics met (3-5 of 12)
- F: <25% metrics met (0-2 of 12)

### Performance Targets (Issue #<WORK_ITEM_ID>)

| Target               | Goal            | Actual | Status |
| -------------------- | --------------- | ------ | ------ |
| Faster Execution     | 70% reduction   | 64%    | ⚠️     |
| Fewer Handoffs       | 40% reduction   | 31%    | ❌     |
| Faster Feedback Loop | 50% improvement | 45%    | ⚠️     |
| Framework Confidence | 90%             | 88%    | ⚠️     |

**Targets Met:** 0 / 4

**Overall Grade:** B (metrics) → C (adjusted for targets not met)
```

## 12 Metrics Definitions

### 1. Average Execution Time

**Formula:** `(Σ task durations) / (number of tasks)`

**Data Source:** Monitoring log (task start/end timestamps)

**Calculation:**

```powershell
$executionTimes = @(5, 5, 10, 12, 12, 15, 25, 30, 20, 30, 50, 45) # minutes
$avgExecutionTime = ($executionTimes | Measure-Object -Average).Average
# Result: 21.6 min
```

**Target:** <15 min (for simple tasks), <25 min (for medium tasks)

**Status:**

- ✅ If actual ≤ target
- ⚠️ If actual ≤ target × 1.2
- ❌ If actual > target × 1.2

---

### 2. Average Handoff Count

**Formula:** `(Σ handoffs per task) / (number of tasks)`

**Data Source:** GitHub handoff comments (Issue/PR comment bodies)

**Calculation:**

```powershell
$handoffCounts = @(2, 2, 2, 3, 3, 2, 4, 5, 4, 5, 7, 5)
$avgHandoffs = ($handoffCounts | Measure-Object -Average).Average
# Result: 3.67
```

**Target:** 3-4 handoffs (40% reduction from baseline 5-6)

**Status:**

- ✅ If 3 ≤ actual ≤ 4
- ⚠️ If 2.5 ≤ actual < 3 OR 4 < actual ≤ 4.5
- ❌ If actual < 2.5 OR actual > 4.5

---

### 3. Express Lane Usage Rate

**Formula:** `(tasks using express lane) / (total tasks) × 100%`

**Data Source:** Task execution log (express lane flag)

**Calculation:**

```powershell
$expressLaneTasks = @("T-001", "T-002", "T-006", "T-003") # 4 tasks
$totalTasks = 12
$expressLaneRate = ($expressLaneTasks.Count / $totalTasks) * 100
# Result: 33.3%
```

**Target:** ≥40% (from ADR-FW001)

**Status:**

- ✅ If actual ≥ 40%
- ⚠️ If 30% ≤ actual < 40%
- ❌ If actual < 30%

---

### 4. Routing Accuracy

**Formula:** `(correctly routed tasks) / (total tasks) × 100%`

**Data Source:** Task validation (expected chain vs actual chain)

**Calculation:**

```powershell
# Expected: Chief → Doc Engineer → QD
# Actual:   Chief → Doc Engineer → QD
# Result: Correct

$correctRoutes = 11  # 11 of 12 tasks routed correctly
$totalTasks = 12
$routingAccuracy = ($correctRoutes / $totalTasks) * 100
# Result: 91.7%
```

**Target:** >95%

**Status:**

- ✅ If actual ≥ 95%
- ⚠️ If 90% ≤ actual < 95%
- ❌ If actual < 90%

---

### 5. Quality Gate Pass Rate

**Formula:** `(passed quality gates) / (total quality gate runs) × 100%`

**Data Source:** Quality gate execution logs

**Calculation:**

```powershell
# 12 tasks × 10 gates each = 120 total gate runs
# 118 passed, 2 failed (1 lint, 1 test)
$passedGates = 118
$totalGates = 120
$passRate = ($passedGates / $totalGates) * 100
# Result: 98.3%
```

**Target:** >95%

**Status:**

- ✅ If actual ≥ 95%
- ⚠️ If 90% ≤ actual < 95%
- ❌ If actual < 90%

---

### 6. Quality Gate Execution Time

**Formula:** `(Σ quality gate durations) / (number of tasks)`

**Data Source:** Quality gate timestamps

**Calculation:**

```powershell
# Average time for all 10 gates per task
$gateTimes = @(3.5, 3.2, 2.8, 3.0, 3.1, 3.4, 3.3, 2.9, 3.0, 3.2, 3.5, 3.1) # minutes
$avgGateTime = ($gateTimes | Measure-Object -Average).Average
# Result: 3.17 min
```

**Target:** <3 min (from ADR-FW003: 50% faster, 6 min → 3 min)

**Status:**

- ✅ If actual ≤ 3 min
- ⚠️ If 3 < actual ≤ 4 min
- ❌ If actual > 4 min

---

### 7. Average Handoff Payload Size

**Formula:** `(Σ handoff comment payload sizes in KB) / (number of handoffs)`

**Data Source:** Handoff comment bodies (`gh issue view --comments` /
`gh pr view --comments`)

**Calculation:**

```powershell
$comments = gh pr view 123 --json comments --jq '.comments[].body'
$payloadSizes = $comments | ForEach-Object { (($_ | Out-String).Length / 1KB) }
$avgPayloadSize = ($payloadSizes | Measure-Object -Average).Average
# Result: 45.3 KB
```

**Target:** <50 KB (from ADR-FW002: delta-based handoffs reduce size)

**Status:**

- ✅ If actual ≤ 50 KB
- ⚠️ If 50 < actual ≤ 75 KB
- ❌ If actual > 75 KB

---

### 8. Telemetry Overhead

**Formula:** `(telemetry time) / (total execution time) × 100%`

**Data Source:** Telemetry performance metrics

**Calculation:**

```powershell
# Total execution: 260 min
# Telemetry time: 2.1 min (tracked in telemetry events)
$telemetryTime = 2.1
$totalTime = 260
$overhead = ($telemetryTime / $totalTime) * 100
# Result: 0.81%
```

**Target:** <1% (from ADR-FW005: <10ms per event)

**Status:**

- ✅ If actual ≤ 1%
- ⚠️ If 1% < actual ≤ 2%
- ❌ If actual > 2%

---

### 9. Task Completion Rate

**Formula:** `(completed tasks) / (total tasks) × 100%`

**Data Source:** Task execution log

**Calculation:**

```powershell
$completedTasks = 12
$totalTasks = 12
$completionRate = ($completedTasks / $totalTasks) * 100
# Result: 100%
```

**Target:** >98%

**Status:**

- ✅ If actual ≥ 98%
- ⚠️ If 95% ≤ actual < 98%
- ❌ If actual < 95%

---

### 10. Deadlock Detection Rate

**Formula:** `(deadlocks detected) / (total tasks) × 100%`

**Data Source:** Monitoring log (deadlock warnings)

**Calculation:**

```powershell
$deadlocks = 0
$totalTasks = 12
$deadlockRate = ($deadlocks / $totalTasks) * 100
# Result: 0%
```

**Target:** 0%

**Status:**

- ✅ If actual = 0%
- ❌ If actual > 0%

---

### 11. Error Rate

**Formula:** `(tasks with errors) / (total tasks) × 100%`

**Data Source:** Task execution log (errors, exceptions)

**Calculation:**

```powershell
$tasksWithErrors = 0
$totalTasks = 12
$errorRate = ($tasksWithErrors / $totalTasks) * 100
# Result: 0%
```

**Target:** <1%

**Status:**

- ✅ If actual ≤ 1%
- ⚠️ If 1% < actual ≤ 2%
- ❌ If actual > 2%

---

### 12. Agent Utilization

**Formula:** `(unique agents used) / (total agents) × 100%`

**Data Source:** Agent dispatch logs

**Calculation:**

```powershell
# Agents used: Chief, Tech Lead, Frontend, Backend, QA, Security, Doc, Solution Architect, Quality Director, Performance, Red Team, Platform (12 agents)
# Total agents: 27
$uniqueAgents = 12
$totalAgents = 27
$utilization = ($uniqueAgents / $totalAgents) * 100
# Result: 44.4%
```

**Target:** >50% (diverse agent coverage)

**Status:**

- ✅ If actual ≥ 50%
- ⚠️ If 30% ≤ actual < 50%
- ❌ If actual < 30%

---

## Grade Rubric

### Step 1: Count Metrics Met

Count how many metrics have status ✅:

```powershell
$metricsMet = 9  # Out of 12
$metricsPercentage = ($metricsMet / 12) * 100  # 75%
```

### Step 2: Assign Letter Grade

| Grade | Criteria         | Metrics Met |
| ----- | ---------------- | ----------- |
| A     | ≥95% metrics met | 11-12 of 12 |
| B     | ≥75% metrics met | 9-10 of 12  |
| C     | ≥50% metrics met | 6-8 of 12   |
| D     | ≥25% metrics met | 3-5 of 12   |
| F     | <25% metrics met | 0-2 of 12   |

```powershell
$grade = if ($metricsPercentage -ge 95) { "A" }
         elseif ($metricsPercentage -ge 75) { "B" }
         elseif ($metricsPercentage -ge 50) { "C" }
         elseif ($metricsPercentage -ge 25) { "D" }
         else { "F" }
# Result: B
```

### Step 3: Check Performance Targets (Issue #<WORK_ITEM_ID>)

Check 4 main targets:

1. **70% faster execution:** `(baseline - actual) / baseline × 100%`
   - Baseline simple task: 50 min
   - Actual simple task: 18 min
   - Improvement: 64%
   - Status: ⚠️ (below 70%)

2. **40% fewer handoffs:** `(baseline - actual) / baseline × 100%`
   - Baseline: 5.5 handoffs
   - Actual: 3.8 handoffs
   - Reduction: 31%
   - Status: ❌ (below 40%)

3. **50% faster feedback:** Developer loop time improvement
   - Baseline: 6 min quality gates
   - Actual: 3.2 min quality gates
   - Improvement: 47%
   - Status: ⚠️ (below 50%)

4. **90% framework confidence:** Composite metric
   - Routing accuracy: 96% ✅
   - Completion rate: 100% ✅
   - Error rate: 0% ✅
   - Deadlock rate: 0% ✅
   - Confidence: 88% (avg of 4)
   - Status: ⚠️ (below 90%)

**Targets Met:** 0 of 4 fully met

### Step 4: Adjust Grade for Targets

If 0 targets met, downgrade by 1 letter:

- B → C

**Final Grade:** C

---

## Quality Expectations

- All 12 metrics calculated from real data (no estimates)
- Formulas applied correctly
- Targets sourced from Issue #<WORK_ITEM_ID> and ADRs
- Grade assignment follows rubric exactly
- Statistical analysis for THOROUGH mode (P50, P95, P99)

## Failure Cases

- Missing data → Cannot calculate metric → Mark as "Unknown"
- Incomplete audit (aborted) → Mark partial results
- No baseline → Use targets as baseline

## Evidence Expectations

- Metrics scorecard (markdown table)
- Raw data (CSV or JSON)
- Calculation formulas shown
- Grade justification

---

## Handoff to Next Prompt

After metrics calculated, proceed to:

- **Next Prompt:** `framework-audit/final-report.prompt.md`
- **Input:** Metrics scorecard, grade, raw data
- **Task:** Generate comprehensive audit report
