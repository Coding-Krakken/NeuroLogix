import { describe, it, expect } from 'vitest';
import { generateId, sleep, retry, formatDate, deepClone, debounce, throttle, safeJsonParse, isValidUuid, timeoutPromise } from '@/utils/index';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt if function succeeds', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        return 'success';
      };

      const result = await retry(fn, { maxAttempts: 3, baseDelay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retry(fn, { maxAttempts: 3, baseDelay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw last error after max attempts', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error(`Failure ${attempts}`);
      };

      await expect(retry(fn, { maxAttempts: 2, baseDelay: 10 }))
        .rejects
        .toThrow('Failure 2');
      expect(attempts).toBe(2);
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2023-12-25T10:30:45Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('2023-12-25 10:30:45');
    });

    it('should format date with custom format', () => {
      const date = new Date('2023-12-25T10:30:45Z');
      const formatted = formatDate(date, 'yyyy-MM-dd');
      expect(formatted).toBe('2023-12-25');
    });

    it('should handle invalid date', () => {
      const formatted = formatDate('invalid-date');
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone dates', () => {
      const date = new Date('2023-12-25');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { error: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('isValidUuid', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUuid('invalid-uuid')).toBe(false);
      expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    });
  });

  describe('timeoutPromise', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await timeoutPromise(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject if timeout is reached', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
      await expect(timeoutPromise(promise, 100))
        .rejects
        .toThrow('Operation timed out after 100ms');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      expect(callCount).toBe(0);
      await sleep(60);
      expect(callCount).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(callCount).toBe(1);
      await sleep(120);
      throttled();
      expect(callCount).toBe(2);
    });
  });
});