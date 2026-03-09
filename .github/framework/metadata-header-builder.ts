import type { AgentId } from './types';

export interface MetadataHeaderContext {
  issueNumber?: number;
  prNumber?: number;
  taskLabel?: string;
  taskId?: string;
  chainTaskNumber?: number;
  targetAgent: AgentId;
}

export class MetadataHeaderBuilder {
  static build(context: MetadataHeaderContext): string {
    const workItem = this.resolveWorkItem(context);
    const taskNumber = this.resolveChainTaskNumber(context.chainTaskNumber);
    return `[${workItem}] [Task ${taskNumber}] [To: ${context.targetAgent}]`;
  }

  private static resolveWorkItem(context: MetadataHeaderContext): string {
    if (typeof context.issueNumber === 'number') {
      return `Issue#${context.issueNumber}`;
    }

    if (typeof context.prNumber === 'number') {
      return `PR#${context.prNumber}`;
    }

    const normalizedLabel = this.normalizeTaskLabel(context.taskLabel);
    if (normalizedLabel) {
      return normalizedLabel;
    }

    const taskToken = this.resolveTaskToken(context.taskId);
    return `Ref ${taskToken}`;
  }

  private static resolveChainTaskNumber(chainTaskNumber?: number): number {
    if (
      typeof chainTaskNumber === 'number' &&
      Number.isInteger(chainTaskNumber) &&
      chainTaskNumber > 0
    ) {
      return chainTaskNumber;
    }
    return 1;
  }

  private static normalizeTaskLabel(taskLabel?: string): string | undefined {
    if (!taskLabel) {
      return undefined;
    }

    const normalized = taskLabel.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return undefined;
    }

    const words = normalized.split(' ');
    if (words.length <= 2) {
      return normalized;
    }

    return undefined;
  }

  private static resolveTaskToken(taskId?: string): string {
    if (!taskId) {
      return '1';
    }

    const normalized = taskId.trim();
    if (!normalized) {
      return '1';
    }

    const numeric = normalized.match(/\d+/)?.[0];
    if (numeric) {
      return numeric;
    }

    return normalized.split(/\s+/)[0] || '1';
  }
}
