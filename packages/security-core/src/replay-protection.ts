import type {
  ReplayProtectionConfig,
  ReplayProtectionInput,
  ReplayProtectionResult,
} from './security-types';

const DEFAULT_NONCE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_TIMESTAMP_SKEW_MS = 60 * 1000;
const DEFAULT_MAX_ENTRIES = 10_000;

export class ReplayProtectionGuard {
  private readonly config: Required<ReplayProtectionConfig>;
  private readonly seenNonces = new Map<string, number>();

  constructor(config: ReplayProtectionConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      nonceTtlMs: config.nonceTtlMs ?? DEFAULT_NONCE_TTL_MS,
      maxTimestampSkewMs: config.maxTimestampSkewMs ?? DEFAULT_MAX_TIMESTAMP_SKEW_MS,
      maxEntries: config.maxEntries ?? DEFAULT_MAX_ENTRIES,
    };
  }

  validate(input: ReplayProtectionInput): ReplayProtectionResult {
    if (!this.config.enabled) {
      return { accepted: true };
    }

    const nowMs = Date.now();
    this.purgeExpired(nowMs);

    const nonce = input.nonce?.trim();
    if (!nonce) {
      return {
        accepted: false,
        reason: 'Nonce is required when replay protection is enabled',
      };
    }

    const timestampMs = this.normalizeTimestamp(input.timestamp);
    if (timestampMs === null) {
      return {
        accepted: false,
        reason: 'Timestamp is invalid',
      };
    }

    if (Math.abs(nowMs - timestampMs) > this.config.maxTimestampSkewMs) {
      return {
        accepted: false,
        reason: `Timestamp outside allowed skew window (${this.config.maxTimestampSkewMs}ms)`,
      };
    }

    const replayKey = this.getReplayKey(nonce, input.scope);
    const existingExpiry = this.seenNonces.get(replayKey);

    if (existingExpiry && existingExpiry > nowMs) {
      return {
        accepted: false,
        reason: 'Nonce already used within replay protection window',
        replayKey,
        expiresAt: new Date(existingExpiry),
      };
    }

    this.ensureCapacity(nowMs);

    const expiresAtMs = nowMs + this.config.nonceTtlMs;
    this.seenNonces.set(replayKey, expiresAtMs);

    return {
      accepted: true,
      replayKey,
      expiresAt: new Date(expiresAtMs),
    };
  }

  purgeExpired(nowMs: number = Date.now()): number {
    let purged = 0;

    for (const [key, expiresAt] of this.seenNonces.entries()) {
      if (expiresAt <= nowMs) {
        this.seenNonces.delete(key);
        purged += 1;
      }
    }

    return purged;
  }

  getTrackedNonceCount(): number {
    return this.seenNonces.size;
  }

  private ensureCapacity(nowMs: number): void {
    this.purgeExpired(nowMs);

    while (this.seenNonces.size >= this.config.maxEntries) {
      const oldestReplayKey = this.seenNonces.keys().next().value as string | undefined;
      if (!oldestReplayKey) {
        return;
      }

      this.seenNonces.delete(oldestReplayKey);
    }
  }

  private getReplayKey(nonce: string, scope?: string): string {
    return scope ? `${scope}:${nonce}` : nonce;
  }

  private normalizeTimestamp(timestamp: ReplayProtectionInput['timestamp']): number | null {
    if (timestamp instanceof Date) {
      const value = timestamp.getTime();
      return Number.isFinite(value) ? value : null;
    }

    if (typeof timestamp === 'number') {
      return Number.isFinite(timestamp) ? timestamp : null;
    }

    if (typeof timestamp === 'string') {
      const value = Date.parse(timestamp);
      return Number.isNaN(value) ? null : value;
    }

    return null;
  }
}

export function createReplayProtectionGuard(
  config: ReplayProtectionConfig = {}
): ReplayProtectionGuard {
  return new ReplayProtectionGuard(config);
}
