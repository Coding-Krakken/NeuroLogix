import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type EventKind = 'issue' | 'pr';
type Mode = 'report' | 'enforce';

interface RouterArgs {
  eventPath: string;
  kind: EventKind;
  mode: Mode;
  outputPath?: string;
}

interface PolicyRule {
  requiredApprovers?: string[];
  requiredChecks?: string[];
  requiredDocs?: string[];
  rolloutRequirements?: string[];
  mergeStrategy?: string;
  commitFormat?: string;
  releaseRequirements?: string[];
  risk?: string;
}

interface PolicyMatrix {
  defaults: PolicyRule;
  byType: Record<string, PolicyRule>;
  overrides: {
    bySeverity: Record<string, PolicyRule>;
    byRisk: Record<string, PolicyRule>;
    byDataSensitivity: Record<string, PolicyRule>;
    byDeploymentSurface: Record<string, PolicyRule>;
  };
  fallback: string;
}

interface Classification {
  type: string;
  severity: string;
  priority: string;
  risk: string;
  blastRadius: string;
  componentArea: string;
  deploymentSurface: string;
  rolloutMethod: string;
  dataSensitivity: string;
  state: string;
}

interface RouterOutput {
  result: 'pass' | 'fail';
  eventKind: EventKind;
  missingSections: string[];
  missingMetadata: string[];
  invalidMetadata: string[];
  classification: Classification;
  requiredApprovers: string[];
  requiredChecks: string[];
  requiredDocs: string[];
  rolloutRequirements: string[];
  mergeStrategy: string;
  commitFormat: string;
  releaseRequirements: string[];
  suggestedReviewers: string[];
  nextAgent: string;
}

function parseArgs(argv: string[]): RouterArgs {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }
    if (token.startsWith('--')) {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        values.set(token, next);
      }
    }
  }

  const eventPath = values.get('--event-path') ?? process.env['GITHUB_EVENT_PATH'];
  const kind = (values.get('--kind') ?? 'issue') as EventKind;
  const mode = (values.get('--mode') ?? 'report') as Mode;
  const outputPath = values.get('--output-path');

  if (!eventPath) {
    throw new Error('Missing --event-path and GITHUB_EVENT_PATH');
  }
  if (kind !== 'issue' && kind !== 'pr') {
    throw new Error('Invalid --kind, expected issue|pr');
  }
  if (mode !== 'report' && mode !== 'enforce') {
    throw new Error('Invalid --mode, expected report|enforce');
  }

  return { eventPath, kind, mode, outputPath };
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(value => value.trim().length > 0))];
}

function readJson<T>(filePath: string): T {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function parseSections(markdown: string): Set<string> {
  const sections = new Set<string>();
  const pattern = /^#{2,3}\s+(.+)$/gm;
  let match = pattern.exec(markdown);
  while (match) {
    const section = match[1];
    if (section) {
      sections.add(section.trim().toLowerCase());
    }
    match = pattern.exec(markdown);
  }
  return sections;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function sectionExists(sections: Set<string>, expected: string): boolean {
  return sections.has(expected.toLowerCase());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMetadataValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return trimmed.replace(/^["'`]+|["'`]+$/g, '').trim();
}

function collectIndentedContinuation(lines: string[], startIndex: number): string {
  const values: string[] = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (line.trim().length === 0) {
      if (values.length > 0) {
        break;
      }
      continue;
    }

    if (!/^\s+/.test(line)) {
      break;
    }

    values.push(line.trim());
  }

  return values.join(' ').trim();
}

function collectHeadingContinuation(lines: string[], startIndex: number): string {
  const values: string[] = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (/^#{2,6}\s+/.test(line)) {
      break;
    }

    if (/^\s*[-*]\s+[^:]+:\s*/.test(line) || /^\s*\*\*[^*]+\*\*\s*:\s*/.test(line)) {
      if (values.length === 0) {
        continue;
      }
      break;
    }

    if (trimmed.length === 0) {
      if (values.length > 0) {
        break;
      }
      continue;
    }

    values.push(trimmed);
  }

  return values.join(' ').trim();
}

function extractMetadataValue(body: string, label: string): string | undefined {
  const escaped = escapeRegExp(label);
  const lines = body.split(/\r?\n/);

  const boldPattern = new RegExp(`^\\s*\\*\\*${escaped}\\*\\*\\s*:\\s*(.*)$`, 'i');
  const bulletPattern = new RegExp(`^\\s*[-*]\\s*${escaped}\\s*:\\s*(.*)$`, 'i');
  const headingPattern = new RegExp(`^#{2,6}\\s*${escaped}\\s*$`, 'i');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    const boldMatch = line.match(boldPattern);
    if (boldMatch) {
      const inlineValue = normalizeMetadataValue(boldMatch[1] ?? '');
      if (inlineValue.length > 0) {
        return inlineValue;
      }

      const continued = normalizeMetadataValue(collectIndentedContinuation(lines, index + 1));
      if (continued.length > 0) {
        return continued;
      }
      continue;
    }

    const bulletMatch = line.match(bulletPattern);
    if (bulletMatch) {
      const inlineValue = normalizeMetadataValue(bulletMatch[1] ?? '');
      if (inlineValue.length > 0) {
        return inlineValue;
      }

      const continued = normalizeMetadataValue(collectIndentedContinuation(lines, index + 1));
      if (continued.length > 0) {
        return continued;
      }
      continue;
    }

    if (headingPattern.test(line)) {
      const continued = normalizeMetadataValue(collectHeadingContinuation(lines, index + 1));
      if (continued.length > 0) {
        return continued;
      }
    }
  }

  return undefined;
}

function pickByBodyOrDefault(body: string, label: string, fallback: string): string {
  const extracted = extractMetadataValue(body, label);
  if (extracted) {
    return extracted;
  }
  return fallback;
}

function normalizeByPattern(value: string, pattern: RegExp): string {
  const match = value.match(pattern);
  const token = match?.[1] ?? '';
  return token.toUpperCase();
}

function normalizeEnumValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '').trim();
}

function isAllowedValue(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value);
}

function mergeRules(base: PolicyRule, extra: PolicyRule | undefined): PolicyRule {
  if (!extra) {
    return base;
  }

  return {
    requiredApprovers: uniq([
      ...(base.requiredApprovers ?? []),
      ...(extra.requiredApprovers ?? []),
    ]),
    requiredChecks: uniq([...(base.requiredChecks ?? []), ...(extra.requiredChecks ?? [])]),
    requiredDocs: uniq([...(base.requiredDocs ?? []), ...(extra.requiredDocs ?? [])]),
    rolloutRequirements: uniq([
      ...(base.rolloutRequirements ?? []),
      ...(extra.rolloutRequirements ?? []),
    ]),
    releaseRequirements: uniq([
      ...(base.releaseRequirements ?? []),
      ...(extra.releaseRequirements ?? []),
    ]),
    mergeStrategy: extra.mergeStrategy ?? base.mergeStrategy,
    commitFormat: extra.commitFormat ?? base.commitFormat,
    risk: extra.risk ?? base.risk,
  };
}

function inferType(labels: string[], body: string): string {
  const knownTypes = [
    'feature',
    'enhancement',
    'bug',
    'security-vulnerability',
    'security-hardening',
    'incident',
    'hotfix',
    'dependency-update',
    'refactor',
    'tech-debt',
    'performance',
    'reliability',
    'ci-cd',
    'infrastructure',
    'observability',
    'data-migration',
    'schema-change',
    'api-change',
    'breaking-api-change',
    'compliance',
    'legal-review',
    'privacy-change',
    'documentation',
    'ux-design',
    'experiment',
    'customer-escalation',
    'release',
  ];

  const fromLabel = labels.find(label => knownTypes.includes(label));
  if (fromLabel) {
    return fromLabel;
  }

  const fromBody = pickByBodyOrDefault(body, 'Work Item Type', 'feature').toLowerCase();
  if (knownTypes.includes(fromBody)) {
    return fromBody;
  }

  return 'feature';
}

function getRequiredSections(kind: EventKind): string[] {
  if (kind === 'issue') {
    return ['work item type', 'severity', 'priority', 'problem statement'];
  }

  return [
    'linked issues',
    'work item metadata',
    'risk assessment',
    'testing evidence',
    'observability impact',
    'security & privacy checklist',
    'backward compatibility & migrations',
    'rollout and rollback plan',
    'documentation and release',
    'acceptance criteria validation',
  ];
}

function computeNextAgent(state: string, classification: Classification): string {
  if (state === 'triage') {
    return 'product-owner';
  }
  if (state === 'planned') {
    return 'program-manager';
  }
  if (state === 'in-progress') {
    if (classification.componentArea === 'frontend') {
      return 'frontend-engineer';
    }
    if (classification.componentArea === 'backend') {
      return 'backend-engineer';
    }
    if (classification.componentArea === 'data') {
      return 'data-engineer';
    }
    return 'tech-lead';
  }
  if (state === 'in-review') {
    return 'qa-test-engineer';
  }
  if (state === 'ready-to-release' || state === 'released') {
    return 'sre-engineer';
  }
  if (state === 'verified') {
    return 'quality-director';
  }
  return '00-chief-of-staff';
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const root = resolve(scriptDir, '..', '..', '..');
  const event = readJson<Record<string, unknown>>(args.eventPath);

  const issueNode =
    args.kind === 'issue'
      ? (event['issue'] as Record<string, unknown>)
      : (event['pull_request'] as Record<string, unknown>);
  const body = asString(issueNode['body'], '');
  const labels =
    (issueNode['labels'] as Array<Record<string, unknown>> | undefined)
      ?.map(label => asString(label['name'], '').toLowerCase())
      .filter(value => value.length > 0) ?? [];
  const sections = parseSections(body);

  const requiredSections = getRequiredSections(args.kind);
  const missingSections = requiredSections.filter(section => !sectionExists(sections, section));

  const type = inferType(labels, body);
  const stateLabel = labels.find(label => label.startsWith('state:'));
  const state = stateLabel
    ? stateLabel.replace('state:', '').trim()
    : args.kind === 'pr'
      ? 'in-review'
      : 'triage';

  const matrix = readJson<PolicyMatrix>(
    resolve(root, '.github', 'framework-config', 'deterministic', 'policies', 'policy_matrix.json')
  );
  const reviewerMap = readJson<Record<string, string[]>>(
    resolve(root, '.github', 'framework-config', 'deterministic', 'policies', 'reviewer_map.json')
  );

  const defaults = matrix.defaults;
  const byType = matrix.byType[type];

  const inferredRisk = byType?.risk ?? 'medium';
  const severity =
    labels.find(label => /^s[0-4]$/.test(label))?.toUpperCase() ??
    (normalizeByPattern(pickByBodyOrDefault(body, 'Severity', 'S2'), /(S[0-4])/i) || 'S2');
  const priority =
    labels.find(label => /^p[0-3]$/.test(label))?.toUpperCase() ??
    (normalizeByPattern(pickByBodyOrDefault(body, 'Priority', 'P2'), /(P[0-3])/i) || 'P2');
  const risk =
    labels.find(label => ['low', 'medium', 'high', 'critical'].includes(label)) ??
    normalizeEnumValue(pickByBodyOrDefault(body, 'Risk', inferredRisk));
  const blastRadius = normalizeEnumValue(pickByBodyOrDefault(body, 'Blast Radius', 'single-team'));
  const componentArea = normalizeEnumValue(pickByBodyOrDefault(body, 'Component Area', 'platform'));
  const deploymentSurface = normalizeEnumValue(
    pickByBodyOrDefault(body, 'Deployment Surface', 'non-prod')
  );
  const rolloutMethod = normalizeEnumValue(
    pickByBodyOrDefault(body, 'Rollout Method', 'all-at-once')
  );
  const dataSensitivity = normalizeEnumValue(
    pickByBodyOrDefault(body, 'Data Sensitivity', 'internal')
  );

  const classification: Classification = {
    type,
    severity,
    priority,
    risk,
    blastRadius,
    componentArea,
    deploymentSurface,
    rolloutMethod,
    dataSensitivity,
    state,
  };

  let merged = mergeRules(defaults, byType);
  merged = mergeRules(merged, matrix.overrides.bySeverity[severity]);
  merged = mergeRules(merged, matrix.overrides.byRisk[risk]);
  merged = mergeRules(merged, matrix.overrides.byDataSensitivity[dataSensitivity]);
  merged = mergeRules(merged, matrix.overrides.byDeploymentSurface[deploymentSurface]);

  const requiredMetadata: Array<keyof Classification> = [
    'type',
    'severity',
    'priority',
    'risk',
    'blastRadius',
    'componentArea',
    'deploymentSurface',
    'rolloutMethod',
    'dataSensitivity',
  ];
  const missingMetadata = requiredMetadata.filter(field => !String(classification[field]).trim());

  const invalidMetadata: string[] = [];
  if (!isAllowedValue(severity, ['S0', 'S1', 'S2', 'S3', 'S4'])) {
    invalidMetadata.push('severity');
  }
  if (!isAllowedValue(priority, ['P0', 'P1', 'P2', 'P3'])) {
    invalidMetadata.push('priority');
  }
  if (!isAllowedValue(risk, ['low', 'medium', 'high', 'critical'])) {
    invalidMetadata.push('risk');
  }
  if (!isAllowedValue(blastRadius, ['single-team', 'multi-team', 'customer-visible', 'global'])) {
    invalidMetadata.push('blastRadius');
  }
  if (
    !isAllowedValue(componentArea, [
      'frontend',
      'backend',
      'data',
      'infra',
      'security',
      'platform',
      'docs',
    ])
  ) {
    invalidMetadata.push('componentArea');
  }
  if (!isAllowedValue(deploymentSurface, ['non-prod', 'prod'])) {
    invalidMetadata.push('deploymentSurface');
  }
  if (!isAllowedValue(rolloutMethod, ['all-at-once', 'flag', 'ring', 'canary'])) {
    invalidMetadata.push('rolloutMethod');
  }
  if (!isAllowedValue(dataSensitivity, ['public', 'internal', 'confidential', 'regulated'])) {
    invalidMetadata.push('dataSensitivity');
  }

  const output: RouterOutput = {
    result:
      missingSections.length === 0 && missingMetadata.length === 0 && invalidMetadata.length === 0
        ? 'pass'
        : 'fail',
    eventKind: args.kind,
    missingSections,
    missingMetadata,
    invalidMetadata,
    classification,
    requiredApprovers: merged.requiredApprovers ?? [],
    requiredChecks: merged.requiredChecks ?? [],
    requiredDocs: merged.requiredDocs ?? [],
    rolloutRequirements: merged.rolloutRequirements ?? [],
    mergeStrategy: merged.mergeStrategy ?? 'squash',
    commitFormat: merged.commitFormat ?? '<type>(<scope>): <subject>',
    releaseRequirements: merged.releaseRequirements ?? [],
    suggestedReviewers: reviewerMap[componentArea] ?? [],
    nextAgent: computeNextAgent(state, classification),
  };

  const report = [
    'Deterministic Governance Report',
    `Result: ${output.result}`,
    `Type: ${output.classification.type}`,
    `Severity/Priority: ${output.classification.severity}/${output.classification.priority}`,
    `Risk: ${output.classification.risk}`,
    `Required Approvers: ${output.requiredApprovers.join(', ')}`,
    `Required Checks: ${output.requiredChecks.join(', ')}`,
    `Next Agent: ${output.nextAgent}`,
  ];

  process.stdout.write(`${report.join('\n')}\n`);

  if (args.outputPath) {
    writeFileSync(args.outputPath, JSON.stringify(output, null, 2));
  }

  if (args.mode === 'enforce' && output.result === 'fail') {
    throw new Error(
      `Governance enforcement failed (${matrix.fallback}). Missing sections: ${missingSections.join(', ') || 'none'}. Missing metadata: ${missingMetadata.join(', ') || 'none'}. Invalid metadata: ${invalidMetadata.join(', ') || 'none'}.`
    );
  }
}

main();
