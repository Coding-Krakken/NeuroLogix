import {
  WmsWcsDispatchCommand,
  WmsWcsDispatchCommandSchema,
  createWmsWcsIdempotencyKey,
} from '@neurologix/schemas';

export type WmsWcsIngestionErrorCode = 'INVALID_COMMAND';

export type WmsWcsIngestionResult =
  | {
      ok: true;
      value: WmsWcsNormalizedCommand;
    }
  | {
      ok: false;
      error: {
        code: WmsWcsIngestionErrorCode;
        message: string;
      };
    };

export interface WmsWcsNormalizedCommand {
  source: 'wms-wcs';
  idempotencyKey: string;
  command: WmsWcsDispatchCommand;
}

export type DispatchFailureClassification = 'transient' | 'terminal';

export interface DispatchFailure {
  code: string;
  message: string;
  classification: DispatchFailureClassification;
}

export interface WmsWcsDispatchReceipt {
  providerDispatchId: string;
  acceptedAt: Date;
  metadata?: Record<string, unknown>;
}

export type WmsWcsDispatchResult =
  | {
      status: 'dispatched';
      idempotencyKey: string;
      attempts: number;
      normalizedCommand: WmsWcsNormalizedCommand;
      receipt: WmsWcsDispatchReceipt;
    }
  | {
      status: 'dead-letter';
      idempotencyKey: string;
      attempts: number;
      normalizedCommand: WmsWcsNormalizedCommand;
      failure: DispatchFailure;
    }
  | {
      status: 'duplicate';
      idempotencyKey: string;
      originalResult: Exclude<WmsWcsDispatchResult, { status: 'duplicate' }>;
    };

export interface WmsWcsDeadLetterEntry {
  idempotencyKey: string;
  commandId: string;
  sourceSystem: WmsWcsDispatchCommand['sourceSystem'];
  attempts: number;
  code: string;
  reason: string;
  classification: DispatchFailureClassification;
  failedAt: Date;
}

export interface WmsWcsDispatchServiceOptions {
  maxRetries?: number;
  now?: () => Date;
}

export type WmsWcsDispatchExecutor = (
  command: WmsWcsDispatchCommand,
  attempt: number
) => Promise<WmsWcsDispatchReceipt>;

const transientFailureCodes = new Set(['TRANSIENT_TIMEOUT', 'TRANSIENT_UNAVAILABLE']);

function classifyFailure(error: unknown): DispatchFailure {
  if (error instanceof Error) {
    const maybeCode =
      typeof (error as Error & { code?: unknown }).code === 'string'
        ? String((error as Error & { code?: string }).code)
        : 'TERMINAL_UNKNOWN';
    const classification: DispatchFailureClassification = transientFailureCodes.has(maybeCode)
      ? 'transient'
      : 'terminal';

    return {
      code: maybeCode,
      message: error.message,
      classification,
    };
  }

  return {
    code: 'TERMINAL_UNKNOWN',
    message: 'Unknown dispatch failure',
    classification: 'terminal',
  };
}

export class WmsWcsCommandIngestionAdapter {
  ingest(rawCommand: unknown): WmsWcsIngestionResult {
    const parsed = WmsWcsDispatchCommandSchema.safeParse(rawCommand);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_COMMAND',
          message: 'Command does not satisfy bounded WMS/WCS dispatch contract.',
        },
      };
    }

    return {
      ok: true,
      value: {
        source: 'wms-wcs',
        idempotencyKey: createWmsWcsIdempotencyKey(parsed.data),
        command: parsed.data,
      },
    };
  }
}

export class WmsWcsDispatchService {
  private readonly ingestionAdapter = new WmsWcsCommandIngestionAdapter();
  private readonly now: () => Date;
  private readonly maxRetries: number;
  private readonly dispatchOutcomes = new Map<
    string,
    Exclude<WmsWcsDispatchResult, { status: 'duplicate' }>
  >();
  private readonly deadLetterQueue: WmsWcsDeadLetterEntry[] = [];

  constructor(
    private readonly executor: WmsWcsDispatchExecutor,
    options: WmsWcsDispatchServiceOptions = {}
  ) {
    this.maxRetries = Math.max(0, Math.floor(options.maxRetries ?? 2));
    this.now = options.now ?? (() : Date => new Date());
  }

  getDeadLetterQueue(): WmsWcsDeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  async submit(rawCommand: unknown): Promise<WmsWcsDispatchResult> {
    const ingested = this.ingestionAdapter.ingest(rawCommand);
    if (!ingested.ok) {
      throw new Error(ingested.error.message);
    }

    const existingResult = this.dispatchOutcomes.get(ingested.value.idempotencyKey);
    if (existingResult) {
      return {
        status: 'duplicate',
        idempotencyKey: ingested.value.idempotencyKey,
        originalResult: existingResult,
      };
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      attempt += 1;
      try {
        const receipt = await this.executor(ingested.value.command, attempt);
        const result: Exclude<WmsWcsDispatchResult, { status: 'duplicate' }> = {
          status: 'dispatched',
          idempotencyKey: ingested.value.idempotencyKey,
          attempts: attempt,
          normalizedCommand: ingested.value,
          receipt,
        };

        this.dispatchOutcomes.set(ingested.value.idempotencyKey, result);
        return result;
      } catch (error) {
        const failure = classifyFailure(error);

        if (failure.classification === 'transient' && attempt <= this.maxRetries) {
          continue;
        }

        const deadLetterEntry: WmsWcsDeadLetterEntry = {
          idempotencyKey: ingested.value.idempotencyKey,
          commandId: ingested.value.command.commandId,
          sourceSystem: ingested.value.command.sourceSystem,
          attempts: attempt,
          code: failure.code,
          reason: failure.message,
          classification: failure.classification,
          failedAt: this.now(),
        };

        this.deadLetterQueue.push(deadLetterEntry);

        const deadLetterResult: Exclude<WmsWcsDispatchResult, { status: 'duplicate' }> = {
          status: 'dead-letter',
          idempotencyKey: ingested.value.idempotencyKey,
          attempts: attempt,
          normalizedCommand: ingested.value,
          failure,
        };

        this.dispatchOutcomes.set(ingested.value.idempotencyKey, deadLetterResult);
        return deadLetterResult;
      }
    }

    throw new Error('Dispatch loop terminated unexpectedly.');
  }
}
