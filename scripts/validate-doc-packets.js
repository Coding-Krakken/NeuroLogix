const fs = require('node:fs');
const path = require('node:path');

const requiredEntries = [
  { path: '.customer/README.md', type: 'file' },
  { path: '.customer/SETUP.md', type: 'file' },
  { path: '.customer/ACCOUNTS.md', type: 'file' },
  { path: '.customer/BILLING.md', type: 'file' },
  { path: '.customer/OPERATIONS.md', type: 'file' },
  { path: '.customer/FAQ.md', type: 'file' },
  { path: '.customer/TODO.md', type: 'file' },
  { path: '.customer/CHANGELOG.md', type: 'file' },
  { path: '.customer/SECURITY.md', type: 'file' },
  { path: '.developer/README.md', type: 'file' },
  { path: '.developer/TODO.md', type: 'file' },
  { path: '.developer/ARCHITECTURE.md', type: 'file' },
  { path: '.developer/DECISIONS', type: 'directory' },
  { path: '.developer/RUNBOOKS', type: 'directory' },
  { path: '.developer/RELEASE.md', type: 'file' },
  { path: '.developer/INCIDENTS.md', type: 'file' },
  { path: '.developer/SECURITY_INTERNAL.md', type: 'file' }
];

const missing = [];
const wrongType = [];

for (const entry of requiredEntries) {
  const absolutePath = path.resolve(process.cwd(), entry.path);

  if (!fs.existsSync(absolutePath)) {
    missing.push(entry.path);
    continue;
  }

  const stats = fs.statSync(absolutePath);
  const isExpectedType =
    (entry.type === 'file' && stats.isFile()) ||
    (entry.type === 'directory' && stats.isDirectory());

  if (!isExpectedType) {
    wrongType.push(`${entry.path} (expected ${entry.type})`);
  }
}

if (missing.length > 0 || wrongType.length > 0) {
  console.error('Documentation packet validation failed.');

  if (missing.length > 0) {
    console.error('Missing required paths:');
    for (const filePath of missing) {
      console.error(`- ${filePath}`);
    }
  }

  if (wrongType.length > 0) {
    console.error('Paths with incorrect type:');
    for (const filePath of wrongType) {
      console.error(`- ${filePath}`);
    }
  }

  process.exit(1);
}

console.log('Documentation packet validation passed.');