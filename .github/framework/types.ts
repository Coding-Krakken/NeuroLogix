/**
 * Shared TypeScript types for the agentic framework.
 * @module framework/types
 */

// ============================================================================
// Core Agent + Task Types
// ============================================================================

export type AgentId =
  | "00-chief-of-staff"
  | "product-owner"
  | "program-manager"
  | "stakeholder-executive"
  | "solution-architect"
  | "tech-lead"
  | "frontend-engineer"
  | "backend-engineer"
  | "platform-engineer"
  | "data-engineer"
  | "ml-engineer"
  | "ux-designer"
  | "accessibility-specialist"
  | "qa-test-engineer"
  | "performance-engineer"
  | "security-engineer"
  | "privacy-compliance-officer"
  | "devops-engineer"
  | "sre-engineer"
  | "documentation-engineer"
  | "support-readiness-engineer"
  | "legal-counsel"
  | "finance-procurement"
  | "localization-specialist"
  | "incident-commander"
  | "red-team"
  | "quality-director";

export type Priority = "P0" | "P1" | "P2" | "P3";
export type TaskType =
  | "Feature"
  | "Bug"
  | "Refactor"
  | "Docs"
  | "Security"
  | "Performance"
  | "Incident";
export type TaskScope = "Small" | "Medium" | "Large";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  scope: TaskScope;
  priority: Priority;
  acceptanceCriteria: string[];
}

export type TaskStatus =
  | "queued"
  | "in_progress"
  | "blocked"
  | "completed"
  | "failed"
  | "aborted";
export type AgentStatus = "idle" | "active" | "blocked" | "offline";

// ============================================================================
// Routing Types
// ============================================================================

export interface RoutingBypassRule {
  condition: string;
  skipTo: AgentId;
  rationale: string;
}

export interface RoutingRule {
  taskType: TaskType;
  scope: TaskScope;
  defaultChain: AgentId[];
  bypasses: RoutingBypassRule[];
}

export interface RoutingDecision {
  targetAgent: AgentId;
  skipAgents: AgentId[];
  reason: string;
  confidence: number;
  expressLane: boolean;
}

// ============================================================================
// Quality Gate Types
// ============================================================================

export type QualityGateId =
  | "G1"
  | "G2"
  | "G3"
  | "G4"
  | "G5"
  | "G6"
  | "G7"
  | "G8"
  | "G9"
  | "G10";

export interface QualityGateResult {
  gate: QualityGateId;
  passed: boolean;
  duration: number;
  errors?: string[];
}

export interface QualityGate {
  id: QualityGateId;
  name: string;
  blocking: boolean;
  dependencies: QualityGateId[];
  validator: () => Promise<QualityGateResult>;
}

// ============================================================================
// Definition of Done
// ============================================================================

export interface DefinitionOfDoneInput {
  testsUpdated: boolean;
  lintPassed: boolean;
  typecheckPassed: boolean;
  docsUpdated: boolean;
  prIncludesHowToTest: boolean;
  prIncludesRiskNotes: boolean;
  acceptanceCriteriaSatisfied: boolean;
  securityReviewRequired?: boolean;
  securityReviewComplete?: boolean;
  performanceReviewRequired?: boolean;
  performanceReviewComplete?: boolean;
}

export interface DefinitionOfDoneResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
}

// ============================================================================
// Workflow Policy + Telemetry
// ============================================================================

export interface WorkflowEnforcementConfig {
  commitCheckpointMinutes: number;
  commitCheckpointFilesChanged: number;
  openPrWhenFilesChanged: number;
  openPrWhenCommitsAhead: number;
  tinyHotfixMaxFiles: number;
}

export interface WorkflowSnapshot {
  taskId: string;
  taskTitle: string;
  branchName?: string;
  issueNumber?: number;
  changedFiles: number;
  commitsAheadOfMain: number;
  minutesSinceLastCommit: number;
  acceptanceCriteriaReviewed: boolean;
  existingPrContextReviewed: boolean;
  docsUpdated: boolean;
  testsUpdated: boolean;
  lintPassed: boolean;
  typecheckPassed: boolean;
  openPullRequest?: number;
}

export interface WorkflowPolicyDecision {
  blocked: boolean;
  reasons: string[];
  requiredActions: string[];
  suggestions: string[];
  allowHotfixException: boolean;
}

export interface WorkflowTaskSummary {
  taskId: string;
  issueNumber?: number;
  issueUrl?: string;
  branchName?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  commits: Array<{
    hash: string;
    message: string;
  }>;
  metrics: {
    timeToFirstCommitMinutes?: number;
    timeToPrMinutes?: number;
    reviewIterations: number;
    commitsPerTask: number;
  };
}

// ============================================================================
// Agent Tier + Synthetic Tests
// ============================================================================

export type AgentTier = "core" | "specialist";

export interface AgentConfig {
  id: AgentId;
  tier: AgentTier;
  loadOnStartup: boolean;
  model: "claude-sonnet-4.5" | "gpt-5-mini";
  fallbackModel?: string;
  capabilities: string[];
  maxConcurrentTasks: number;
}

export type TestComplexity = "S" | "M" | "L" | "XL";
export type TestCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "docs"
  | "infra"
  | "security";

export interface SyntheticTest {
  id: string;
  name: string;
  complexity: TestComplexity;
  category: TestCategory;
  description: string;
  expectedAgentChain: AgentId[];
  expectedDuration: number;
  acceptanceCriteria: string[];
  scenario: "happy-path" | "edge-case" | "failure-mode";
}

export interface ContextCacheEntry {
  key: string;
  agentId: AgentId;
  context: string;
  createdAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
  ttl: number;
}

// ============================================================================
// Hybrid Orchestration (Phases A + B)
// ============================================================================

export type HybridMode = "sequential" | "hybrid";

export interface HybridFeatureFlags {
  hybridOrchestrationEnabled: boolean;
  parallelGraphEnabled: boolean;
  memoryHierarchyEnabled: boolean;
}

export interface HybridExecutionConfig {
  mode: HybridMode;
  flags: HybridFeatureFlags;
  maxContextTokens: number;
  l1TokenBudget: number;
  maxL2Comments: number;
}

export type ContextTier = "L1" | "L2" | "L3";

export interface ContextSlice {
  tier: ContextTier;
  source: string;
  content: string;
  estimatedTokens: number;
}

export interface ContextHierarchyResult {
  slices: ContextSlice[];
  totalEstimatedTokens: number;
  truncated: boolean;
}

export interface DependencyGraphNode {
  id: string;
  title: string;
  agent: AgentId;
  dependsOn: string[];
  priority: Priority;
}

export interface DependencyGraphValidation {
  valid: boolean;
  cyclePath?: string[];
}

export interface ScheduledNode {
  nodeId: string;
  title: string;
  agentId: AgentId;
  dependsOn: string[];
  priority: Priority;
  priorityRank: number;
  waveIndex: number;
}

export interface ScheduleWave {
  waveIndex: number;
  nodes: ScheduledNode[];
  nodeIds: string[];
}

export interface SchedulePlanNode {
  nodeId: string;
  agentId: AgentId;
  priority: Priority;
  dependsOn: string[];
  waveIndex: number;
}

export interface SchedulePlanWave {
  waveIndex: number;
  nodeIds: string[];
}

export interface SchedulePlan {
  waves: SchedulePlanWave[];
  nodes: SchedulePlanNode[];
  schedulePlanHash: string;
}

export interface DispatchConcurrencyLimits {
  maxParallelAgents: number;
  perPriorityCaps: Record<Priority, number>;
}

export interface DispatchPolicy {
  attemptTimeoutMs: number;
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  failFastFutureWaves?: boolean;
}

export type DispatchNodeStatus =
  | "queued"
  | "running"
  | "completed"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "exhausted"
  | "blocked";

export interface DispatchAttemptRecord {
  nodeId: string;
  waveIndex: number;
  attempt: number;
  status: "success" | "failure" | "timeout";
}

export type HybridDispatchEventType =
  | "hybrid.dispatch.start"
  | "hybrid.dispatch.success"
  | "hybrid.dispatch.failure"
  | "hybrid.dispatch.timeout";

export interface DispatchStartEvent {
  event: "hybrid.dispatch.start";
  seq: number;
  timestamp?: Date;
  taskId: string;
  nodeId: string;
  waveIndex: number;
  attempt: number;
  agentId: AgentId;
  priority: Priority;
  schedulePlanHash: string;
}

export interface DispatchTerminalEvent {
  event:
    | "hybrid.dispatch.success"
    | "hybrid.dispatch.failure"
    | "hybrid.dispatch.timeout";
  seq: number;
  timestamp?: Date;
  taskId: string;
  nodeId: string;
  waveIndex: number;
  attempt: number;
  agentId: AgentId;
  priority: Priority;
  schedulePlanHash: string;
  durationMs: number;
  errorMessage?: string;
}

export type DispatchLifecycleEvent = DispatchStartEvent | DispatchTerminalEvent;

export interface DispatchRunSummary {
  started: number;
  succeeded: number;
  failed: number;
  timedOut: number;
  retried: number;
}

export interface DispatchWaveResult {
  nodeStatuses: Record<string, DispatchNodeStatus>;
  dispatchSequence: Array<{ nodeId: string; attempt: number }>;
  attemptTimeline: DispatchAttemptRecord[];
  events: DispatchLifecycleEvent[];
  summary: DispatchRunSummary;
  hasTerminalFailure: boolean;
}

// ============================================================================
// GitHub Work + Handoff
// ============================================================================

export type HandoffStatus = "Done" | "Partial" | "Blocked";

export interface WorkItemContext {
  repo: string;
  issueNumber: number;
  prNumber?: number;
  branchName: string;
  agent: AgentId;
  nextAgent?: AgentId;
  runId?: string;
  taskId?: string;
  taskLabel?: string;
  chainTaskNumber?: number;
}

export interface HandoffCommentData {
  agent: AgentId;
  workItem: {
    issueNumber: number;
    prNumber?: number;
  };
  status: HandoffStatus;
  scopeCompleted: string[];
  keyDecisions: Array<{
    title: string;
    rationale: string;
    alternatives?: string;
  }>;
  changesSummary: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    notableFiles: Array<{
      path: string;
      description: string;
    }>;
    commits: Array<{
      hash: string;
      message: string;
    }>;
  };
  verification: {
    commandsRun: string[];
    expectedOutcome: string[];
    actualOutcome: string[];
    status: "Passed" | "Failed" | "Partial";
  };
  risks: string[];
  followUps: string[];
  nextAgent: AgentId;
  nextActions: string[];
  links: {
    commentUrl?: string;
    ciRunUrl?: string;
    docsUrl?: string;
    testEvidenceUrl?: string;
  };
}

export interface HandoffProviderConfig {
  provider: "github" | "file";
  githubDryRun?: boolean;
  commentTarget?: "pr_preferred" | "issue_only" | "pr_only";
  maxComments?: number;
  templatesDir?: string;
}

export interface GitHubClientConfig {
  dryRun: boolean;
  retryAttempts: number;
  retryBackoffMs: number;
}

export interface IssueCreateInput {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export interface IssueSearchFilters {
  state?: "open" | "closed" | "all";
  limit?: number;
  labels?: string[];
  assignee?: string;
  search?: string;
}

export interface IssueRef {
  id: number;
  title: string;
  url: string;
  state: "open" | "closed";
}

export interface PullRequestCreateInput {
  title: string;
  body: string;
  base: string;
  head: string;
  issueNumber: number;
  labels?: string[];
  reviewers?: string[];
}

export interface PullRequestRef {
  id: number;
  title: string;
  url: string;
  state: "OPEN" | "MERGED" | "CLOSED";
}

// ============================================================================
// Monitoring
// ============================================================================

export interface MonitoringSnapshot {
  timestamp: Date;
  tasks: {
    id: string;
    status: TaskStatus;
    agent: AgentId;
    duration: number;
    progress: number;
  }[];
  agents: {
    id: AgentId;
    status: AgentStatus;
    currentTask?: string;
    queueDepth: number;
  }[];
  bottlenecks: {
    agentId: AgentId;
    queueDepth: number;
    averageWaitTime: number;
  }[];
  loops: {
    taskId: string;
    agentId: AgentId;
    count: number;
    timestamps: Date[];
  }[];
}
