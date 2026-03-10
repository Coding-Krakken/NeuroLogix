import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DEMO_SCENARIO_ID,
  DemoLineSimulator,
  CANONICAL_DEMO_SCENARIO_PROFILE,
} from './index.js';

describe('DemoLineSimulator', () => {
  it('emits frames for canonical scenario profile', () => {
    const simulator = new DemoLineSimulator({
      seed: 9,
      baseTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      stepIntervalMs: 1000,
    });

    const frame = simulator.nextFrame();

    expect(frame.scenarioId).toBe(CANONICAL_DEMO_SCENARIO_ID);
    expect(frame.lineId).toBe(CANONICAL_DEMO_SCENARIO_PROFILE.lineId);
    expect(frame.edgeNodeId).toBe(CANONICAL_DEMO_SCENARIO_PROFILE.edgeNodeId);
    expect(frame.deviceId).toBe(CANONICAL_DEMO_SCENARIO_PROFILE.deviceId);
    expect(frame.points.map(point => point.tagName)).toEqual([
      'throughput.units_per_min',
      'cycle_time.seconds',
      'fault.jam_detected',
    ]);
  });

  it('generates deterministic output for the same seed and timeline', () => {
    const options = {
      seed: 21,
      baseTimestamp: new Date('2026-02-01T08:00:00.000Z'),
      stepIntervalMs: 500,
    };

    const left = new DemoLineSimulator(options);
    const right = new DemoLineSimulator(options);

    const leftFrames = left.generateFrames(5);
    const rightFrames = right.generateFrames(5);

    expect(leftFrames).toEqual(rightFrames);
  });

  it('supports resetting to replay deterministic sequence', () => {
    const simulator = new DemoLineSimulator({ seed: 4 });

    const firstPass = simulator.generateFrames(3);
    simulator.reset();
    const secondPass = simulator.generateFrames(3);

    expect(firstPass).toEqual(secondPass);
    expect(simulator.getCurrentStep()).toBe(3);
  });
});