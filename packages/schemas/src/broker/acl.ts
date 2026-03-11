import { z } from 'zod';

import {
  BrokerAclRuleSchema,
  BrokerBackendSchema,
  KafkaTopicContractSchema,
  SparkplugTopicContractSchema,
  type BrokerAclRule,
  type BrokerBackend,
} from './index';

const BrokerAclAuthorizationRequestSchema = z.object({
  principal: z
    .string()
    .regex(/^svc\.[a-z0-9-]+$/, 'Principal must use svc.<service-name> format'),
  backend: BrokerBackendSchema,
  operation: z.enum(['publish', 'subscribe']),
  topic: z.string().min(1),
});

export type BrokerAclAuthorizationRequest = z.infer<typeof BrokerAclAuthorizationRequestSchema>;

export interface BrokerAclAuthorizationDecision {
  authorized: boolean;
  reason?: string;
  matchedRule?: BrokerAclRule;
}

export interface BrokerAclCoverageViolation extends BrokerAclAuthorizationRequest {
  reason: string;
}

export interface BrokerAclCoverageResult {
  valid: boolean;
  violations: BrokerAclCoverageViolation[];
  ruleIssues: string[];
}

function formatSchemaIssues(prefix: string, issues: { path: (string | number)[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
    return `${prefix}${path}: ${issue.message}`;
  });
}

function validateTopicForBackend(backend: BrokerBackend, topic: string): string[] {
  if (backend === 'mqtt-sparkplug') {
    const sparkplugParse = SparkplugTopicContractSchema.safeParse(topic);
    if (!sparkplugParse.success) {
      return formatSchemaIssues('Invalid Sparkplug topic', sparkplugParse.error.issues);
    }

    return [];
  }

  const kafkaParse = KafkaTopicContractSchema.safeParse(topic);
  if (!kafkaParse.success) {
    return formatSchemaIssues('Invalid Kafka/Redpanda topic', kafkaParse.error.issues);
  }

  return [];
}

function parseAclRules(rules: readonly BrokerAclRule[]): {
  validRules: BrokerAclRule[];
  ruleIssues: string[];
} {
  const validRules: BrokerAclRule[] = [];
  const ruleIssues: string[] = [];

  for (const rule of rules) {
    const parse = BrokerAclRuleSchema.safeParse(rule);
    if (parse.success) {
      validRules.push(parse.data);
      continue;
    }

    ruleIssues.push(...formatSchemaIssues('ACL rule schema violation', parse.error.issues));
  }

  return {
    validRules,
    ruleIssues,
  };
}

function matchesKafkaTopicPattern(pattern: string, topic: string): boolean {
  const patternSegments = pattern.split('.');
  const topicSegments = topic.split('.');

  if (patternSegments.length !== topicSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    if (segment === '*') {
      return true;
    }

    return segment === topicSegments[index];
  });
}

function matchesSparkplugTopicPattern(pattern: string, topic: string): boolean {
  const patternSegments = pattern.split('/');
  const topicSegments = topic.split('/');
  let topicIndex = 0;

  for (let patternIndex = 0; patternIndex < patternSegments.length; patternIndex += 1) {
    const patternSegment = patternSegments[patternIndex];

    if (patternSegment === '#') {
      return patternIndex === patternSegments.length - 1;
    }

    const topicSegment = topicSegments[topicIndex];
    if (!topicSegment) {
      return false;
    }

    if (patternSegment !== '+' && patternSegment !== topicSegment) {
      return false;
    }

    topicIndex += 1;
  }

  return topicIndex === topicSegments.length;
}

function matchesRuleTopicPattern(rule: BrokerAclRule, topic: string): boolean {
  if (rule.backend === 'mqtt-sparkplug') {
    return matchesSparkplugTopicPattern(rule.topicPattern, topic);
  }

  return matchesKafkaTopicPattern(rule.topicPattern, topic);
}

function evaluateAuthorizationWithValidatedRules(
  request: BrokerAclAuthorizationRequest,
  rules: readonly BrokerAclRule[]
): BrokerAclAuthorizationDecision {
  const matchedRule = rules.find((rule) => {
    return (
      rule.principal === request.principal &&
      rule.backend === request.backend &&
      rule.operation === request.operation &&
      matchesRuleTopicPattern(rule, request.topic)
    );
  });

  if (!matchedRule) {
    return {
      authorized: false,
      reason: `No ACL rule matched ${request.principal} ${request.operation} on ${request.backend} topic ${request.topic}.`,
    };
  }

  return {
    authorized: true,
    matchedRule,
  };
}

export function authorizeBrokerTopicAccess(
  request: BrokerAclAuthorizationRequest,
  rules: readonly BrokerAclRule[]
): BrokerAclAuthorizationDecision {
  const requestParse = BrokerAclAuthorizationRequestSchema.safeParse(request);
  if (!requestParse.success) {
    const issues = formatSchemaIssues('Authorization request schema violation', requestParse.error.issues);
    return {
      authorized: false,
      reason: issues.join(' | '),
    };
  }

  const normalizedRequest = requestParse.data;
  const topicIssues = validateTopicForBackend(normalizedRequest.backend, normalizedRequest.topic);
  if (topicIssues.length > 0) {
    return {
      authorized: false,
      reason: topicIssues.join(' | '),
    };
  }

  const { validRules, ruleIssues } = parseAclRules(rules);
  if (validRules.length === 0) {
    return {
      authorized: false,
      reason: ruleIssues.length > 0 ? ruleIssues.join(' | ') : 'No ACL rules provided.',
    };
  }

  const decision = evaluateAuthorizationWithValidatedRules(normalizedRequest, validRules);
  if (decision.authorized) {
    return decision;
  }

  return {
    ...decision,
    reason: ruleIssues.length > 0 ? `${decision.reason} | ${ruleIssues.join(' | ')}` : decision.reason,
  };
}

export function validateBrokerAclCoverage(
  registrations: readonly BrokerAclAuthorizationRequest[],
  rules: readonly BrokerAclRule[]
): BrokerAclCoverageResult {
  const violations: BrokerAclCoverageViolation[] = [];
  const { validRules, ruleIssues } = parseAclRules(rules);

  for (const registration of registrations) {
    const requestParse = BrokerAclAuthorizationRequestSchema.safeParse(registration);
    if (!requestParse.success) {
      violations.push({
        ...registration,
        reason: formatSchemaIssues('Registration schema violation', requestParse.error.issues).join(' | '),
      });
      continue;
    }

    const normalizedRequest = requestParse.data;
    const topicIssues = validateTopicForBackend(normalizedRequest.backend, normalizedRequest.topic);
    if (topicIssues.length > 0) {
      violations.push({
        ...normalizedRequest,
        reason: topicIssues.join(' | '),
      });
      continue;
    }

    const decision = evaluateAuthorizationWithValidatedRules(normalizedRequest, validRules);
    if (!decision.authorized) {
      violations.push({
        ...normalizedRequest,
        reason: decision.reason ?? 'Missing ACL rule.',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    ruleIssues,
  };
}

export function assertBrokerAclCoverage(
  registrations: readonly BrokerAclAuthorizationRequest[],
  rules: readonly BrokerAclRule[]
): void {
  const result = validateBrokerAclCoverage(registrations, rules);

  if (result.valid) {
    return;
  }

  const violationSummary = result.violations
    .map((violation) => {
      return `${violation.principal}:${violation.backend}:${violation.operation}:${violation.topic} -> ${violation.reason}`;
    })
    .join(' | ');

  const ruleIssueSummary = result.ruleIssues.length > 0 ? ` Rule issues: ${result.ruleIssues.join(' | ')}` : '';

  throw new Error(
    `Broker ACL coverage failed bootstrap validation with ${result.violations.length} violation(s): ${violationSummary}.${ruleIssueSummary}`
  );
}
