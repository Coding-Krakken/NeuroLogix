const fs = require('fs');
const path = require('path');

const inputPath = process.env.PLAYWRIGHT_RESULTS_FILE || 'test-results/e2e-results.json';
const outputJsonPath =
  process.env.PLAYWRIGHT_TRIAGE_JSON || 'test-results/e2e-triage-summary.json';
const outputMarkdownPath =
  process.env.PLAYWRIGHT_TRIAGE_MD || 'test-results/e2e-triage-summary.md';

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function flattenSpecs(suites, parentTitles = []) {
  if (!Array.isArray(suites)) {
    return [];
  }

  const specs = [];

  for (const suite of suites) {
    const suiteTitle = suite?.title ? [...parentTitles, suite.title] : parentTitles;

    if (Array.isArray(suite?.specs)) {
      for (const spec of suite.specs) {
        specs.push({
          file: spec?.file || suite?.file || null,
          titlePath: [...suiteTitle, spec?.title || 'Unnamed spec'].filter(Boolean),
          tests: Array.isArray(spec?.tests) ? spec.tests : [],
        });
      }
    }

    if (Array.isArray(suite?.suites) && suite.suites.length > 0) {
      specs.push(...flattenSpecs(suite.suites, suiteTitle));
    }
  }

  return specs;
}

function getFinalTestStatus(test) {
  if (!Array.isArray(test?.results) || test.results.length === 0) {
    return 'unknown';
  }

  const lastResult = test.results[test.results.length - 1];
  return lastResult?.status || 'unknown';
}

function buildSummary(report) {
  const now = new Date().toISOString();
  const specs = flattenSpecs(report?.suites || []);

  const counters = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0,
    flaky: 0,
    unknown: 0,
  };

  const failures = [];

  for (const spec of specs) {
    for (const test of spec.tests) {
      counters.total += 1;
      const status = getFinalTestStatus(test);

      if (status === 'passed') counters.passed += 1;
      else if (status === 'failed') counters.failed += 1;
      else if (status === 'skipped') counters.skipped += 1;
      else if (status === 'timedOut') counters.timedOut += 1;
      else if (status === 'interrupted') counters.interrupted += 1;
      else counters.unknown += 1;

      if (test?.outcome === 'flaky') {
        counters.flaky += 1;
      }

      if (status === 'failed' || status === 'timedOut' || status === 'interrupted') {
        const lastResult =
          Array.isArray(test?.results) && test.results.length > 0
            ? test.results[test.results.length - 1]
            : null;
        failures.push({
          title: spec.titlePath.join(' › '),
          file: spec.file,
          project: test?.projectName || 'unknown',
          status,
          error:
            lastResult?.error?.message ||
            lastResult?.error?.value ||
            'No failure message captured in Playwright JSON report.',
        });
      }
    }
  }

  return {
    generatedAt: now,
    sourceFile: inputPath,
    ci: {
      githubRunId: process.env.GITHUB_RUN_ID || null,
      githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      githubSha: process.env.GITHUB_SHA || null,
      githubRef: process.env.GITHUB_REF || null,
      githubWorkflow: process.env.GITHUB_WORKFLOW || null,
    },
    stats: counters,
    failedTests: failures,
    hasFailures: failures.length > 0,
  };
}

function toMarkdown(summary) {
  const lines = [];

  lines.push('# Playwright E2E Triage Summary');
  lines.push('');
  lines.push(`- Generated at: ${summary.generatedAt}`);
  lines.push(`- Source file: ${summary.sourceFile}`);
  lines.push(`- Workflow: ${summary.ci.githubWorkflow || 'n/a'}`);
  lines.push(`- Run: ${summary.ci.githubRunId || 'n/a'} (attempt ${summary.ci.githubRunAttempt || 'n/a'})`);
  lines.push(`- SHA: ${summary.ci.githubSha || 'n/a'}`);
  lines.push('');
  lines.push('## Stats');
  lines.push('');
  lines.push(`- Total: ${summary.stats.total}`);
  lines.push(`- Passed: ${summary.stats.passed}`);
  lines.push(`- Failed: ${summary.stats.failed}`);
  lines.push(`- Timed out: ${summary.stats.timedOut}`);
  lines.push(`- Interrupted: ${summary.stats.interrupted}`);
  lines.push(`- Skipped: ${summary.stats.skipped}`);
  lines.push(`- Flaky: ${summary.stats.flaky}`);
  lines.push(`- Unknown: ${summary.stats.unknown}`);
  lines.push('');

  if (summary.failedTests.length === 0) {
    lines.push('## Result');
    lines.push('');
    lines.push('No failed/timedOut/interrupted tests detected.');
    return lines.join('\n');
  }

  lines.push('## Failed Tests');
  lines.push('');
  for (const failure of summary.failedTests.slice(0, 25)) {
    lines.push(`- [${failure.status}] ${failure.title}`);
    lines.push(`  - File: ${failure.file || 'unknown'}`);
    lines.push(`  - Project: ${failure.project}`);
    lines.push(`  - Error: ${String(failure.error).replace(/\s+/g, ' ').trim()}`);
  }

  if (summary.failedTests.length > 25) {
    lines.push('');
    lines.push(`... and ${summary.failedTests.length - 25} additional failure(s).`);
  }

  return lines.join('\n');
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const report = readJsonSafe(inputPath);
const summary = report
  ? buildSummary(report)
  : {
      generatedAt: new Date().toISOString(),
      sourceFile: inputPath,
      ci: {
        githubRunId: process.env.GITHUB_RUN_ID || null,
        githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
        githubSha: process.env.GITHUB_SHA || null,
        githubRef: process.env.GITHUB_REF || null,
        githubWorkflow: process.env.GITHUB_WORKFLOW || null,
      },
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        timedOut: 0,
        interrupted: 0,
        flaky: 0,
        unknown: 0,
      },
      failedTests: [],
      hasFailures: false,
      note: 'Playwright JSON report file missing or unreadable. Ensure playwright JSON reporter output exists at sourceFile.',
    };

ensureParentDir(outputJsonPath);
ensureParentDir(outputMarkdownPath);

fs.writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
fs.writeFileSync(outputMarkdownPath, `${toMarkdown(summary)}\n`, 'utf8');

console.log(`Wrote Playwright triage JSON: ${outputJsonPath}`);
console.log(`Wrote Playwright triage Markdown: ${outputMarkdownPath}`);
