/**
 * Agent Dispatcher
 *
 * Dispatches next agent via code chat CLI with handoff context
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentId, HandoffCommentData, WorkItemContext } from "./types";
import { logError, logInfo } from "./logger";
import { MetadataHeaderBuilder } from "./metadata-header-builder";

const execFileAsync = promisify(execFile);

export interface DispatchConfig {
  codeCommand?: string; // 'code' or 'code-oss'
  timeout?: number; // milliseconds
  dryRun?: boolean;
}

export interface DispatchResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export class AgentDispatcher {
  private readonly config: DispatchConfig;
  private readonly chainTaskNumberStore = new Map<string, number>();

  constructor(config: Partial<DispatchConfig> = {}) {
    this.config = {
      codeCommand: config.codeCommand ?? this.detectCodeCommand(),
      timeout: config.timeout ?? 300000, // 5 minutes
      dryRun: config.dryRun ?? process.env["SUBZERO_DISPATCH_DRY_RUN"] === "1",
    };
  }

  /**
   * Dispatch next agent via code chat
   *
   * This is MANDATORY - both posting the handoff comment AND dispatching the agent must succeed.
   */
  async dispatch(
    nextAgent: AgentId,
    context: WorkItemContext,
    handoffCommentUrl: string,
    extraInstructions?: string,
  ): Promise<DispatchResult> {
    const chainTaskNumber = this.resolveChainTaskNumber(context);

    // Build strict prompt
    const prompt = this.buildPrompt(
      nextAgent,
      context,
      handoffCommentUrl,
      chainTaskNumber,
      extraInstructions,
    );

    // Get repository path
    const repoPath = process.cwd();

    // Build command
    const args = ["chat", "-m", nextAgent, "--add-file", repoPath];

    // Add prompt as final argument
    args.push(prompt);

    // Execute
    if (this.config.dryRun) {
      logInfo("[DRY RUN] Would dispatch agent:");
      logInfo(`  Agent: ${nextAgent}`);
      logInfo(`  Command: ${this.config.codeCommand} ${args.join(" ")}`);
      logInfo(`  Prompt: ${prompt}`);
      this.persistNextChainTaskNumber(context, chainTaskNumber);

      return {
        success: true,
        stdout: "[DRY RUN] Simulated dispatch success",
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        this.config.codeCommand!,
        args,
        {
          timeout: this.config.timeout,
          windowsHide: true,
          cwd: repoPath,
        },
      );

      logInfo(`✅ Successfully dispatched to ${nextAgent}`);
      logInfo(`   Handoff: ${handoffCommentUrl}`);
      this.persistNextChainTaskNumber(context, chainTaskNumber);

      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        code?: string;
      };

      logError(`❌ Failed to dispatch to ${nextAgent}`);
      logError(`   Error: ${err.message}`);
      logError(`   Stderr: ${err.stderr || "N/A"}`);

      return {
        success: false,
        stdout: err.stdout?.toString(),
        stderr: err.stderr?.toString(),
        error: err.message || `Dispatch failed with code ${err.code}`,
      };
    }
  }

  /**
   * Build strict prompt for next agent
   *
   * The prompt MUST include:
   * - Handoff comment URL
   * - Explicit instruction to read it
   * - Explicit instruction to post their own handoff before dispatching again
   */
  private buildPrompt(
    nextAgent: AgentId,
    context: WorkItemContext,
    handoffCommentUrl: string,
    chainTaskNumber: number,
    extraInstructions?: string,
  ): string {
    const header = MetadataHeaderBuilder.build({
      issueNumber: context.issueNumber,
      prNumber: context.prNumber,
      taskLabel: context.taskLabel,
      taskId: context.taskId,
      chainTaskNumber,
      targetAgent: nextAgent,
    });

    const parts = [
      `Handoff URL: ${handoffCommentUrl}`,
      ``,
      `Work Item: Issue #${context.issueNumber}${context.prNumber ? ` | PR #${context.prNumber}` : ""}`,
      `Branch: ${context.branchName}`,
      ``,
      `🔗 READ THIS HANDOFF FIRST:`,
      `Open the URL in the line above and read the full handoff comment.`,
      ``,
      `✅ MANDATORY INSTRUCTIONS:`,
      `1. Read the handoff comment from the Handoff URL line.`,
      `2. Follow the complete "Next actions" checklist from that handoff comment.`,
      `3. Post a new handoff comment after your work using the handoff template.`,
      `4. Dispatch the next agent and include your new handoff comment URL.`,
      ``,
      `📦 Repository: ${context.repo}`,
      `🔧 Your role: Execute the next actions from the handoff`,
      ``,
    ];

    if (extraInstructions) {
      parts.push(`📝 Additional Context:`);
      parts.push(extraInstructions);
      parts.push(``);
    }

    parts.push(
      `⚠️  CRITICAL: If you encounter blockers, post a "Blocked" handoff and dispatch to the appropriate escalation path.`,
    );
    parts.push(``);
    parts.push(`Begin work now.`);

    return `${header}\n\n${parts.join("\n")}`;
  }

  private resolveChainTaskNumber(context: WorkItemContext): number {
    if (
      typeof context.chainTaskNumber === "number" &&
      Number.isInteger(context.chainTaskNumber) &&
      context.chainTaskNumber > 0
    ) {
      return context.chainTaskNumber;
    }

    const existing = this.chainTaskNumberStore.get(
      this.getChainStateKey(context),
    );
    return existing ?? 1;
  }

  private persistNextChainTaskNumber(
    context: WorkItemContext,
    currentChainTaskNumber: number,
  ): void {
    const nextChainTaskNumber = currentChainTaskNumber + 1;
    this.chainTaskNumberStore.set(
      this.getChainStateKey(context),
      nextChainTaskNumber,
    );
    context.chainTaskNumber = nextChainTaskNumber;
  }

  private getChainStateKey(context: WorkItemContext): string {
    const baseKey = `${context.repo}|issue:${context.issueNumber}|pr:${context.prNumber ?? "none"}`;
    if (context.runId) {
      return `${baseKey}|run:${context.runId}`;
    }
    if (context.taskId) {
      return `${baseKey}|task:${context.taskId}`;
    }
    return baseKey;
  }

  /**
   * Detect which VS Code command is available
   */
  private detectCodeCommand(): string {
    // Check environment variable first
    if (process.env["SUBZERO_CODE_COMMAND"]) {
      return process.env["SUBZERO_CODE_COMMAND"];
    }

    // Default to 'code' (most common)
    return "code";
  }

  /**
   * Validate that code command is available
   */
  async validateCodeCommand(): Promise<boolean> {
    try {
      await execFileAsync(this.config.codeCommand!, ["--version"], {
        timeout: 5000,
        windowsHide: true,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Default singleton instance
 */
export const defaultAgentDispatcher = new AgentDispatcher();

interface HandoffProvider {
  postHandoff(
    context: WorkItemContext,
    data: HandoffCommentData,
  ): Promise<{ commentUrl: string }>;
}

/**
 * High-level helper: Post handoff + Dispatch (BOTH MANDATORY)
 *
 * This enforces the non-negotiable requirement: posting a handoff comment AND
 * dispatching the next agent must BOTH succeed. If either fails, the whole operation fails.
 */
export async function postHandoffAndDispatch(
  handoffProvider: HandoffProvider,
  dispatcher: AgentDispatcher,
  context: WorkItemContext,
  handoffData: HandoffCommentData,
  extraInstructions?: string,
): Promise<{ commentUrl: string; dispatchResult: DispatchResult }> {
  // Step 1: Post handoff comment (MANDATORY)
  logInfo(
    `📤 Posting handoff comment for ${context.agent} → ${handoffData.nextAgent}`,
  );
  const { commentUrl } = await handoffProvider.postHandoff(
    context,
    handoffData,
  );

  // Step 2: Dispatch next agent (MANDATORY)
  logInfo(`📨 Dispatching to ${handoffData.nextAgent}`);
  const dispatchResult = await dispatcher.dispatch(
    handoffData.nextAgent,
    context,
    commentUrl,
    extraInstructions,
  );

  // Both must succeed
  if (!dispatchResult.success) {
    throw new Error(
      `Dispatch failed after handoff was posted. Handoff: ${commentUrl}. Error: ${dispatchResult.error}`,
    );
  }

  logInfo(`✅ Handoff complete: ${context.agent} → ${handoffData.nextAgent}`);
  logInfo(`   Comment: ${commentUrl}`);

  return { commentUrl, dispatchResult };
}
