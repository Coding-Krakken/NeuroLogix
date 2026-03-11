import { describe, expect, it } from 'vitest';

import {
  assertBrokerAclCoverage,
  authorizeBrokerTopicAccess,
  validateBrokerAclCoverage,
  type BrokerAclAuthorizationRequest,
} from '@/broker/acl';
import type { BrokerAclRule } from '@/broker/index';

const BASE_RULES: readonly BrokerAclRule[] = [
  {
    principal: 'svc.recipe-executor',
    backend: 'kafka-redpanda',
    operation: 'publish',
    topicPattern: 'nlx.recipes.execution.*',
  },
  {
    principal: 'svc.digital-twin',
    backend: 'kafka-redpanda',
    operation: 'subscribe',
    topicPattern: 'nlx.telemetry.asset.v1',
  },
  {
    principal: 'svc.digital-twin',
    backend: 'mqtt-sparkplug',
    operation: 'subscribe',
    topicPattern: 'spBv1.0/line-a/DDATA/+/#',
  },
];

describe('Broker ACL Runtime Guard', () => {
  it('denies malformed authorization requests before evaluating ACL rules', () => {
    const malformedRequest = {
      principal: 'recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'publish',
      topic: 'nlx.recipes.execution.v1',
    } as unknown as BrokerAclAuthorizationRequest;

    const decision = authorizeBrokerTopicAccess(malformedRequest, BASE_RULES);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('Authorization request schema violation');
  });

  it('authorizes Kafka publish access when wildcard pattern matches one segment', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'publish',
      topic: 'nlx.recipes.execution.v1',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(true);
    expect(decision.matchedRule?.topicPattern).toBe('nlx.recipes.execution.*');
  });

  it('denies access when operation differs from ACL rule', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'subscribe',
      topic: 'nlx.recipes.execution.v1',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('No ACL rule matched');
  });

  it('denies Kafka topics when wildcard does not match segment count', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'publish',
      topic: 'nlx.recipes.execution.v1.dlq',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('No ACL rule matched');
  });

  it('authorizes Sparkplug subscribe access with + and # wildcard matching', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.digital-twin',
      backend: 'mqtt-sparkplug',
      operation: 'subscribe',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(true);
    expect(decision.matchedRule?.topicPattern).toBe('spBv1.0/line-a/DDATA/+/#');
  });

  it('denies invalid backend topic combinations before ACL matching', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.digital-twin',
      backend: 'kafka-redpanda',
      operation: 'subscribe',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('Invalid Kafka/Redpanda topic');
  });

  it('denies invalid Sparkplug topic payloads before ACL matching', () => {
    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.digital-twin',
      backend: 'mqtt-sparkplug',
      operation: 'subscribe',
      topic: 'nlx.telemetry.asset.v1',
    };

    const decision = authorizeBrokerTopicAccess(request, BASE_RULES);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('Invalid Sparkplug topic');
  });

  it('denies when only malformed ACL rules are provided', () => {
    const malformedRules = [
      {
        principal: 'invalid-principal',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topicPattern: 'nlx.recipes.execution.*',
      },
    ] as unknown as readonly BrokerAclRule[];

    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'publish',
      topic: 'nlx.recipes.execution.v1',
    };

    const decision = authorizeBrokerTopicAccess(request, malformedRules);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('ACL rule schema violation');
  });

  it('appends rule issues when authorization fails with malformed extra rules', () => {
    const malformedRules = [
      ...BASE_RULES,
      {
        principal: 'svc.recipe-executor',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topicPattern: 'spBv1.0/line-a/DDATA/#',
      },
    ] as unknown as readonly BrokerAclRule[];

    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.recipe-executor',
      backend: 'kafka-redpanda',
      operation: 'publish',
      topic: 'nlx.api.federation.v1',
    };

    const decision = authorizeBrokerTopicAccess(request, malformedRules);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('No ACL rule matched');
    expect(decision.reason).toContain('ACL rule schema violation');
  });

  it('denies Sparkplug patterns that place # before the final segment', () => {
    const rulesWithInvalidMultiLevelWildcard = [
      {
        principal: 'svc.digital-twin',
        backend: 'mqtt-sparkplug',
        operation: 'subscribe',
        topicPattern: 'spBv1.0/line-a/#/conveyor-01',
      },
    ] as const;

    const request: BrokerAclAuthorizationRequest = {
      principal: 'svc.digital-twin',
      backend: 'mqtt-sparkplug',
      operation: 'subscribe',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
    };

    const decision = authorizeBrokerTopicAccess(request, rulesWithInvalidMultiLevelWildcard);

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('No ACL rule matched');
  });

  it('returns invalid when ACL coverage is missing for a registration', () => {
    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.recipe-executor',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topic: 'nlx.recipes.execution.v1',
      },
      {
        principal: 'svc.mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topic: 'nlx.api.federation.v1',
      },
    ];

    const result = validateBrokerAclCoverage(registrations, BASE_RULES);

    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.principal).toBe('svc.mission-control');
  });

  it('captures invalid registration schema errors in coverage validation', () => {
    const malformedRegistrations = [
      {
        principal: 'mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topic: 'nlx.api.federation.v1',
      },
    ] as unknown as readonly BrokerAclAuthorizationRequest[];

    const result = validateBrokerAclCoverage(malformedRegistrations, BASE_RULES);

    expect(result.valid).toBe(false);
    expect(result.violations[0]?.reason).toContain('Registration schema violation');
  });

  it('captures invalid topic/backend combinations in coverage validation', () => {
    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.digital-twin',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
      },
    ];

    const result = validateBrokerAclCoverage(registrations, BASE_RULES);

    expect(result.valid).toBe(false);
    expect(result.violations[0]?.reason).toContain('Invalid Kafka/Redpanda topic');
  });

  it('collects malformed ACL rule diagnostics while still evaluating valid rules', () => {
    const malformedRules = [
      ...BASE_RULES,
      {
        principal: 'mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topicPattern: 'nlx.api.federation.*',
      },
    ] as unknown as readonly BrokerAclRule[];

    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.recipe-executor',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topic: 'nlx.recipes.execution.v1',
      },
    ];

    const result = validateBrokerAclCoverage(registrations, malformedRules);

    expect(result.valid).toBe(true);
    expect(result.ruleIssues.length).toBeGreaterThan(0);
    expect(result.ruleIssues[0]).toContain('ACL rule schema violation');
  });

  it('throws with violation details when bootstrap ACL coverage fails', () => {
    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topic: 'nlx.api.federation.v1',
      },
    ];

    expect(() => assertBrokerAclCoverage(registrations, BASE_RULES)).toThrow(
      'Broker ACL coverage failed bootstrap validation'
    );
  });

  it('includes ACL rule diagnostics when assertion fails with malformed rules', () => {
    const malformedRules = [
      ...BASE_RULES,
      {
        principal: 'svc.mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topicPattern: 'spBv1.0/line-a/DDATA/#',
      },
    ] as unknown as readonly BrokerAclRule[];

    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.mission-control',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topic: 'nlx.api.federation.v1',
      },
    ];

    expect(() => assertBrokerAclCoverage(registrations, malformedRules)).toThrow('Rule issues:');
  });

  it('does not throw when all registrations are covered by ACL rules', () => {
    const registrations: readonly BrokerAclAuthorizationRequest[] = [
      {
        principal: 'svc.recipe-executor',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topic: 'nlx.recipes.execution.v1',
      },
      {
        principal: 'svc.digital-twin',
        backend: 'mqtt-sparkplug',
        operation: 'subscribe',
        topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
      },
    ];

    expect(() => assertBrokerAclCoverage(registrations, BASE_RULES)).not.toThrow();
  });
});
