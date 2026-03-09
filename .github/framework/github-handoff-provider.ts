/**
 * GitHub Handoff Provider
 *
 * Manages GitHub-native handoffs via Issues and PR comments
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  WorkItemContext,
  HandoffCommentData,
  GitHubClientConfig,
  HandoffProviderConfig,
} from "./types";
import { CommentTemplateService } from "./comment-template-service";
import { logInfo } from "./logger";

const execFileAsync = promisify(execFile);

export interface PostCommentResult {
  commentUrl: string;
  commentId: number;
}

interface GitHubCommentRecord {
  id?: number;
  url?: string;
  html_url?: string;
  body?: string;
}

export class GitHubHandoffProvider {
  private readonly config: GitHubClientConfig;
  private readonly commentTarget: "pr_preferred" | "issue_only" | "pr_only";
  private readonly templateService: CommentTemplateService;

  constructor(
    config: Partial<GitHubClientConfig & { templatesDir?: string }> = {},
    commentTarget: "pr_preferred" | "issue_only" | "pr_only" = "pr_preferred",
    templateService?: CommentTemplateService,
  ) {
    this.config = {
      dryRun: config.dryRun ?? false,
      retryAttempts: config.retryAttempts ?? 3,
      retryBackoffMs: config.retryBackoffMs ?? 1000,
    };
    this.commentTarget = commentTarget;
    this.templateService =
      templateService || new CommentTemplateService(config.templatesDir);
  }

  /**
   * Post a handoff comment to GitHub (PR preferred, fallback to Issue)
   */
  async postHandoff(
    context: WorkItemContext,
    data: HandoffCommentData,
  ): Promise<PostCommentResult> {
    // Validate GitHub CLI authentication
    await this.validateGitHubAuth();

    // Determine target (PR or Issue) - do this first to fail fast if PR required but missing
    const target = this.resolveCommentTarget(context);

    // Render handoff template
    const commentBody = await this.renderHandoffComment(data);

    // Post comment
    const result = await this.postComment(context, target, commentBody);

    // Update data with comment URL
    data.links.commentUrl = result.commentUrl;

    return result;
  }

  /**
   * Read latest comments from Issue/PR
   */
  async readComments(
    context: WorkItemContext,
    limit: number = 25,
  ): Promise<string[]> {
    if (this.config.dryRun) {
      return ["[DRY RUN] Simulated comment 1", "[DRY RUN] Simulated comment 2"];
    }

    const target = this.resolveCommentTarget(context);
    const type = target === "pr" ? "pr" : "issue";
    const number = target === "pr" ? context.prNumber : context.issueNumber;

    if (!number) {
      throw new Error(`No ${type} number available for reading comments`);
    }

    try {
      const { stdout } = await execFileAsync(
        "gh",
        [
          type,
          "view",
          String(number),
          "--json",
          "comments",
          "--jq",
          `.comments[-${limit}:] | .[].body`,
        ],
        { windowsHide: true },
      );

      return stdout.trim().split("\n").filter(Boolean);
    } catch (error) {
      throw new Error(`Failed to read comments: ${(error as Error).message}`);
    }
  }

  /**
   * Get issue body and description
   */
  async readIssue(
    issueNumber: number,
  ): Promise<{ title: string; body: string }> {
    if (this.config.dryRun) {
      return {
        title: "[DRY RUN] Sample Issue Title",
        body: "[DRY RUN] Sample issue body",
      };
    }

    try {
      const { stdout } = await execFileAsync(
        "gh",
        ["issue", "view", String(issueNumber), "--json", "title,body"],
        { windowsHide: true },
      );

      const data = JSON.parse(stdout) as { title: string; body: string };
      return data;
    } catch (error) {
      throw new Error(
        `Failed to read issue #${issueNumber}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get PR description and details
   */
  async readPR(
    prNumber: number,
  ): Promise<{ title: string; body: string; state: string }> {
    if (this.config.dryRun) {
      return {
        title: "[DRY RUN] Sample PR Title",
        body: "[DRY RUN] Sample PR body",
        state: "OPEN",
      };
    }

    try {
      const { stdout } = await execFileAsync(
        "gh",
        ["pr", "view", String(prNumber), "--json", "title,body,state"],
        { windowsHide: true },
      );

      const data = JSON.parse(stdout) as {
        title: string;
        body: string;
        state: string;
      };
      return data;
    } catch (error) {
      throw new Error(
        `Failed to read PR #${prNumber}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get CI run URL for PR
   */
  async getCIRunUrl(prNumber: number): Promise<string | undefined> {
    if (this.config.dryRun) {
      return "https://github.com/example/repo/actions/runs/123456789";
    }

    try {
      const { stdout } = await execFileAsync(
        "gh",
        [
          "pr",
          "checks",
          String(prNumber),
          "--json",
          "detailsUrl",
          "--jq",
          ".[0].detailsUrl",
        ],
        { windowsHide: true },
      );

      const url = stdout.trim();
      return url || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Validate GitHub CLI is authenticated
   */
  private async validateGitHubAuth(): Promise<void> {
    if (this.config.dryRun) {
      return;
    }

    try {
      await execFileAsync("gh", ["auth", "status"], { windowsHide: true });
    } catch {
      throw new Error(
        "GitHub CLI (gh) is not authenticated. Run: gh auth login",
      );
    }
  }

  /**
   * Render handoff comment from template
   */
  private async renderHandoffComment(
    data: HandoffCommentData,
  ): Promise<string> {
    const variables = {
      AGENT_NAME: data.agent,
      ISSUE_NUMBER: data.workItem.issueNumber,
      PR_NUMBER: data.workItem.prNumber,
      STATUS: data.status,
      TIMESTAMP: new Date().toISOString(),
      FILES_CHANGED_COUNT: data.changesSummary.filesChanged,
      LINES_ADDED: data.changesSummary.linesAdded,
      LINES_REMOVED: data.changesSummary.linesRemoved,
      NEXT_AGENT_ID: data.nextAgent,
      COMMENT_URL: data.links.commentUrl || "(will be filled after posting)",
      CI_RUN_URL: data.links.ciRunUrl || "N/A",
      DOCS_URL: data.links.docsUrl || "N/A",
      TEST_EVIDENCE_URL: data.links.testEvidenceUrl || "N/A",
      // Convert arrays to bullet lists
      SCOPE_ITEM_1: data.scopeCompleted[0] || "",
      SCOPE_ITEM_2: data.scopeCompleted[1] || "",
      SCOPE_ITEM_3: data.scopeCompleted[2] || "",
      VERIFICATION_COMMAND_1: data.verification.commandsRun[0] || "",
      VERIFICATION_COMMAND_2: data.verification.commandsRun[1] || "",
      VERIFICATION_COMMAND_3: data.verification.commandsRun[2] || "",
      EXPECTED_OUTCOME_1: data.verification.expectedOutcome[0] || "",
      EXPECTED_OUTCOME_2: data.verification.expectedOutcome[1] || "",
      EXPECTED_OUTCOME_3: data.verification.expectedOutcome[2] || "",
      ACTUAL_OUTCOME_1: data.verification.actualOutcome[0] || "",
      ACTUAL_OUTCOME_2: data.verification.actualOutcome[1] || "",
      ACTUAL_OUTCOME_3: data.verification.actualOutcome[2] || "",
      RISK_1: data.risks[0] || "None identified",
      RISK_2: data.risks[1] || "",
      NEXT_ACTION_1: data.nextActions[0] || "",
      NEXT_ACTION_2: data.nextActions[1] || "",
      NEXT_ACTION_3: data.nextActions[2] || "",
      NEXT_ACTION_4: data.nextActions[3] || "",
    };

    return await this.templateService.render("handoff", variables);
  }

  /**
   * Determine comment target (PR or Issue)
   */
  private resolveCommentTarget(context: WorkItemContext): "pr" | "issue" {
    if (this.commentTarget === "issue_only") {
      return "issue";
    }

    if (this.commentTarget === "pr_only") {
      if (!context.prNumber) {
        throw new Error("PR number required when commentTarget is pr_only");
      }
      return "pr";
    }

    // pr_preferred: use PR if available, otherwise Issue
    return context.prNumber ? "pr" : "issue";
  }

  /**
   * Post comment to GitHub with retry logic
   */
  private async postComment(
    context: WorkItemContext,
    target: "pr" | "issue",
    body: string,
  ): Promise<PostCommentResult> {
    const number = target === "pr" ? context.prNumber : context.issueNumber;

    if (!number) {
      throw new Error(`No ${target} number available for posting comment`);
    }

    if (this.config.dryRun) {
      logInfo("[DRY RUN] Would post comment:");
      logInfo(`  Target: ${target} #${number}`);
      logInfo(`  Body: ${body.substring(0, 200)}...`);

      return {
        commentUrl: `https://github.com/${context.repo}/${target === "pr" ? "pull" : "issues"}/${number}#issuecomment-dry-run`,
        commentId: 9999999,
      };
    }

    const existing = await this.findExistingCommentByBody(
      context,
      target,
      number,
      body,
    );
    if (existing) {
      logInfo(
        `♻️ Reusing existing ${target} comment for #${number}: ${existing.commentUrl}`,
      );
      return existing;
    }

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const posted = await this.postCommentViaApi(context, number, body);
        return posted;
      } catch (error) {
        lastError = error as Error;

        const postedBeforeFailure = await this.findExistingCommentByBody(
          context,
          target,
          number,
          body,
        );
        if (postedBeforeFailure) {
          logInfo(
            `♻️ Recovered existing ${target} comment after transient failure: ${postedBeforeFailure.commentUrl}`,
          );
          return postedBeforeFailure;
        }

        if (attempt < this.config.retryAttempts) {
          const backoffMs =
            this.config.retryBackoffMs * Math.pow(2, attempt - 1);
          await this.sleep(backoffMs);
        }
      }
    }

    throw new Error(
      `Failed to post comment after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Post a comment using GitHub API and return stable identifiers
   */
  private async postCommentViaApi(
    context: WorkItemContext,
    number: number,
    body: string,
  ): Promise<PostCommentResult> {
    const repo = this.resolveRepoSlug(context.repo);
    if (!repo) {
      throw new Error(
        `Cannot post comment via API without owner/repo slug. Received: ${context.repo}`,
      );
    }

    const { stdout } = await execFileAsync(
      "gh",
      [
        "api",
        `repos/${repo}/issues/${number}/comments`,
        "--method",
        "POST",
        "--raw-field",
        `body=${body}`,
      ],
      { windowsHide: true },
    );

    const posted = JSON.parse(stdout) as GitHubCommentRecord;
    const commentUrl = this.normalizeCommentUrl(context, number, posted);
    const commentId =
      posted.id ?? this.extractCommentId(commentUrl) ?? Number.NaN;

    if (!commentUrl || !Number.isFinite(commentId)) {
      throw new Error("GitHub API did not return a valid comment URL and ID");
    }

    return { commentUrl, commentId };
  }

  /**
   * Find an existing identical comment body to make posting idempotent
   */
  private async findExistingCommentByBody(
    context: WorkItemContext,
    target: "pr" | "issue",
    number: number,
    body: string,
  ): Promise<PostCommentResult | undefined> {
    try {
      const { stdout } = await execFileAsync(
        "gh",
        [
          target,
          "view",
          String(number),
          "--json",
          "comments",
        ],
        { windowsHide: true },
      );

      const parsed = JSON.parse(stdout) as {
        comments?: GitHubCommentRecord[];
      };

      const comments = parsed.comments ?? [];
      for (let idx = comments.length - 1; idx >= 0; idx--) {
        const comment = comments[idx];
        if (!comment || comment.body !== body) {
          continue;
        }

        const commentUrl = this.normalizeCommentUrl(context, number, comment);
        const commentId = comment.id ?? this.extractCommentId(commentUrl);
        if (!commentUrl || !commentId) {
          continue;
        }

        return {
          commentUrl,
          commentId,
        };
      }

      return undefined;
    } catch (error) {
      logInfo(
        `Unable to query existing ${target} comments for #${number}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  /**
   * Normalize GitHub comment URL from API/CLI variants
   */
  private normalizeCommentUrl(
    context: WorkItemContext,
    number: number,
    comment: GitHubCommentRecord,
  ): string | undefined {
    if (comment.html_url?.trim()) {
      return comment.html_url.trim();
    }

    if (comment.url?.trim()) {
      const rawUrl = comment.url.trim();
      const issueCommentMatch = rawUrl.match(/\/issues\/comments\/(\d+)$/);
      if (issueCommentMatch?.[1]) {
        const repo = this.resolveRepoSlug(context.repo);
        if (repo) {
          return `https://github.com/${repo}/issues/${number}#issuecomment-${issueCommentMatch[1]}`;
        }
      }
      if (rawUrl.includes("#issuecomment-")) {
        return rawUrl;
      }
    }

    return undefined;
  }

  private resolveRepoSlug(repo: string): string | undefined {
    const trimmed = repo.trim();
    return /^[^/\s]+\/[^/\s]+$/.test(trimmed) ? trimmed : undefined;
  }

  /**
   * Extract comment ID from GitHub comment URL
   */
  private extractCommentId(url: string | undefined): number | undefined {
    if (!url) {
      return undefined;
    }

    const match = url.match(/#issuecomment-(\d+)/);
    if (!match?.[1]) {
      return undefined;
    }

    return Number.parseInt(match[1], 10);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create configured GitHub handoff provider from environment
 */
export function createGitHubHandoffProvider(
  config: Partial<HandoffProviderConfig> = {},
): GitHubHandoffProvider {
  const dryRun =
    config.githubDryRun ?? process.env["SUBZERO_GITHUB_DRY_RUN"] === "1";
  const commentTarget =
    config.commentTarget ??
    (process.env["SUBZERO_GITHUB_COMMENT_TARGET"] as
      | "pr_preferred"
      | "issue_only"
      | "pr_only") ??
    "pr_preferred";

  return new GitHubHandoffProvider({ dryRun }, commentTarget);
}
