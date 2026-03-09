# Issue Triage Template

<!-- 
Template for triaging new issues
-->

## Issue Triage — {{TRIAGER_AGENT}}

**Issue:** #{{ISSUE_NUMBER}}  
**Timestamp:** {{TIMESTAMP}}  
**Triage Decision:** {{DECISION}} <!-- ✅ Accepted | ⚠️ Needs Info | ❌ Rejected | 🔄 Duplicate -->

---

### Summary

**Title:** {{ISSUE_TITLE}}

**Type:** {{ISSUE_TYPE}} <!-- bug | feature | tech-debt | security -->

**Reporter:** @{{REPORTER}}

---

### Initial Assessment

**Validity:** ✅ Valid | ⚠️ Needs Clarification | ❌ Invalid

**Clarity:** ✅ Clear | ⚠️ Unclear | ❌ Insufficient Info

**Completeness:** ✅ Complete | ⚠️ Missing Info | ❌ Incomplete

---

### Classification

**Priority:** {{PRIORITY}} <!-- P0 | P1 | P2 | P3 -->

**Severity:** {{SEVERITY}} <!-- Critical | High | Medium | Low -->

**Scope:** {{SCOPE}} <!-- Small | Medium | Large | XL -->

**Component:** {{COMPONENT}} <!-- component:xyz -->

**Labels Applied:**

- `{{LABEL_1}}`
- `{{LABEL_2}}`
- `{{LABEL_3}}`

---

### Impact Analysis

**User Impact:**

- **Affected Users:** {{AFFECTED_USERS}}
- **Frequency:** {{FREQUENCY}} <!-- Always | Often | Sometimes | Rare -->
- **Workaround Available:** {{WORKAROUND_EXISTS}} <!-- Yes | No | Partial -->

**Business Impact:**

- **Revenue Impact:** {{REVENUE_IMPACT}} <!-- High | Medium | Low | None -->
- **Reputation Impact:** {{REPUTATION_IMPACT}} <!-- High | Medium | Low | None -->
- **Compliance Impact:** {{COMPLIANCE_IMPACT}} <!-- Yes | No -->

---

### Technical Assessment

**Complexity:** {{COMPLEXITY}} <!-- Low | Medium | High | Unknown -->

**Dependencies:**

- {{DEPENDENCY_1}}
- {{DEPENDENCY_2}}

**Estimated Effort:** {{ESTIMATED_EFFORT}} <!-- 1-2 days | 3-5 days | 1-2 weeks | >2 weeks -->

**Risks:**

- {{RISK_1}}
- {{RISK_2}}

---

### Acceptance Criteria Review

<!-- Evaluate provided acceptance criteria -->

**Criteria Provided:** ✅ Yes | ❌ No

**Criteria Quality:** ✅ Clear & Testable | ⚠️ Needs Refinement | ❌ Insufficient

**Missing Criteria:**

- {{MISSING_CRITERIA_1}}
- {{MISSING_CRITERIA_2}}

---

### Routing Decision

**Assigned To:** `{{ASSIGNED_AGENT}}` <!-- e.g., tech-lead, solution-architect -->

**Reasoning:** {{ROUTING_REASONING}}

**Sprint Assignment:** {{SPRINT}} <!-- Current | Next | Backlog -->

---

### Questions for Reporter

<!-- If information is missing -->

{{#if NEEDS_INFO}}
@{{REPORTER}}, please provide the following information:

1. {{QUESTION_1}}
2. {{QUESTION_2}}
3. {{QUESTION_3}}

**Status:** Waiting for reporter response
{{/if}}

---

### Duplicate Check

**Is Duplicate:** ✅ Yes | ❌ No

{{#if IS_DUPLICATE}}
**Duplicate Of:** Issue #{{DUPLICATE_OF}}

**Action:** Closing as duplicate. Please see #{{DUPLICATE_OF}} for updates.
{{/if}}

---

### Related Issues

**Related To:**

- Issue #{{RELATED_1}} — {{RELATED_1_DESCRIPTION}}
- Issue #{{RELATED_2}} — {{RELATED_2_DESCRIPTION}}

**Blocks:**

- Issue #{{BLOCKS_1}}

**Blocked By:**

- Issue #{{BLOCKED_BY_1}}

---

### Triage Decision

**Final Status:** {{FINAL_STATUS}}

**Next Steps:**

1. {{NEXT_STEP_1}}
2. {{NEXT_STEP_2}}
3. {{NEXT_STEP_3}}

**Milestone:** {{MILESTONE}}

---

### Notes

{{ADDITIONAL_NOTES}}

---

**Triaged by:** `{{TRIAGER_AGENT}}`  
**Triage Date:** {{TIMESTAMP}}
