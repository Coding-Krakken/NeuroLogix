/**
 * Context Resolver
 *
 * Resolves work item context from environment variables, CLI args, or auto-detection
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { WorkItemContext, AgentId } from "./types";

const execFileAsync = promisify(execFile);

export interface ContextResolverConfig {
  repo?: string;
  issueNumber?: number;
  prNumber?: number;
  agent?: AgentId;
  nextAgent?: AgentId;
  branchName?: string;
  runId?: string;
  taskId?: string;
}

export class ContextResolver {
  /**
   * Resolve work item context from multiple sources
   * Priority: Explicit config > Environment variables > Auto-detection
   */
  async resolve(
    config: Partial<ContextResolverConfig> = {},
  ): Promise<WorkItemContext> {
    const repo =
      config.repo ||
      this.getEnvVar("SUBZERO_REPO") ||
      (await this.detectRepo());
    const issueNumber =
      config.issueNumber ||
      this.getEnvVarInt("SUBZERO_ISSUE") ||
      (await this.detectIssueFromBranch());
    const prNumber =
      config.prNumber ||
      this.getEnvVarInt("SUBZERO_PR") ||
      (await this.detectPR(issueNumber));
    const branchName =
      config.branchName ||
      this.getEnvVar("SUBZERO_BRANCH") ||
      (await this.detectBranch());
    const agent =
      config.agent ||
      (this.getEnvVar("SUBZERO_AGENT") as AgentId) ||
      ("00-chief-of-staff" as AgentId);
    const nextAgent =
      config.nextAgent ||
      (this.getEnvVar("SUBZERO_NEXT_AGENT") as AgentId | undefined);
    const runId = config.runId || this.getEnvVar("SUBZERO_RUN_ID");
    const taskId = config.taskId || this.getEnvVar("SUBZERO_TASK_ID");

    if (!repo) {
      throw new Error(
        "Failed to resolve repository. Set SUBZERO_REPO or ensure git remote origin is configured.",
      );
    }

    if (!issueNumber) {
      throw new Error(
        "Failed to resolve issue number. Set SUBZERO_ISSUE or use branch naming convention (feature/123-description).",
      );
    }

    if (!branchName) {
      throw new Error(
        "Failed to resolve branch name. Ensure you are in a git repository.",
      );
    }

    return {
      repo,
      issueNumber,
      prNumber,
      branchName,
      agent,
      nextAgent,
      runId,
      taskId,
    };
  }

  /**
   * Get environment variable
   */
  private getEnvVar(name: string): string | undefined {
    return process.env[name];
  }

  /**
   * Get environment variable as integer
   */
  private getEnvVarInt(name: string): number | undefined {
    const value = process.env[name];
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Detect repository from git remote origin
   */
  private async detectRepo(): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["remote", "get-url", "origin"],
        { windowsHide: true },
      );
      const url = stdout.trim();

      // Parse GitHub URL: https://github.com/owner/repo.git or git@github.com:owner/repo.git
      const httpsMatch = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
      if (httpsMatch && httpsMatch[1] && httpsMatch[2]) {
        return `${httpsMatch[1]}/${httpsMatch[2].replace(/\.git$/, "")}`;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detect current branch name
   */
  private async detectBranch(): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["branch", "--show-current"],
        { windowsHide: true },
      );
      return stdout.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detect issue number from branch name
   * Supports patterns: feature/123-description, bugfix/456-fix, etc.
   */
  private async detectIssueFromBranch(): Promise<number | undefined> {
    const branchName = await this.detectBranch();
    if (!branchName) return undefined;

    const match = branchName.match(
      /^(?:feature|bugfix|fix|chore|docs|hotfix)\/(\d+)-/,
    );
    if (match && match[1]) {
      return Number.parseInt(match[1], 10);
    }

    return undefined;
  }

  /**
   * Detect PR number linked to issue
   */
  private async detectPR(
    issueNumber: number | undefined,
  ): Promise<number | undefined> {
    if (!issueNumber) return undefined;

    try {
      // Try to find PR that closes this issue
      const { stdout } = await execFileAsync(
        "gh",
        [
          "pr",
          "list",
          "--search",
          `closes #${issueNumber}`,
          "--json",
          "number",
          "--limit",
          "1",
        ],
        { windowsHide: true },
      );

      const prs = JSON.parse(stdout) as Array<{ number: number }>;
      return prs.length > 0 ? prs[0]?.number : undefined;
    } catch {
      // If gh CLI fails, try branch-based detection
      try {
        const branchName = await this.detectBranch();
        if (!branchName) return undefined;

        const { stdout: prStdout } = await execFileAsync(
          "gh",
          ["pr", "view", branchName, "--json", "number"],
          { windowsHide: true },
        );

        const pr = JSON.parse(prStdout) as { number: number };
        return pr.number;
      } catch {
        return undefined;
      }
    }
  }
}

/**
 * Default singleton instance
 */
export const defaultContextResolver = new ContextResolver();
