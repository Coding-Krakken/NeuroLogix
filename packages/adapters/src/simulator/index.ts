import { z } from 'zod';
import { TelemetryPointSchema } from '@neurologix/schemas';

export const CANONICAL_DEMO_SCENARIO_ID = 'demo-line-canonical-v1';

export const CanonicalDemoScenarioProfileSchema = z.object({
  scenarioId: z.literal(CANONICAL_DEMO_SCENARIO_ID),
  lineId: z.literal('line-a'),
  edgeNodeId: z.literal('edge-01'),
  deviceId: z.literal('conveyor-01'),
  description: z.string().min(1),
});

export type CanonicalDemoScenarioProfile = z.infer<typeof CanonicalDemoScenarioProfileSchema>;

export const CANONICAL_DEMO_SCENARIO_PROFILE: CanonicalDemoScenarioProfile =
  CanonicalDemoScenarioProfileSchema.parse({
    scenarioId: CANONICAL_DEMO_SCENARIO_ID,
    lineId: 'line-a',
    edgeNodeId: 'edge-01',
    deviceId: 'conveyor-01',
    description: 'Nominal conveyor operation with deterministic throughput and cycle behavior.',
  });

const DemoLineSimulatorOptionsSchema = z.object({
  seed: z.number().int().default(11),
  baseTimestamp: z.date().default(new Date('2026-01-01T00:00:00.000Z')),
  stepIntervalMs: z.number().int().positive().default(1000),
});

export const DemoLineFrameSchema = z.object({
  scenarioId: z.literal(CANONICAL_DEMO_SCENARIO_ID),
  step: z.number().int().min(1),
  timestamp: z.date(),
  lineId: z.string().min(1),
  edgeNodeId: z.string().min(1),
  deviceId: z.string().min(1),
  points: z.array(TelemetryPointSchema).length(3),
});

export type DemoLineFrame = z.infer<typeof DemoLineFrameSchema>;

export class DemoLineSimulator {
  private readonly seed: number;
  private readonly baseTimestamp: Date;
  private readonly stepIntervalMs: number;
  private stepCounter = 0;

  constructor(options: Partial<z.infer<typeof DemoLineSimulatorOptionsSchema>> = {}) {
    const parsedOptions = DemoLineSimulatorOptionsSchema.parse(options);
    this.seed = parsedOptions.seed;
    this.baseTimestamp = parsedOptions.baseTimestamp;
    this.stepIntervalMs = parsedOptions.stepIntervalMs;
  }

  getCurrentStep(): number {
    return this.stepCounter;
  }

  reset(): void {
    this.stepCounter = 0;
  }

  nextFrame(): DemoLineFrame {
    this.stepCounter += 1;

    const timestamp = new Date(
      this.baseTimestamp.getTime() + (this.stepCounter - 1) * this.stepIntervalMs
    );

    const throughputUnitsPerMinute =
      120 + (((this.seed + this.stepCounter * 5) % 11) - 5) * 2;
    const cycleTimeSeconds = 30 + (((this.seed + this.stepCounter * 3) % 7) - 3);
    const jamDetected = (this.seed + this.stepCounter) % 12 === 0;

    return DemoLineFrameSchema.parse({
      scenarioId: CANONICAL_DEMO_SCENARIO_ID,
      step: this.stepCounter,
      timestamp,
      lineId: CANONICAL_DEMO_SCENARIO_PROFILE.lineId,
      edgeNodeId: CANONICAL_DEMO_SCENARIO_PROFILE.edgeNodeId,
      deviceId: CANONICAL_DEMO_SCENARIO_PROFILE.deviceId,
      points: [
        {
          tagName: 'throughput.units_per_min',
          value: throughputUnitsPerMinute,
          timestamp,
          quality: 'good',
          source: 'simulator:line-a',
        },
        {
          tagName: 'cycle_time.seconds',
          value: cycleTimeSeconds,
          timestamp,
          quality: 'good',
          source: 'simulator:line-a',
        },
        {
          tagName: 'fault.jam_detected',
          value: jamDetected,
          timestamp,
          quality: 'good',
          source: 'simulator:line-a',
        },
      ],
    });
  }

  generateFrames(count: number): DemoLineFrame[] {
    if (!Number.isInteger(count) || count <= 0) {
      return [];
    }

    return Array.from({ length: count }, () => this.nextFrame());
  }
}