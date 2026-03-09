/**
 * Comment Template Service
 *
 * Loads and renders standardized comment templates for GitHub-native handoffs
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface TemplateValidationResult {
  valid: boolean;
  missingRequired: string[];
  errors: string[];
}

export class CommentTemplateService {
  private readonly templatesDir: string;
  private templateCache: Map<string, string> = new Map();

  constructor(templatesDir: string = ".github/comment_templates") {
    this.templatesDir = templatesDir;
  }

  /**
   * Render a template with provided variables
   */
  async render(
    templateName: string,
    variables: TemplateVariables,
  ): Promise<string> {
    const template = await this.loadTemplate(templateName);
    return this.applyVariables(template, variables);
  }

  /**
   * Validate that all required variables are provided
   */
  validate(
    templateName: string,
    variables: TemplateVariables,
  ): TemplateValidationResult {
    const requiredFields = this.getRequiredFields(templateName);
    const missingRequired: string[] = [];

    for (const field of requiredFields) {
      if (
        variables[field] === undefined ||
        variables[field] === null ||
        variables[field] === ""
      ) {
        missingRequired.push(field);
      }
    }

    const errors: string[] = [];
    if (missingRequired.length > 0) {
      errors.push(`Missing required fields: ${missingRequired.join(", ")}`);
    }

    return {
      valid: missingRequired.length === 0 && errors.length === 0,
      missingRequired,
      errors,
    };
  }

  /**
   * Load template from disk (with caching)
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const cacheKey = templateName;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const templatePath = join(this.templatesDir, `${templateName}.md`);
    try {
      const content = await readFile(templatePath, "utf-8");
      this.templateCache.set(cacheKey, content);
      return content;
    } catch (error) {
      throw new Error(
        `Failed to load template "${templateName}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Apply variables to template using simple Mustache-like syntax
   */
  private applyVariables(
    template: string,
    variables: TemplateVariables,
  ): string {
    let result = template;

    // Replace simple variables: {{VAR}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value ?? ""));
    }

    // Handle conditionals: {{#if VAR}}...{{/if}}
    result = this.processConditionals(result, variables);

    return result;
  }

  /**
   * Process conditional blocks: {{#if VAR}}...{{/if}}
   */
  private processConditionals(
    template: string,
    variables: TemplateVariables,
  ): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(
      conditionalRegex,
      (_match: string, varName: string, content: string) => {
        const value = variables[varName];
        const isTruthy =
          value !== undefined &&
          value !== null &&
          value !== false &&
          value !== "" &&
          value !== 0;
        return isTruthy ? content : "";
      },
    );
  }

  /**
   * Get required fields for a specific template
   */
  private getRequiredFields(templateName: string): string[] {
    const requiredFieldsMap: Record<string, string[]> = {
      handoff: [
        "AGENT_NAME",
        "ISSUE_NUMBER",
        "STATUS",
        "TIMESTAMP",
        "NEXT_AGENT_ID",
      ],
      pr_review: [
        "REVIEWER_AGENT",
        "PR_NUMBER",
        "REVIEW_TYPE",
        "TIMESTAMP",
        "DECISION",
        "FINAL_STATUS",
      ],
      issue_triage: [
        "TRIAGER_AGENT",
        "ISSUE_NUMBER",
        "TIMESTAMP",
        "DECISION",
        "ISSUE_TITLE",
        "ISSUE_TYPE",
      ],
    };

    return requiredFieldsMap[templateName] || [];
  }

  /**
   * Clear template cache (useful for testing)
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}

/**
 * Default singleton instance
 */
export const defaultCommentTemplateService = new CommentTemplateService();
