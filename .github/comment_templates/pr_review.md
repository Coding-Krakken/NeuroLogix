# PR Review Template

<!-- 
Template for agent-generated PR reviews
-->

## PR Review — {{REVIEWER_AGENT}}

**PR:** #{{PR_NUMBER}}  
**Review Type:** {{REVIEW_TYPE}} <!-- Initial | Follow-up | Final -->  
**Timestamp:** {{TIMESTAMP}}  
**Decision:** {{DECISION}} <!-- ✅ Approved | ⚠️ Changes Requested | ❌ Rejected | 💬 Comment Only -->

---

### Executive Summary

{{EXECUTIVE_SUMMARY}}

**Recommendation:** {{RECOMMENDATION}}

---

### Scope Review

**What Changed:**

- {{CHANGE_1}}
- {{CHANGE_2}}
- {{CHANGE_3}}

**Alignment with Issue #{{ISSUE_NUMBER}}:**

- [ ] All acceptance criteria addressed
- [ ] No out-of-scope changes
- [ ] Linked issue will be closed on merge

**Assessment:** ✅ In Scope | ⚠️ Scope Creep Detected | ❌ Out of Scope

---

### Code Quality

#### Strengths

- ✅ {{STRENGTH_1}}
- ✅ {{STRENGTH_2}}
- ✅ {{STRENGTH_3}}

#### Concerns

- ⚠️ {{CONCERN_1}}
  - **Location:** `{{FILE_1}}:L{{LINE_1}}`
  - **Suggestion:** {{SUGGESTION_1}}
- ⚠️ {{CONCERN_2}}
  - **Location:** `{{FILE_2}}:L{{LINE_2}}`
  - **Suggestion:** {{SUGGESTION_2}}

#### Critical Issues

- ❌ {{CRITICAL_ISSUE_1}}
  - **Location:** `{{FILE_3}}:L{{LINE_3}}`
  - **Fix Required:** {{FIX_1}}
  - **Impact if Unresolved:** {{IMPACT_1}}

---

### Architecture & Design

**Design Decisions:**

- {{DESIGN_DECISION_1}} — ✅ Approved | ⚠️ Concern | ❌ Rejected
- {{DESIGN_DECISION_2}} — ✅ Approved | ⚠️ Concern | ❌ Rejected

**Architectural Patterns:**

- Follows existing patterns: ✅ Yes | ⚠️ Partial | ❌ No
- New patterns introduced: {{NEW_PATTERN_1}}, {{NEW_PATTERN_2}}
- Pattern justification: {{PATTERN_JUSTIFICATION}}

**Concerns:**

- {{ARCHITECTURE_CONCERN_1}}
- {{ARCHITECTURE_CONCERN_2}}

---

### Testing

**Test Coverage:**

- **Current:** {{CURRENT_COVERAGE}}%
- **Target:** ≥80%
- **Status:** ✅ Met | ⚠️ Below Target | ❌ Significantly Below

**Test Quality:**

- Unit tests: {{UNIT_TEST_STATUS}}
- Integration tests: {{INTEGRATION_TEST_STATUS}}
- E2E tests: {{E2E_TEST_STATUS}}

**Gaps Identified:**

- {{TEST_GAP_1}}
- {{TEST_GAP_2}}

**Test Evidence:**

- CI Run: {{CI_URL}}
- Test Report: {{TEST_REPORT_URL}}

---

### Security

**Security Review Status:** ✅ No Issues | ⚠️ Concerns | ❌ Critical Issues | N/A

**Findings:**

- {{SECURITY_FINDING_1}}
- {{SECURITY_FINDING_2}}

**Secrets Management:**

- [x] No hardcoded secrets
- [x] Secrets scan passed (gitleaks)
- [x] Environment variables properly used

**PII/Sensitive Data:**

- [x] No PII in logs
- [x] Sensitive data properly handled

**OWASP Top 10:**

- {{OWASP_CONSIDERATION_1}}
- {{OWASP_CONSIDERATION_2}}

---

### Performance

**Performance Impact:** ✅ No Impact | ⚠️ Possible Impact | ❌ Degradation Detected

**Findings:**

- {{PERFORMANCE_FINDING_1}}
- {{PERFORMANCE_FINDING_2}}

**Performance Budget:**

| Metric | Before | After | Budget | Status |
|--------|--------|-------|--------|--------|
| {{METRIC_1}} | {{BEFORE_1}} | {{AFTER_1}} | {{BUDGET_1}} | {{STATUS_1}} |
| {{METRIC_2}} | {{BEFORE_2}} | {{AFTER_2}} | {{BUDGET_2}} | {{STATUS_2}} |

---

### Documentation

**Documentation Status:** ✅ Complete | ⚠️ Incomplete | ❌ Missing

**Checklist:**

- [ ] Inline comments for complex logic
- [ ] API documentation updated
- [ ] README updated
- [ ] `.github/.developer/` docs updated
- [ ] `.customer/` docs updated (if customer-facing)

**Gaps:**

- {{DOC_GAP_1}}
- {{DOC_GAP_2}}

---

### Risk Assessment

**Deployment Risk:** 🟢 Low | 🟡 Medium | 🔴 High

**Risks Identified:**

1. **{{RISK_1_TITLE}}** — {{RISK_1_LIKELIHOOD}} Likelihood, {{RISK_1_IMPACT}} Impact
   - **Mitigation:** {{RISK_1_MITIGATION}}

2. **{{RISK_2_TITLE}}** — {{RISK_2_LIKELIHOOD}} Likelihood, {{RISK_2_IMPACT}} Impact
   - **Mitigation:** {{RISK_2_MITIGATION}}

**Rollback Plan:**

- {{ROLLBACK_STEP_1}}
- {{ROLLBACK_STEP_2}}

---

### Required Actions

<!-- Must be completed before merge -->

**Blocking Issues:**

- [ ] {{BLOCKING_ISSUE_1}}
- [ ] {{BLOCKING_ISSUE_2}}

**Non-Blocking Improvements:**

- [ ] {{IMPROVEMENT_1}}
- [ ] {{IMPROVEMENT_2}}

---

### Approval Checklist

- [ ] All quality gates pass (G1-G10)
- [ ] No critical issues
- [ ] Test coverage ≥80%
- [ ] Security review complete
- [ ] Performance budget met
- [ ] Documentation complete
- [ ] Rollback plan documented

---

### Final Decision

**Status:** {{FINAL_STATUS}}

**Rationale:** {{FINAL_RATIONALE}}

**Next Steps:**

1. {{NEXT_STEP_1}}
2. {{NEXT_STEP_2}}
3. {{NEXT_STEP_3}}

---

**Review by:** `{{REVIEWER_AGENT}}`  
**Review Date:** {{TIMESTAMP}}
