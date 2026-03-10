import {
  DemoLineFrame,
  DemoLineSimulator,
  WmsWcsDispatchExecutor,
  WmsWcsDispatchResult,
  WmsWcsDispatchService,
} from '@neurologix/adapters';
import type { WmsWcsCommandType, WmsWcsDispatchCommand } from '@neurologix/schemas';

export type MissionControlEventType = 'telemetry' | 'alarm' | 'dispatch';

export interface MissionControlEvent {
  id: string;
  type: MissionControlEventType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface CommandCenterSnapshot {
  scenarioId: string;
  lineId: string;
  updatedAt: Date;
  throughputUnitsPerMinute: number;
  cycleTimeSeconds: number;
  jamDetected: boolean;
  dispatch: {
    dispatched: number;
    deadLetter: number;
    duplicate: number;
    pendingDeadLetters: number;
  };
}

export interface LineViewSnapshot {
  scenarioId: string;
  lineId: string;
  latestFrame: DemoLineFrame;
  recentFrames: DemoLineFrame[];
}

export interface MissionControlStateOptions {
  seed?: number;
  now?: () => Date;
  initialFrames?: number;
  maxFrames?: number;
  maxEvents?: number;
  dispatchExecutor?: WmsWcsDispatchExecutor;
}

export type MissionControlActorRole = 'operator' | 'supervisor' | 'admin';

export interface MissionControlDispatchControlInput {
  actorRole: MissionControlActorRole;
  confirmationAccepted: boolean;
  approvedByRole?: MissionControlActorRole;
}

export interface MissionControlDispatchRequestEnvelope {
  command: unknown;
  control?: MissionControlDispatchControlInput;
}

export interface MissionControlDispatchPolicyDecision {
  status: 'allowed' | 'requires-approval' | 'denied';
  reason: string;
  requiredApprovalRole: MissionControlActorRole | null;
}

const DEFAULT_INITIAL_FRAMES = 10;
const DEFAULT_MAX_FRAMES = 120;
const DEFAULT_MAX_EVENTS = 200;

const ROLE_RANK: Record<MissionControlActorRole, number> = {
  operator: 1,
  supervisor: 2,
  admin: 3,
};

const COMMAND_TYPE_APPROVAL_REQUIREMENT: Record<
  WmsWcsCommandType,
  MissionControlActorRole | null
> = {
  allocate_pick: null,
  release_pick: null,
  reroute_container: 'supervisor',
  hold_container: 'admin',
};

function defaultDispatchExecutor(now: () => Date): WmsWcsDispatchExecutor {
  return async (command, attempt) => ({
    providerDispatchId: `${command.commandId}-attempt-${attempt}`,
    acceptedAt: now(),
    metadata: {
      sourceSystem: command.sourceSystem,
      commandType: command.commandType,
    },
  });
}

function getNumberPointValue(frame: DemoLineFrame, tagName: string): number {
  const point = frame.points.find(candidate => candidate.tagName === tagName);
  return typeof point?.value === 'number' ? point.value : 0;
}

function getBooleanPointValue(frame: DemoLineFrame, tagName: string): boolean {
  const point = frame.points.find(candidate => candidate.tagName === tagName);
  return point?.value === true;
}

export class MissionControlState {
  private readonly simulator: DemoLineSimulator;
  private readonly dispatchService: WmsWcsDispatchService;
  private readonly maxFrames: number;
  private readonly maxEvents: number;
  private readonly now: () => Date;

  private readonly frames: DemoLineFrame[] = [];
  private readonly events: MissionControlEvent[] = [];
  private readonly dispatchCounters = {
    dispatched: 0,
    deadLetter: 0,
    duplicate: 0,
  };

  private nextEventId = 1;

  constructor(options: MissionControlStateOptions = {}) {
    this.maxFrames = options.maxFrames ?? DEFAULT_MAX_FRAMES;
    this.maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    this.now = options.now ?? (() : Date => new Date());

    this.simulator = new DemoLineSimulator({
      seed: options.seed,
      baseTimestamp: this.now(),
    });

    this.dispatchService = new WmsWcsDispatchService(
      options.dispatchExecutor ?? defaultDispatchExecutor(this.now),
      {
        now: this.now,
        maxRetries: 2,
      }
    );

    const initialFrames = Math.max(1, options.initialFrames ?? DEFAULT_INITIAL_FRAMES);
    this.recordFrames(this.simulator.generateFrames(initialFrames));
  }

  tick(): DemoLineFrame {
    const frame = this.simulator.nextFrame();
    this.recordFrame(frame);
    return frame;
  }

  getCommandCenterSnapshot(): CommandCenterSnapshot {
    const latestFrame = this.getLatestFrame();

    return {
      scenarioId: latestFrame.scenarioId,
      lineId: latestFrame.lineId,
      updatedAt: latestFrame.timestamp,
      throughputUnitsPerMinute: getNumberPointValue(latestFrame, 'throughput.units_per_min'),
      cycleTimeSeconds: getNumberPointValue(latestFrame, 'cycle_time.seconds'),
      jamDetected: getBooleanPointValue(latestFrame, 'fault.jam_detected'),
      dispatch: {
        ...this.dispatchCounters,
        pendingDeadLetters: this.dispatchService.getDeadLetterQueue().length,
      },
    };
  }

  getLineViewSnapshot(limit = 20): LineViewSnapshot {
    const latestFrame = this.getLatestFrame();
    const boundedLimit = Math.max(1, limit);

    return {
      scenarioId: latestFrame.scenarioId,
      lineId: latestFrame.lineId,
      latestFrame,
      recentFrames: this.frames.slice(-boundedLimit),
    };
  }

  getEvents(limit = 50): MissionControlEvent[] {
    const boundedLimit = Math.max(1, limit);
    return this.events.slice(-boundedLimit).reverse();
  }

  getDispatchPolicy(input: {
    commandType: WmsWcsCommandType;
    actorRole: MissionControlActorRole;
    confirmationAccepted: boolean;
    approvedByRole?: MissionControlActorRole;
  }): MissionControlDispatchPolicyDecision {
    if (!input.confirmationAccepted) {
      return {
        status: 'denied',
        reason: 'Dispatch confirmation is required before command submission.',
        requiredApprovalRole: null,
      };
    }

    const requiredApprovalRole = COMMAND_TYPE_APPROVAL_REQUIREMENT[input.commandType];

    if (!requiredApprovalRole) {
      return {
        status: 'allowed',
        reason: 'Command is eligible for direct dispatch by current actor role.',
        requiredApprovalRole: null,
      };
    }

    const actorRank = ROLE_RANK[input.actorRole];
    const requiredRank = ROLE_RANK[requiredApprovalRole];

    if (actorRank >= requiredRank) {
      return {
        status: 'allowed',
        reason: `Actor role ${input.actorRole} satisfies approval requirement for ${input.commandType}.`,
        requiredApprovalRole,
      };
    }

    if (input.approvedByRole && ROLE_RANK[input.approvedByRole] >= requiredRank) {
      return {
        status: 'allowed',
        reason: `Secondary approval by ${input.approvedByRole} satisfies requirement for ${input.commandType}.`,
        requiredApprovalRole,
      };
    }

    return {
      status: 'requires-approval',
      reason: `${input.commandType} requires ${requiredApprovalRole} approval for actor role ${input.actorRole}.`,
      requiredApprovalRole,
    };
  }

  async dispatchCommand(rawCommand: unknown): Promise<WmsWcsDispatchResult> {
    const { command, control, commandType } = this.normalizeDispatchRequest(rawCommand);

    if (control && commandType) {
      const policy = this.getDispatchPolicy({
        commandType,
        actorRole: control.actorRole,
        confirmationAccepted: control.confirmationAccepted,
        approvedByRole: control.approvedByRole,
      });

      if (policy.status !== 'allowed') {
        this.recordEvent({
          type: 'dispatch',
          severity: 'warning',
          message: `Dispatch blocked by control policy: ${policy.reason}`,
          details: {
            commandType,
            actorRole: control.actorRole,
            approvedByRole: control.approvedByRole,
            policyStatus: policy.status,
            requiredApprovalRole: policy.requiredApprovalRole,
          },
        });
        throw new Error(policy.reason);
      }
    }

    const result = await this.dispatchService.submit(command);

    if (result.status === 'dispatched') {
      this.dispatchCounters.dispatched += 1;
      this.recordEvent({
        type: 'dispatch',
        severity: 'info',
        message: `Dispatch accepted for ${result.normalizedCommand.command.commandId}.`,
        details: {
          idempotencyKey: result.idempotencyKey,
          attempts: result.attempts,
        },
      });
    }

    if (result.status === 'dead-letter') {
      this.dispatchCounters.deadLetter += 1;
      this.recordEvent({
        type: 'dispatch',
        severity: 'critical',
        message: `Dispatch dead-lettered for ${result.normalizedCommand.command.commandId}.`,
        details: {
          idempotencyKey: result.idempotencyKey,
          attempts: result.attempts,
          code: result.failure.code,
        },
      });
    }

    if (result.status === 'duplicate') {
      this.dispatchCounters.duplicate += 1;
      this.recordEvent({
        type: 'dispatch',
        severity: 'warning',
        message: `Duplicate dispatch ignored for key ${result.idempotencyKey}.`,
        details: {
          status: result.originalResult.status,
        },
      });
    }

    return result;
  }

  private normalizeDispatchRequest(rawCommand: unknown): {
    command: unknown;
    control: MissionControlDispatchControlInput | null;
    commandType: WmsWcsCommandType | null;
  } {
    const envelope = this.toRecord(rawCommand);
    const hasCommandEnvelope = envelope !== null && 'command' in envelope;
    const command = hasCommandEnvelope ? envelope.command : rawCommand;
    const commandType = this.tryGetCommandType(command);

    if (!hasCommandEnvelope) {
      return {
        command,
        commandType,
        control: null,
      };
    }

    const control = this.normalizeControlInput(envelope.control);
    if (!control) {
      return {
        command,
        commandType,
        control: null,
      };
    }

    return {
      command,
      commandType,
      control,
    };
  }

  private normalizeControlInput(rawControl: unknown): MissionControlDispatchControlInput | null {
    const control = this.toRecord(rawControl);
    if (!control) {
      return null;
    }

    const actorRole = this.tryGetRole(control.actorRole);
    const confirmationAccepted = control.confirmationAccepted === true;
    const approvedByRole = this.tryGetRole(control.approvedByRole);

    if (!actorRole) {
      return null;
    }

    return {
      actorRole,
      confirmationAccepted,
      approvedByRole: approvedByRole ?? undefined,
    };
  }

  private tryGetCommandType(rawCommand: unknown): WmsWcsCommandType | null {
    const command = this.toRecord(rawCommand) as Partial<WmsWcsDispatchCommand> | null;
    if (!command || typeof command.commandType !== 'string') {
      return null;
    }

    if (!(command.commandType in COMMAND_TYPE_APPROVAL_REQUIREMENT)) {
      return null;
    }

    return command.commandType as WmsWcsCommandType;
  }

  private tryGetRole(value: unknown): MissionControlActorRole | null {
    if (value === 'operator' || value === 'supervisor' || value === 'admin') {
      return value;
    }

    return null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private getLatestFrame(): DemoLineFrame {
    if (this.frames.length === 0) {
      throw new Error('Mission control state is not initialized with frames.');
    }

    const latest = this.frames[this.frames.length - 1];
    return latest;
  }

  private recordFrames(frames: DemoLineFrame[]): void {
    frames.forEach(frame => this.recordFrame(frame));
  }

  private recordFrame(frame: DemoLineFrame): void {
    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) {
      this.frames.splice(0, this.frames.length - this.maxFrames);
    }

    const throughput = getNumberPointValue(frame, 'throughput.units_per_min');
    this.recordEvent({
      type: 'telemetry',
      severity: 'info',
      message: `Telemetry tick ${frame.step}: throughput ${throughput} units/min.`,
      timestamp: frame.timestamp,
    });

    if (getBooleanPointValue(frame, 'fault.jam_detected')) {
      this.recordEvent({
        type: 'alarm',
        severity: 'critical',
        message: `Jam detected on ${frame.lineId}/${frame.deviceId}.`,
        timestamp: frame.timestamp,
      });
    }
  }

  private recordEvent(input: Omit<MissionControlEvent, 'id' | 'timestamp'> & { timestamp?: Date }): void {
    this.events.push({
      id: `evt-${this.nextEventId.toString().padStart(6, '0')}`,
      timestamp: input.timestamp ?? this.now(),
      type: input.type,
      severity: input.severity,
      message: input.message,
      details: input.details,
    });

    this.nextEventId += 1;

    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }
}
