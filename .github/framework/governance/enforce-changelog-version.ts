import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Args {
  baseRef: string;
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) {
      continue;
    }
    const next = argv[i + 1];
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
  const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const repoRoot = resolve(scriptDir, '..', '..', '..');

  execSync(`git fetch origin ${args.baseRef} --depth=1`, { stdio: 'ignore' });
  const changed = execSync(`git diff --name-only origin/${args.baseRef}...HEAD`, {
    encoding: 'utf-8',
  })
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const codeChange = changed.some(path => {
    if (path.startsWith('docs/')) {
      return false;
    }
    if (path.startsWith('.github/framework-config/deterministic/docs/')) {
      return false;
    }
    if (path.startsWith('.github/ISSUE_TEMPLATE/')) {
      return false;
    }
    if (path.startsWith('.github/workflows/')) {
      return true;
    }
    return (
      path.endsWith('.ts') ||
      path.endsWith('.js') ||
      path.endsWith('.json') ||
      path.endsWith('.yml') ||
      path.endsWith('.yaml')
    );
  });

  if (!codeChange) {
    process.stdout.write('Changelog/version check skipped: docs-only change.\n');
    return;
  }

  const changelogTouched = changed.includes('CHANGELOG.md');
  if (!changelogTouched) {
    throw new Error(
      'Changelog/version enforcement failed: CHANGELOG.md must be updated for non-doc changes.'
    );
  }

  const pkgPath = resolve(repoRoot, '.github', 'framework', 'package.json');
  if (existsSync(pkgPath)) {
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    if (!pkg.version) {
      throw new Error(
        'Version enforcement failed: .github/framework/package.json has no version field.'
      );
    }
  }

  process.stdout.write('Changelog/version enforcement passed.\n');
}

main();
