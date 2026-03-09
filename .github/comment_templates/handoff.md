# Agent Handoff Template

<!-- 
This template MUST be used for all agent-to-agent handoffs.
All sections are REQUIRED, even if marked "N/A".
-->

## Handoff

**Agent:** {{AGENT_NAME}}  
**Work Item:** Issue #{{ISSUE_NUMBER}} {{#if PR_NUMBER}}| PR #{{PR_NUMBER}}{{/if}}  
**Status:** {{STATUS}} <!-- Done | Partial | Blocked -->  
**Timestamp:** {{TIMESTAMP}}

---

### Scope Completed

<!-- List all work completed in this handoff -->

- [ ] {{SCOPE_ITEM_1}}
- [ ] {{SCOPE_ITEM_2}}
- [ ] {{SCOPE_ITEM_3}}

---

### Key Decisions

<!-- Document any significant decisions made during this work -->

1. **{{DECISION_1_TITLE}}**
   - Rationale: {{DECISION_1_RATIONALE}}
   - Alternatives considered: {{DECISION_1_ALTERNATIVES}}

2. **{{DECISION_2_TITLE}}**
   - Rationale: {{DECISION_2_RATIONALE}}
   - Alternatives considered: {{DECISION_2_ALTERNATIVES}}

---

### Changes Summary

**Files Changed:** {{FILES_CHANGED_COUNT}} files (+{{LINES_ADDED}} -{{LINES_REMOVED}})

**Notable Files:**

- `{{FILE_1}}` — {{FILE_1_DESCRIPTION}}
- `{{FILE_2}}` — {{FILE_2_DESCRIPTION}}
- `{{FILE_3}}` — {{FILE_3_DESCRIPTION}}

**Commits:**

- {{COMMIT_1_HASH}} — {{COMMIT_1_MESSAGE}}
- {{COMMIT_2_HASH}} — {{COMMIT_2_MESSAGE}}

---

### Verification

**Commands Run:**

```bash
{{VERIFICATION_COMMAND_1}}
{{VERIFICATION_COMMAND_2}}
{{VERIFICATION_COMMAND_3}}
```

**Expected Outcome:**

- {{EXPECTED_OUTCOME_1}}
- {{EXPECTED_OUTCOME_2}}
- {{EXPECTED_OUTCOME_3}}

**Actual Outcome:**

- {{ACTUAL_OUTCOME_1}}
- {{ACTUAL_OUTCOME_2}}
- {{ACTUAL_OUTCOME_3}}

**Verification Status:** ✅ Passed | ❌ Failed | ⚠️ Partial

---

### Risks / Follow-ups

<!-- Document any risks, concerns, or follow-up work needed -->

**Risks:**

- {{RISK_1}}
- {{RISK_2}}

**Technical Debt Incurred:**

- {{TECH_DEBT_1}}
- {{TECH_DEBT_2}}

**Follow-up Issues:**

- Issue #{{FOLLOWUP_ISSUE_1}} — {{FOLLOWUP_ISSUE_1_DESCRIPTION}}
- Issue #{{FOLLOWUP_ISSUE_2}} — {{FOLLOWUP_ISSUE_2_DESCRIPTION}}

---

### Next Agent

**Handoff To:** `{{NEXT_AGENT_ID}}`

---

### Next Actions (Explicit Checklist)

<!-- The next agent MUST complete these actions -->

- [ ] {{NEXT_ACTION_1}}
- [ ] {{NEXT_ACTION_2}}
- [ ] {{NEXT_ACTION_3}}
- [ ] {{NEXT_ACTION_4}}
- [ ] Post handoff comment before dispatching to next agent
- [ ] Dispatch to: `{{NEXT_NEXT_AGENT_ID}}`

---

### Links

- **Handoff Comment (self):** {{COMMENT_URL}} <!-- Filled after posting -->
- **CI Run:** {{CI_RUN_URL}} <!-- N/A if no CI run -->
- **Relevant Docs:** {{DOCS_URL}} <!-- N/A if none -->
- **Test Evidence:** {{TEST_EVIDENCE_URL}} <!-- N/A if none -->

---

### Quality Gates

<!-- If applicable, document quality gates that passed -->

- [x] G1: Lint passed
- [x] G2: Typecheck passed
- [x] G3: Tests passed
- [x] G4: Test coverage ≥80%
- [ ] G5: Security scan passed (N/A for this agent)
- [ ] G6: Performance budget met (N/A for this agent)

---

**End of Handoff**
