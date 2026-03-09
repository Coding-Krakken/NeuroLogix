import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildHandoffWorkflowReportFromText,
  formatHandoffWorkflowReport,
} from './handoff-workflow-report.js';

interface CliArgs {
  filePath?: string;
  json: boolean;
}

const DEFAULT_SAMPLE_LOG = 'qa-evidence/handoff-workflow-sample.log';

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = {
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--json') {
      args.json = true;
      continue;
    }

    if (value === '--input' || value === '--file') {
      const nextValue = argv[index + 1];
      if (nextValue) {
        args.filePath = nextValue;
        index += 1;
      }
    }
  }

  return args;
};

const usage = (): string =>
  `Usage: npm --prefix .github/framework run handoff:report -- [--input <log-file-path>] [--json]\nDefault input: ${DEFAULT_SAMPLE_LOG}`;

const writeStdout = (text: string): void => {
  process.stdout.write(`${text}\n`);
};

const writeStderr = (text: string): void => {
  process.stderr.write(`${text}\n`);
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));

  const selectedPath = args.filePath ?? DEFAULT_SAMPLE_LOG;
  const absolutePath = resolve(process.cwd(), selectedPath);

  let input = '';
  try {
    input = readFileSync(absolutePath, 'utf8');
  } catch (error) {
    writeStderr(usage());
    writeStderr(`Failed to read input file: ${absolutePath}`);
    if (error instanceof Error) {
      writeStderr(error.message);
    }
    process.exitCode = 1;
    return;
  }

  const report = buildHandoffWorkflowReportFromText(input);

  if (args.json) {
    writeStdout(JSON.stringify(report, null, 2));
    return;
  }

  writeStdout(formatHandoffWorkflowReport(report));
};

main();
