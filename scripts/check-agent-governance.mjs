#!/usr/bin/env node

import fs from 'node:fs';

const requiredFiles = [
  '.github/agents/auto-agent.agent.md',
  '.github/copilot-instructions.md',
  'planning/recurring-failures.md',
  'planning/agent-kpi-weekly.md'
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`Missing required governance file: ${file}`);
  }
}

if (fs.existsSync('.github/agents/auto-agent.agent.md')) {
  const agent = fs.readFileSync('.github/agents/auto-agent.agent.md', 'utf8');

  const requiredAgentPhrases = [
    'Scope Budget Rule',
    'target <= 12 files changed',
    'target <= 500 net LOC changed',
    'target <= 1 issue fully advanced to merge-ready state per run',
    'target <= 1 PR opened/updated toward merge per run',
    'planning/recurring-failures.md',
    'planning/agent-kpi-weekly.md',
    'self-reinitiation safety guard'
  ];

  for (const phrase of requiredAgentPhrases) {
    if (!agent.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`auto-agent policy drift: missing phrase \"${phrase}\"`);
    }
  }
}

if (fs.existsSync('.github/copilot-instructions.md')) {
  const copilot = fs.readFileSync('.github/copilot-instructions.md', 'utf8');
  const statusLine = /\*\*Status:\*\*\s*(.+)/.exec(copilot)?.[1] ?? '';

  if (!statusLine.toLowerCase().includes('phase 7')) {
    failures.push('copilot-instructions drift: status line must indicate active Phase 7 context');
  }

  const requiredCopilotPhrases = [
    'Phase 1 Contracts',
    'OPA runtime wiring',
    'governance drift checks in CI'
  ];

  for (const phrase of requiredCopilotPhrases) {
    if (!copilot.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`copilot-instructions drift: missing phrase \"${phrase}\"`);
    }
  }
}

if (failures.length > 0) {
  console.error('Agent governance validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Agent governance validation passed.');
