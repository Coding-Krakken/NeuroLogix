---
name: fix-pr
description: Fix all PR issues.
agent: agent
---

**Objective:**
Perform a complete remediation, completion, and quality hardening pass on this Pull Request.

**Instructions:**

1. **Resolve ALL Issues**
   - Fix **every error, warning, failing check, lint violation, build issue, runtime issue, test failure, and security concern**, regardless of severity level.
   - No exceptions or deferrals unless technically impossible — document any exception explicitly.

2. **Apply Optimal Engineering Solutions**
   - Implement the **most robust, maintainable, scalable, and production-grade solution** for each issue.
   - Avoid temporary fixes, suppressions, or workarounds unless explicitly justified.
   - Follow industry best practices aligned with Microsoft, Google, and enterprise engineering standards.

3. **Implement Copilot Suggestions**
   - Review **all Copilot suggestions, code review comments, automated recommendations, and inline hints** associated with this PR.
   - Implement them completely where appropriate.
   - If a suggestion is rejected, provide a documented technical justification.

4. **Complete Full PR Implementation**
   - Fully implement **all remaining unfinished work within the PR scope**.
   - Ensure all acceptance criteria, referenced issues, and intended functionality are completely delivered.

5. **Verification Requirements**
   - Ensure:
     - All tests pass.
     - Add or update tests as required to achieve near-complete coverage.
     - Builds succeed locally and in CI.
     - Static analysis and security scans pass.
     - Backend endpoints validated via automated requests (curl/API tests).
     - Frontend workflows verified via browser automation (desktop + mobile).

6. **Quality Hardening**
   - Improve:
     - readability
     - maintainability
     - performance
     - accessibility
     - error handling
     - logging and observability
     - security posture.

7. **Documentation + Git Discipline**
   - Update documentation impacted by changes.
   - Ensure commit history remains structured and meaningful.
   - Update PR description to reflect all implemented work.
   - Close or link all related issues appropriately.

8. **Final State Requirement**
   - The codebase must compile cleanly.
   - Zero warnings.
   - Zero failing checks.
   - Zero unfinished TODOs within PR scope.
   - Production-ready quality.

================================================================================
MANDATORY EXECUTION REPORTING — NTFY PHONE NOTIFICATION (URGENT + VIBRATE)
================================================================================

At the end of this task ALWAYS send exactly ONE ntfy notification to my phone.

Goals:

- Lock screen: ultra-short gist (1–3 lines).
- Expanded: full structured executive report.
- Include repo + git context and quick change stats when available.

Rules:

1. Always send ONE notification (even if nothing changed).
2. Keep the lock-screen section short and scannable.
3. Always include NEXT ACTIONS.
4. If you’re blocked, say why + what escalation/dispatch was executed + what fallback was attempted.

Topic:
https://ntfy.sh/copilot-notifications

EXECUTE (copy/paste runnable):

REPO="$(git rev-parse --show-toplevel 2>/dev/null | xargs basename || echo N/A)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo N/A)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo N/A)"

# Prefer staged/working-tree stats; fall back to last commit if clean

CHANGE_SUMMARY="$(git diff --shortstat 2>/dev/null)"
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="$(git show --stat --oneline --format= 2>/dev/null | head -n 1 | sed 's/^ //')"
fi
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="No changes detected"
fi

curl -fsS -X POST "https://ntfy.sh/copilot-notifications" \
 -H "Title: 🚨 Copilot Update — ${REPO}" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light,robot,rocket" \
  -H "Click: https://github.com" \
  -H "Markdown: yes" \
  -H "Sound: default" \
  -d "$(cat <<EOF

## ✅ Task Completed

**Repo:** \`${REPO}\`
**Scope:** <PR / Issue / Feature / Refactor / Fix>
**Outcome:** <ONE sentence: biggest achievement>
**Changes:** \`${CHANGE_SUMMARY}\`
**Next:** <ONE immediate next step>

---

## 📌 Executive Summary

### What was done

- <bullet>
- <bullet>
- <bullet>

### Files touched

- <path>
- <path>

### Quality checks

- Tests: <command> → <PASS/FAIL/SKIPPED>
- Lint: <command> → <PASS/FAIL/SKIPPED>
- Build: <command> → <PASS/FAIL/SKIPPED>

### Git context

- Branch: \`${BRANCH}\`
- Commit: \`${COMMIT}\`

### Risks / Notes

- <risk or note, or "None">

### Next actions (required)

1. <next step>
2. <next step>
3. <next step>

### High-value followups

- <optimization>
- <hardening>
  EOF
  )"
