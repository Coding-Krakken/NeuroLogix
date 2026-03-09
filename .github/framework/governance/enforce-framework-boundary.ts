import { execSync } from 'node:child_process';

interface Args {
  baseRef: string;
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }
    const next = argv[index + 1];
    if (token.startsWith('--') && next && !next.startsWith('--')) {
      values.set(token, next);
    }
  }

  return {
    baseRef: values.get('--base-ref') ?? process.env['GITHUB_BASE_REF'] ?? 'main',
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  execSync(`git fetch origin ${args.baseRef} --depth=1`, { stdio: 'ignore' });
  const changed = execSync(`git diff --name-only origin/${args.baseRef}...HEAD`, {
    encoding: 'utf-8',
  })
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (changed.length === 0) {
    process.stdout.write('Framework boundary check skipped: no changed files.\n');
    return;
  }

  const frameworkLeakPaths = changed.filter(
    path => /(^|\/)framework([/.-]|$)/i.test(path) && !path.startsWith('.github/')
  );

  const typoNamespacePaths = changed.filter(path => /(^|\/)\.guthub(\/|$)/i.test(path));

  if (frameworkLeakPaths.length > 0 || typoNamespacePaths.length > 0) {
    const issues: string[] = [];

    if (frameworkLeakPaths.length > 0) {
      issues.push(
        [
          'Framework boundary enforcement failed: framework-related files must live under .github/.',
          'Move these paths under .github/ to prevent leakage/isolation faults:',
          ...frameworkLeakPaths.map(path => `- ${path}`),
        ].join('\n')
      );
    }

    if (typoNamespacePaths.length > 0) {
      issues.push(
        [
          'Framework boundary enforcement failed: detected typo namespace .guthub (expected .github).',
          ...typoNamespacePaths.map(path => `- ${path}`),
        ].join('\n')
      );
    }

    throw new Error(issues.join('\n\n'));
  }

  process.stdout.write('Framework boundary enforcement passed.\n');
}

main();
