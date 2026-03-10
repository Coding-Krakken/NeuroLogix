import { z } from 'zod';

import { parseSparkplugTopic } from '../sparkplug/index';

const KAFKA_TOPIC_REGEX =
  /^nlx\.(telemetry|intents|recipes|assets|audit|api)\.[a-z0-9_]+\.v([1-9]\d*)(\.dlq)?$/;

const SPARKPLUG_ACL_PATTERN_REGEX = /^spBv1\.0\/[A-Za-z0-9_\-+#/]+$/;
const KAFKA_ACL_PATTERN_REGEX = /^nlx\.[a-z0-9_.*-]+$/;

export const BrokerBackendSchema = z.enum(['mqtt-sparkplug', 'kafka-redpanda']);
export type BrokerBackend = z.infer<typeof BrokerBackendSchema>;

export const ContractVersionSchema = z.object({
  major: z.number().int().min(1),
  minor: z.number().int().min(0),
  patch: z.number().int().min(0),
});
export type ContractVersion = z.infer<typeof ContractVersionSchema>;

export const SparkplugTopicContractSchema = z
  .string()
  .min(1)
  .refine(topic => parseSparkplugTopic(topic) !== null, 'Invalid Sparkplug topic');
export type SparkplugTopicContract = z.infer<typeof SparkplugTopicContractSchema>;

export const KafkaTopicContractSchema = z
  .string()
  .min(1)
  .regex(
    KAFKA_TOPIC_REGEX,
    'Invalid Kafka/Redpanda topic. Expected nlx.<domain>.<stream>.v<major>[.dlq]'
  );
export type KafkaTopicContract = z.infer<typeof KafkaTopicContractSchema>;

export const BrokerTopicContractSchema = z.discriminatedUnion('backend', [
  z.object({
    backend: z.literal('mqtt-sparkplug'),
    topic: SparkplugTopicContractSchema,
    version: ContractVersionSchema,
    payloadSchemaId: z.string().min(1),
    compatibility: z.enum(['backward', 'full']).default('backward'),
    qos: z.enum(['at-most-once', 'at-least-once', 'exactly-once']).default('at-least-once'),
  }),
  z.object({
    backend: z.literal('kafka-redpanda'),
    topic: KafkaTopicContractSchema,
    version: ContractVersionSchema,
    payloadSchemaId: z.string().min(1),
    compatibility: z.enum(['backward', 'full']).default('backward'),
    partitions: z.number().int().min(1).max(128),
    retentionHours: z.number().int().min(1),
    deadLetterTopic: KafkaTopicContractSchema.optional(),
  }),
]);
export type BrokerTopicContract = z.infer<typeof BrokerTopicContractSchema>;

export const BrokerAclRuleSchema = z
  .object({
    principal: z
      .string()
      .regex(/^svc\.[a-z0-9-]+$/, 'Principal must use svc.<service-name> format'),
    backend: BrokerBackendSchema,
    operation: z.enum(['publish', 'subscribe']),
    topicPattern: z.string().min(1),
  })
  .superRefine((rule, context) => {
    const isValidPattern =
      rule.backend === 'mqtt-sparkplug'
        ? SPARKPLUG_ACL_PATTERN_REGEX.test(rule.topicPattern)
        : KAFKA_ACL_PATTERN_REGEX.test(rule.topicPattern);

    if (!isValidPattern) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['topicPattern'],
        message:
          rule.backend === 'mqtt-sparkplug'
            ? 'Sparkplug ACL topicPattern must start with spBv1.0/'
            : 'Kafka/Redpanda ACL topicPattern must start with nlx.',
      });
    }
  });
export type BrokerAclRule = z.infer<typeof BrokerAclRuleSchema>;

function compareVersion(left: ContractVersion, right: ContractVersion): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

export type TopicCompatibilityResult =
  | { compatible: true }
  | { compatible: false; reason: string };

export function evaluateTopicContractCompatibility(
  previous: BrokerTopicContract,
  next: BrokerTopicContract
): TopicCompatibilityResult {
  if (previous.backend !== next.backend) {
    return {
      compatible: false,
      reason: 'Backend changed. Topic contracts cannot move across broker backends.',
    };
  }

  if (previous.topic !== next.topic) {
    return {
      compatible: false,
      reason: 'Topic name changed. Breaking change requires a new topic contract.',
    };
  }

  if (compareVersion(next.version, previous.version) < 0) {
    return {
      compatible: false,
      reason: 'Contract version regressed. Version must be monotonic.',
    };
  }

  if (
    previous.version.major === next.version.major &&
    previous.payloadSchemaId !== next.payloadSchemaId
  ) {
    return {
      compatible: false,
      reason:
        'Payload schema changed without a major version bump. Increase major version for breaking changes.',
    };
  }

  if (previous.compatibility === 'full' && next.compatibility === 'backward') {
    return {
      compatible: false,
      reason: 'Compatibility mode cannot be downgraded from full to backward.',
    };
  }

  return { compatible: true };
}

export function assertTopicContractCompatible(
  previous: BrokerTopicContract,
  next: BrokerTopicContract
): void {
  const result = evaluateTopicContractCompatibility(previous, next);
  if (!result.compatible) {
    throw new Error(result.reason);
  }
}