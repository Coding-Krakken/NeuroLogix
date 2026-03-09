export type WorkflowLogKind = 'terminal' | 'comment';

export interface WorkflowLogEntry {
  text: string;
  kind?: WorkflowLogKind;
  timestamp?: Date;
}

export interface HandoffWorkflowEvent {
  index: number;
  issueNumber: number;
  kind: 'dispatch' | 'completion' | 'observation';
  targetAgent?: string;
  sourceAgent?: string;
  nextTargetAgent?: string;
  handoffArtifact?: string;
  handoffUrl?: string;
  exitCode?: number;
  timestamp?: Date;
  text: string;
}

export interface IssueWorkflowTimeline {
  issueNumber: number;
  events: HandoffWorkflowEvent[];
  dispatches: number;
  completions: number;
  failedDispatches: number;
  gaps: string[];
}

export interface HandoffWorkflowReport {
  issues: IssueWorkflowTimeline[];
}

const ISSUE_NUMBER_PATTERN = /(?:Issue\s*#|\[Issue#|gh issue comment\s+)(\d+)/i;
const ISSUE_URL_PATTERN = /\/issues\/(\d+)/i;
const DISPATCH_COMMAND_PATTERN = /code\s+chat\s+-m\s+([a-z0-9-]+)/i;
const DISPATCH_SUMMARY_PATTERN = /Dispatch command executed to\s+[`'"]?([a-z0-9-]+)[`'"]?/i;
const NEXT_TARGET_PATTERN = /Next routing target(?:\s+after[^:]+)?:\s*[`'"]?([a-z0-9-]+)[`'"]?/i;
const HANDOFF_ARTIFACT_PATTERN = /(\.github\/.handoffs\/[a-z0-9-]+\/handoff-[^\s`'"]+\.md)/i;
const HANDOFF_URL_PATTERN =
  /(https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues|pull)\/\d+#(?:issuecomment|discussion_r)\d+)/i;
const EXIT_CODE_PATTERN = /(?:exit code|Exit Code:)\s*[`'"]?(\d+)[`'"]?/i;
const SOURCE_AGENT_PATTERN =
  /(Chief of Staff|Product Owner|Program Manager|Stakeholder Executive|Solution Architect|Tech Lead|Frontend Engineer|Backend Engineer|Platform Engineer|Data Engineer|ML Engineer|UX Designer|Accessibility Specialist|QA Engineer|Security Engineer|Privacy Compliance Officer|DevOps Engineer|SRE Engineer|Documentation Engineer|Support Readiness Engineer|Legal Counsel|Finance Procurement|Localization Specialist|Incident Commander|Red Team|Quality Director)/i;

const toKebabCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseIssueNumber = (text: string): number | undefined => {
  const directMatch = text.match(ISSUE_NUMBER_PATTERN);
  if (directMatch?.[1]) {
    return Number.parseInt(directMatch[1], 10);
  }

  const urlMatch = text.match(ISSUE_URL_PATTERN);
  if (urlMatch?.[1]) {
    return Number.parseInt(urlMatch[1], 10);
  }

  return undefined;
};

const parseExitCode = (text: string): number | undefined => {
  const match = text.match(EXIT_CODE_PATTERN);
  if (!match?.[1]) {
    return undefined;
  }
  return Number.parseInt(match[1], 10);
};

const parseSourceAgent = (text: string): string | undefined => {
  const match = text.match(SOURCE_AGENT_PATTERN);
  if (!match?.[1]) {
    return undefined;
  }
  return toKebabCase(match[1]);
};

const parseTargetAgent = (text: string): string | undefined => {
  const fromCommand = text.match(DISPATCH_COMMAND_PATTERN)?.[1];
  if (fromCommand) {
    return fromCommand;
  }
  const fromSummary = text.match(DISPATCH_SUMMARY_PATTERN)?.[1];
  return fromSummary;
};

const parseHandoffArtifact = (text: string): string | undefined =>
  text.match(HANDOFF_ARTIFACT_PATTERN)?.[1];

const parseHandoffUrl = (text: string): string | undefined => text.match(HANDOFF_URL_PATTERN)?.[1];

const parseNextTarget = (text: string): string | undefined => text.match(NEXT_TARGET_PATTERN)?.[1];

const detectKind = (text: string): 'dispatch' | 'completion' | 'observation' => {
  if (parseTargetAgent(text)) {
    return 'dispatch';
  }

  if (
    /\b(task\s+\d+\s+complete|execution\s+complete|ready for reviewer sign-off|status:\s*ready)\b/i.test(
      text
    )
  ) {
    return 'completion';
  }

  return 'observation';
};

const collectGaps = (events: HandoffWorkflowEvent[]): string[] => {
  const gaps = new Set<string>();

  events.forEach((event, index) => {
    if (event.kind === 'dispatch' && event.exitCode !== undefined && event.exitCode !== 0) {
      gaps.add(
        `Dispatch to ${event.targetAgent ?? 'unknown'} failed with exit code ${event.exitCode}.`
      );
    }

    if (event.kind === 'dispatch' && !event.handoffArtifact) {
      gaps.add(`Dispatch to ${event.targetAgent ?? 'unknown'} missing handoff artifact.`);
    }

    if (event.nextTargetAgent) {
      const hasFollowOnDispatch = events
        .slice(index + 1)
        .some(
          nextEvent =>
            nextEvent.kind === 'dispatch' && nextEvent.targetAgent === event.nextTargetAgent
        );

      if (!hasFollowOnDispatch) {
        gaps.add(
          `Next routing target ${event.nextTargetAgent} was declared but no matching dispatch was found.`
        );
      }
    }
  });

  return [...gaps];
};

export const analyzeHandoffWorkflow = (entries: WorkflowLogEntry[]): HandoffWorkflowReport => {
  const byIssue = new Map<number, HandoffWorkflowEvent[]>();

  entries.forEach((entry, index) => {
    const issueNumber = parseIssueNumber(entry.text);
    if (!issueNumber) {
      return;
    }

    const event: HandoffWorkflowEvent = {
      index,
      issueNumber,
      kind: detectKind(entry.text),
      targetAgent: parseTargetAgent(entry.text),
      sourceAgent: parseSourceAgent(entry.text),
      nextTargetAgent: parseNextTarget(entry.text),
      handoffArtifact: parseHandoffArtifact(entry.text),
      handoffUrl: parseHandoffUrl(entry.text),
      exitCode: parseExitCode(entry.text),
      timestamp: entry.timestamp,
      text: entry.text,
    };

    const issueEvents = byIssue.get(issueNumber) ?? [];
    issueEvents.push(event);
    byIssue.set(issueNumber, issueEvents);
  });

  const issues = [...byIssue.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([issueNumber, events]) => {
      const dispatches = events.filter(event => event.kind === 'dispatch').length;
      const completions = events.filter(event => event.kind === 'completion').length;
      const failedDispatches = events.filter(
        event => event.kind === 'dispatch' && event.exitCode !== undefined && event.exitCode !== 0
      ).length;

      return {
        issueNumber,
        events,
        dispatches,
        completions,
        failedDispatches,
        gaps: collectGaps(events),
      } satisfies IssueWorkflowTimeline;
    });

  return { issues };
};
