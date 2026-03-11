import { SITE_TIER, type SiteTier } from '../federation/index';
import {
  BROKER_TOPIC_CONTRACTS,
  BrokerTopicContractSchema,
  evaluateTopicContractCompatibility,
  type BrokerBackend,
  type BrokerTopicContract,
  type TopicCompatibilityResult,
} from './index';

/**
 * Broker governance bootstrap pattern.
 *
 * Services register their producer/subscriber topics at startup and run these
 * validations before opening broker connections. This keeps runtime behavior
 * model-aligned by enforcing conformance with `BROKER_TOPIC_CONTRACTS`.
 */

export interface TopicValidationResult {
  valid: boolean;
  issues: string[];
  contract?: BrokerTopicContract;
  compatibility?: TopicCompatibilityResult;
}

export type GovernanceSeverity = 'error' | 'warning';

export interface TopicRegistryViolation {
  backend: BrokerBackend;
  topic: string;
  severity: GovernanceSeverity;
  issues: string[];
}

export interface TopicRegistryGuardResult {
  valid: boolean;
  errors: TopicRegistryViolation[];
  warnings: TopicRegistryViolation[];
}

export interface TopicRegistryGuardOptions {
  tier: SiteTier;
  contracts?: readonly BrokerTopicContract[];
  tierPolicy?: Partial<Record<SiteTier, GovernanceSeverity>>;
}

const DEFAULT_TIER_POLICY: Record<SiteTier, GovernanceSeverity> = {
  [SITE_TIER.T1]: 'error',
  [SITE_TIER.T2]: 'warning',
  [SITE_TIER.T3]: 'warning',
};

const SAFETY_CRITICAL_TOPIC_PATTERNS = [
  /^spBv1\.0\//,
  /^nlx\.telemetry\./,
  /^nlx\.intents\./,
  /^nlx\.recipes\./,
];

function formatSchemaIssues(prefix: string, issues: { path: (string | number)[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
    return `${prefix}${path}: ${issue.message}`;
  });
}

export function isSafetyCriticalTopic(topic: Pick<BrokerTopicContract, 'topic'>): boolean {
  return SAFETY_CRITICAL_TOPIC_PATTERNS.some((pattern) => pattern.test(topic.topic));
}

export function validateTopicAgainstContract(
  contract: BrokerTopicContract,
  registration: BrokerTopicContract
): TopicValidationResult {
  const issues: string[] = [];

  if (contract.topic !== registration.topic) {
    issues.push(
      `Topic mismatch. Registration ${registration.topic} does not match contract topic ${contract.topic}.`
    );
  }

  if (contract.backend !== registration.backend) {
    issues.push(
      `Backend mismatch. Registration backend ${registration.backend} does not match contract backend ${contract.backend}.`
    );
  }

  if (contract.backend === 'mqtt-sparkplug' && registration.backend === 'mqtt-sparkplug') {
    if (contract.qos !== registration.qos) {
      issues.push(`QoS mismatch. Expected ${contract.qos}, received ${registration.qos}.`);
    }
  }

  if (contract.backend === 'kafka-redpanda' && registration.backend === 'kafka-redpanda') {
    if (contract.partitions !== registration.partitions) {
      issues.push(
        `Partitions mismatch. Expected ${contract.partitions}, received ${registration.partitions}.`
      );
    }

    if (contract.retentionHours !== registration.retentionHours) {
      issues.push(
        `Retention mismatch. Expected ${contract.retentionHours}h, received ${registration.retentionHours}h.`
      );
    }

    if (contract.deadLetterTopic !== registration.deadLetterTopic) {
      issues.push(
        `Dead-letter topic mismatch. Expected ${contract.deadLetterTopic ?? 'none'}, received ${registration.deadLetterTopic ?? 'none'}.`
      );
    }
  }

  const compatibility = evaluateTopicContractCompatibility(contract, registration);
  if (!compatibility.compatible) {
    issues.push(compatibility.reason);
  }

  return {
    valid: issues.length === 0,
    issues,
    contract,
    compatibility,
  };
}

export function validateTopicRegistrationAgainstContracts(
  registration: BrokerTopicContract,
  contracts: readonly BrokerTopicContract[] = BROKER_TOPIC_CONTRACTS
): TopicValidationResult {
  const registrationParse = BrokerTopicContractSchema.safeParse(registration);
  if (!registrationParse.success) {
    return {
      valid: false,
      issues: formatSchemaIssues('Registration schema violation', registrationParse.error.issues),
    };
  }

  const normalized = registrationParse.data;
  const contract = contracts.find((candidate) => candidate.topic === normalized.topic);

  if (!contract) {
    return {
      valid: false,
      issues: [
        `No broker topic contract found for topic ${normalized.topic}. Add the topic to BROKER_TOPIC_CONTRACTS before bootstrap.`,
      ],
    };
  }

  return validateTopicAgainstContract(contract, normalized);
}

export function validateTopicRegistryGuard(
  registrations: readonly BrokerTopicContract[],
  options: TopicRegistryGuardOptions
): TopicRegistryGuardResult {
  const contracts = options.contracts ?? BROKER_TOPIC_CONTRACTS;
  const policy: Record<SiteTier, GovernanceSeverity> = {
    ...DEFAULT_TIER_POLICY,
    ...(options.tierPolicy ?? {}),
  };

  const errors: TopicRegistryViolation[] = [];
  const warnings: TopicRegistryViolation[] = [];

  for (const registration of registrations) {
    const validation = validateTopicRegistrationAgainstContracts(registration, contracts);
    if (validation.valid) {
      continue;
    }

    const severity: GovernanceSeverity =
      options.tier === SITE_TIER.T1 && isSafetyCriticalTopic(registration)
        ? 'error'
        : policy[options.tier];

    const violation: TopicRegistryViolation = {
      backend: registration.backend,
      topic: registration.topic,
      severity,
      issues: validation.issues,
    };

    if (severity === 'error') {
      errors.push(violation);
    } else {
      warnings.push(violation);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertTopicRegistryGuard(
  registrations: readonly BrokerTopicContract[],
  options: TopicRegistryGuardOptions
): void {
  const result = validateTopicRegistryGuard(registrations, options);

  if (!result.valid) {
    const issueSummary = result.errors
      .map((violation) => `${violation.backend}:${violation.topic} -> ${violation.issues.join('; ')}`)
      .join(' | ');

    throw new Error(
      `Broker topic governance failed bootstrap validation with ${result.errors.length} error(s): ${issueSummary}`
    );
  }
}
