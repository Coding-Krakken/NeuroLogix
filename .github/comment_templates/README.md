# Comment Templates README

This directory contains standardized comment templates used by the SubZero agentic framework for GitHub-native handoffs and reviews.

## Purpose

These templates ensure:

- **Consistency:** All agent communications follow the same structure
- **Completeness:** Required information is never omitted
- **Traceability:** Full context and decisions are preserved
- **Auditability:** Clear paper trail for all work items

## Templates

### 1. Handoff Template (`handoff.md`)

**Usage:** Agent-to-agent work handoffs

**When to use:**
- After completing a unit of work
- Before dispatching to the next agent in the workflow
- When blocked and escalating

**Required fields:**
- Agent name
- Work item (Issue/PR)
- Status (Done/Partial/Blocked)
- Scope completed
- Key decisions
- Changes summary
- Verification results
- Risks/follow-ups
- Next agent
- Next actions checklist
- Links (comment URL, CI, docs)

**Template variables:** `{{AGENT_NAME}}`, `{{ISSUE_NUMBER}}`, `{{PR_NUMBER}}`, `{{STATUS}}`, etc.

### 2. PR Review Template (`pr_review.md`)

**Usage:** Agent-generated pull request reviews

**When to use:**
- Quality Director final review
- Security Engineer review
- Any agent performing PR review

**Sections:**
- Executive summary
- Scope review
- Code quality assessment
- Architecture & design review
- Testing evaluation
- Security analysis
- Performance impact
- Documentation check
- Risk assessment
- Required actions
- Approval checklist
- Final decision

**Template variables:** `{{REVIEWER_AGENT}}`, `{{PR_NUMBER}}`, `{{DECISION}}`, etc.

### 3. Issue Triage Template (`issue_triage.md`)

**Usage:** Initial issue classification and routing

**When to use:**
- New issue created
- Issue needs re-triage
- Chief of Staff initial assessment

**Sections:**
- Initial assessment (validity, clarity, completeness)
- Classification (priority, severity, scope, component)
- Impact analysis (user and business impact)
- Technical assessment (complexity, dependencies, effort)
- Acceptance criteria review
- Routing decision
- Questions for reporter
- Duplicate check
- Related issues
- Triage decision

**Template variables:** `{{TRIAGER_AGENT}}`, `{{ISSUE_NUMBER}}`, `{{DECISION}}`, etc.

## Template Format

All templates use a hybrid Markdown + Mustache variable syntax:

- **Markdown:** For structure and formatting
- **Mustache variables:** `{{VARIABLE_NAME}}` for dynamic content
- **Conditional sections:** `{{#if CONDITION}}...{{/if}}`

## Usage in Code

```typescript
import { CommentTemplateService } from '../framework/comment-template-service'

const templateService = new CommentTemplateService()

// Load and render handoff template
const handoffComment = await templateService.render('handoff', {
  AGENT_NAME: 'frontend-engineer',
  ISSUE_NUMBER: 42,
  PR_NUMBER: 123,
  STATUS: 'Done',
  // ... other variables
})

// Post to GitHub
await githubClient.postComment(42, handoffComment)
```

## Validation

The `CommentTemplateService` validates that:

1. All required template variables are provided
2. All required sections are present in the rendered output
3. Template syntax is valid

Missing required fields will cause the render to fail with a clear error message.

## Adding New Templates

To add a new template:

1. Create `new-template.md` in this directory
2. Follow the structure of existing templates
3. Document required variables and sections
4. Add to this README
5. Update `CommentTemplateService` if validation rules differ

## Template Versioning

Templates are versioned alongside the framework. Breaking changes to template structure:

- Require a major version bump
- Must include migration guide
- Should maintain backward compatibility when possible

## Best Practices

1. **Always use templates:** Never post freeform comments for handoffs/reviews
2. **Fill all sections:** Use "N/A" if a section doesn't apply
3. **Validate before posting:** Use `CommentTemplateService.validate()` 
4. **Keep templates DRY:** Extract common sections if duplication occurs
5. **Version control:** All template changes go through PR review

## Related Documentation

- [GitHub Handoffs Architecture](../framework/README.md#github-handoffs)
- [Agent Workflow Guide](../WORKFLOW_INTEGRATION_SUMMARY.md)
- [Git Workflow](../GIT_WORKFLOW.md)

---

**Last Updated:** 2026-02-26  
**Owner:** Chief of Staff (`00-chief-of-staff`)
