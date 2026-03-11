import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReplayProtectionGuard } from './replay-protection';

describe('ReplayProtectionGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a unique nonce within the allowed timestamp skew window', () => {
    const guard = createReplayProtectionGuard();

    const result = guard.validate({
      nonce: 'nonce-001',
      timestamp: new Date('2026-03-11T12:00:30.000Z'),
      scope: 'policy-engine:operator-1',
    });

    expect(result.accepted).toBe(true);
    expect(result.replayKey).toBe('policy-engine:operator-1:nonce-001');
    expect(guard.getTrackedNonceCount()).toBe(1);
  });

  it('rejects a duplicate nonce within the retention window', () => {
    const guard = createReplayProtectionGuard();

    guard.validate({
      nonce: 'nonce-002',
      timestamp: new Date('2026-03-11T12:00:00.000Z'),
      scope: 'policy-engine:operator-2',
    });

    const result = guard.validate({
      nonce: 'nonce-002',
      timestamp: new Date('2026-03-11T12:00:01.000Z'),
      scope: 'policy-engine:operator-2',
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('already used');
    expect(guard.getTrackedNonceCount()).toBe(1);
  });

  it('allows a nonce again after deterministic expiration cleanup', () => {
    const guard = createReplayProtectionGuard({
      nonceTtlMs: 1_000,
      maxTimestampSkewMs: 5_000,
    });

    expect(
      guard.validate({
        nonce: 'nonce-003',
        timestamp: new Date('2026-03-11T12:00:00.000Z'),
        scope: 'policy-engine:operator-3',
      }).accepted
    ).toBe(true);

    vi.advanceTimersByTime(1_001);

    const result = guard.validate({
      nonce: 'nonce-003',
      timestamp: new Date('2026-03-11T12:00:01.000Z'),
      scope: 'policy-engine:operator-3',
    });

    expect(result.accepted).toBe(true);
    expect(guard.getTrackedNonceCount()).toBe(1);
  });

  it('rejects timestamps outside the allowed skew window', () => {
    const guard = createReplayProtectionGuard({
      maxTimestampSkewMs: 30_000,
    });

    const result = guard.validate({
      nonce: 'nonce-004',
      timestamp: new Date('2026-03-11T11:58:00.000Z'),
      scope: 'policy-engine:operator-4',
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('Timestamp outside allowed skew window');
    expect(guard.getTrackedNonceCount()).toBe(0);
  });

  it('accepts all requests when guard is disabled', () => {
    const guard = createReplayProtectionGuard({ enabled: false });

    // Duplicate nonce should still pass when disabled
    const r1 = guard.validate({ nonce: 'dup', timestamp: new Date('2026-03-11T12:00:00.000Z') });
    const r2 = guard.validate({ nonce: 'dup', timestamp: new Date('2026-03-11T12:00:00.000Z') });

    expect(r1.accepted).toBe(true);
    expect(r2.accepted).toBe(true);
    // Disabled guard should not track nonces
    expect(guard.getTrackedNonceCount()).toBe(0);
  });

  it('rejects a request with a missing nonce', () => {
    const guard = createReplayProtectionGuard();

    const result = guard.validate({
      nonce: '   ',
      timestamp: new Date('2026-03-11T12:00:00.000Z'),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('Nonce is required');
  });

  it('rejects a request with an invalid timestamp', () => {
    const guard = createReplayProtectionGuard();

    const result = guard.validate({
      nonce: 'valid-nonce',
      timestamp: 'not-a-date',
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('Timestamp is invalid');
  });

  it('accepts a scoped nonce and uses plain key when no scope is provided', () => {
    const guard = createReplayProtectionGuard({ maxTimestampSkewMs: 120_000 });

    const r1 = guard.validate({
      nonce: 'shared-nonce',
      timestamp: new Date('2026-03-11T12:00:00.000Z'),
      scope: 'service-a',
    });

    // Same nonce without scope is a different key
    const r2 = guard.validate({
      nonce: 'shared-nonce',
      timestamp: new Date('2026-03-11T12:00:00.000Z'),
    });

    expect(r1.accepted).toBe(true);
    expect(r1.replayKey).toBe('service-a:shared-nonce');
    expect(r2.accepted).toBe(true);
    expect(r2.replayKey).toBe('shared-nonce');
    expect(guard.getTrackedNonceCount()).toBe(2);
  });

  it('accepts a numeric millisecond timestamp within skew window', () => {
    const guard = createReplayProtectionGuard();

    const result = guard.validate({
      nonce: 'nonce-numeric',
      timestamp: new Date('2026-03-11T12:00:00.000Z').getTime(),
    });

    expect(result.accepted).toBe(true);
  });

  it('evicts oldest entries when maxEntries capacity is reached', () => {
    const guard = createReplayProtectionGuard({ maxEntries: 3, maxTimestampSkewMs: 300_000 });

    const now = new Date('2026-03-11T12:00:00.000Z').getTime();

    for (let i = 1; i <= 3; i++) {
      expect(
        guard.validate({ nonce: `nonce-cap-${i}`, timestamp: now }).accepted
      ).toBe(true);
    }

    expect(guard.getTrackedNonceCount()).toBe(3);

    // Adding a 4th should evict the oldest
    guard.validate({ nonce: 'nonce-cap-4', timestamp: now });
    expect(guard.getTrackedNonceCount()).toBe(3);
  });

  it('purgeExpired removes stale entries and returns correct count', () => {
    const guard = createReplayProtectionGuard({
      nonceTtlMs: 500,
      maxTimestampSkewMs: 60_000,
    });

    const now = new Date('2026-03-11T12:00:00.000Z').getTime();
    guard.validate({ nonce: 'exp-1', timestamp: now });
    guard.validate({ nonce: 'exp-2', timestamp: now });

    expect(guard.getTrackedNonceCount()).toBe(2);

    vi.advanceTimersByTime(600);

    const purged = guard.purgeExpired();
    expect(purged).toBe(2);
    expect(guard.getTrackedNonceCount()).toBe(0);
  });
});
