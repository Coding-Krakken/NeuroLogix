/**
 * GitHub Work Management Module
 *
 * Provides end-to-end Issue → Branch → Commits → PR → Review → Merge operations
 * with safe, idempotent command execution.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  IssueCreateInput,
  IssueRef,
  IssueSearchFilters,
  PullRequestCreateInput,
  PullRequestRef,
  WorkflowTaskSummary,
} from "./types";

const execFileAsync = promisify(execFile);

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface CommandExecutor {
  run(command: string, args: string[]): Promise<CommandExecutionResult>;
}

class DefaultCommandExecutor implements CommandExecutor {
  async run(command: string, args: string[]): Promise<CommandExecutionResult> {
    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        windowsHide: true,
      });
      return {
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        code: 0,
      };
    } catch (error) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        code?: number;
        message?: string;
      };
      return {
        stdout: String(err.stdout || ""),
        stderr: String(err.stderr || err.message || ""),
        code: typeof err.code === "number" ? err.code : 1,
      };
    }
  }
}

export class GithubWorkManagement {
  private readonly executor: CommandExecutor;

  constructor(executor: CommandExecutor = new DefaultCommandExecutor()) {
    this.executor = executor;
  }

  async createIssue(input: IssueCreateInput): Promise<IssueRef> {
    const args = [
      "issue",
      "create",
      "--title",
      input.title,
      "--body",
      input.body,
      "--json",
      "number,title,url,state",
    ];

    for (const label of input.labels) {
      args.push("--label", label);
    }

    for (const assignee of input.assignees || []) {
      args.push("--assignee", assignee);
    }

    const result = await this.executor.run("gh", args);
    this.ensureSuccess(result, "Failed to create issue");

    const parsed = this.parseJson<{
      number: number;
      title: string;
      url: string;
      state: "open" | "closed";
    }>(result.stdout);

    return {
      id: parsed.number,
      title: parsed.title,
      url: parsed.url,
      state: parsed.state,
    };
  }

  async listIssues(filters: IssueSearchFilters = {}): Promise<IssueRef[]> {
    const args = [
      "issue",
      "list",
      "--json",
      "number,title,url,state",
      "--state",
      filters.state ?? "open",
      "--limit",
      String(filters.limit ?? 30),
    ];

    for (const label of filters.labels || []) {
      args.push("--label", label);
    }

    if (filters.assignee) {
      args.push("--assignee", filters.assignee);
    }

    if (filters.search) {
      args.push("--search", filters.search);
    }

    const result = await this.executor.run("gh", args);
    this.ensureSuccess(result, "Failed to list issues");

    const parsed = this.parseJson<
      Array<{
        number: number;
        title: string;
        url: string;
        state: "open" | "closed";
      }>
    >(result.stdout);
    return parsed.map((issue) => ({
      id: issue.number,
      title: issue.title,
      url: issue.url,
      state: issue.state,
    }));
  }

  async commentOnIssue(issueNumber: number, comment: string): Promise<void> {
    const result = await this.executor.run("gh", [
      "issue",
      "comment",
      String(issueNumber),
      "--body",
      comment,
    ]);
    this.ensureSuccess(result, `Failed to comment on issue #${issueNumber}`);
  }

  async createBranchFromIssue(
    issueNumber: number,
    kind: "feature" | "bugfix" | "chore",
    slug: string,
  ): Promise<string> {
    const normalizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "");

    const branchName = `${kind}/${issueNumber}-${normalizedSlug}`;

    await this.ensureMainCheckedOut();
    await this.ensureBranchCreated(branchName);

    return branchName;
  }

  async currentBranch(): Promise<string> {
    const result = await this.executor.run("git", ["branch", "--show-current"]);
    this.ensureSuccess(result, "Failed to determine current branch");
    return result.stdout.trim();
  }

  async commitCheckpoint(
    message: string,
    issueNumber: number,
    body?: string,
  ): Promise<void> {
    const fullSubject = `${message} (#${issueNumber})`;
    const args = body
      ? ["commit", "-m", fullSubject, "-m", body]
      : ["commit", "-m", fullSubject];
    const result = await this.executor.run("git", args);
    this.ensureSuccess(result, "Failed to create commit checkpoint");
  }

  async createPullRequest(
    input: PullRequestCreateInput,
  ): Promise<PullRequestRef> {
    const body = this.withIssueClosure(input.body, input.issueNumber);
    const args = [
      "pr",
      "create",
      "--title",
      input.title,
      "--body",
      body,
      "--base",
      input.base,
      "--head",
      input.head,
    ];

    for (const label of input.labels || []) {
      args.push("--label", label);
    }

    const createResult = await this.executor.run("gh", args);
    this.ensureSuccess(createResult, "Failed to create pull request");

    const viewResult = await this.executor.run("gh", [
      "pr",
      "view",
      input.head,
      "--json",
      "number,title,url,state",
    ]);
    this.ensureSuccess(viewResult, "Failed to fetch pull request details");

    const parsed = this.parseJson<{
      number: number;
      title: string;
      url: string;
      state: "OPEN" | "MERGED" | "CLOSED";
    }>(viewResult.stdout);

    if (input.reviewers && input.reviewers.length > 0) {
      await this.requestReview(parsed.number, input.reviewers);
    }

    return {
      id: parsed.number,
      title: parsed.title,
      url: parsed.url,
      state: parsed.state,
    };
  }

  async updatePullRequestDescription(
    prNumber: number,
    body: string,
    issueNumber: number,
  ): Promise<void> {
    const mergedBody = this.withIssueClosure(body, issueNumber);
    const result = await this.executor.run("gh", [
      "pr",
      "edit",
      String(prNumber),
      "--body",
      mergedBody,
    ]);
    this.ensureSuccess(result, `Failed to update PR #${prNumber}`);
  }

  async requestReview(prNumber: number, reviewers: string[]): Promise<void> {
    if (reviewers.length === 0) {
      return;
    }

    const result = await this.executor.run("gh", [
      "pr",
      "edit",
      String(prNumber),
      "--add-reviewer",
      reviewers.join(","),
    ]);
    this.ensureSuccess(
      result,
      `Failed to request reviewers for PR #${prNumber}`,
    );
  }

  async mergePullRequest(
    prNumber: number,
    mergeMethod: "--squash" | "--merge" = "--squash",
  ): Promise<void> {
    const result = await this.executor.run("gh", [
      "pr",
      "merge",
      String(prNumber),
      mergeMethod,
      "--delete-branch",
    ]);
    this.ensureSuccess(result, `Failed to merge PR #${prNumber}`);
  }

  async listTaskCommits(
    issueNumber: number,
  ): Promise<Array<{ hash: string; message: string }>> {
    const result = await this.executor.run("git", [
      "log",
      "--pretty=format:%h|%s",
      "--max-count",
      "100",
    ]);
    this.ensureSuccess(result, "Failed to list commits");

    const commits = result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(
        (line) =>
          line.includes(`(#${issueNumber})`) ||
          line.includes(` #${issueNumber}`),
      )
      .map((line) => {
        const [hash, ...messageParts] = line.split("|");
        return { hash: hash || "", message: messageParts.join("|") };
      })
      .filter((commit) => commit.hash !== ""); // Remove commits with empty hash

    return commits;
  }

  async buildTaskSummary(
    taskId: string,
    issueNumber?: number,
    pullRequest?: PullRequestRef,
  ): Promise<WorkflowTaskSummary> {
    const commits = issueNumber ? await this.listTaskCommits(issueNumber) : [];
    const branchName = await this.currentBranch();

    return {
      taskId,
      issueNumber,
      issueUrl: issueNumber
        ? `https://github.com/Coding-Krakken/.subzero/issues/${issueNumber}`
        : undefined,
      branchName,
      pullRequestNumber: pullRequest?.id,
      pullRequestUrl: pullRequest?.url,
      commits,
      metrics: {
        reviewIterations: 0,
        commitsPerTask: commits.length,
      },
    };
  }

  private async ensureMainCheckedOut(): Promise<void> {
    await this.executor.run("git", ["checkout", "main"]);
    await this.executor.run("git", ["pull", "origin", "main"]);
  }

  private async ensureBranchCreated(branchName: string): Promise<void> {
    const exists = await this.executor.run("git", [
      "rev-parse",
      "--verify",
      branchName,
    ]);

    if (exists.code === 0) {
      const checkoutExisting = await this.executor.run("git", [
        "checkout",
        branchName,
      ]);
      this.ensureSuccess(
        checkoutExisting,
        `Failed to checkout existing branch ${branchName}`,
      );
      return;
    }

    const create = await this.executor.run("git", [
      "checkout",
      "-b",
      branchName,
    ]);
    this.ensureSuccess(create, `Failed to create branch ${branchName}`);

    const push = await this.executor.run("git", [
      "push",
      "-u",
      "origin",
      branchName,
    ]);
    this.ensureSuccess(push, `Failed to push branch ${branchName}`);
  }

  private withIssueClosure(body: string, issueNumber: number): string {
    if (/Closes\s+#\d+/i.test(body) || /Fixes\s+#\d+/i.test(body)) {
      return body;
    }
    return `${body.trim()}\n\nCloses #${issueNumber}`;
  }

  private parseJson<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new Error("Failed to parse command JSON output");
    }
  }

  private ensureSuccess(result: CommandExecutionResult, message: string): void {
    if (result.code !== 0) {
      throw new Error(
        `${message}: ${result.stderr || result.stdout || "unknown error"}`,
      );
    }
  }
}
