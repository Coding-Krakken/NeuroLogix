const fs = require('node:fs');
const path = require('node:path');

const requiredCustomerFiles = [
  '.customer/README.md',
  '.customer/SETUP.md',
  '.customer/ACCOUNTS.md',
  '.customer/BILLING.md',
  '.customer/OPERATIONS.md',
  '.customer/FAQ.md',
  '.customer/TODO.md',
  '.customer/CHANGELOG.md',
  '.customer/SECURITY.md'
];

const missing = [];
const invalidType = [];
const empty = [];

for (const relativePath of requiredCustomerFiles) {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    missing.push(relativePath);
    continue;
  }

  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    invalidType.push(relativePath);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  if (content.trim().length === 0) {
    empty.push(relativePath);
  }
}

if (missing.length > 0 || invalidType.length > 0 || empty.length > 0) {
  console.error('Customer documentation packet validation failed.');

  if (missing.length > 0) {
    console.error('Missing required customer files:');
    for (const filePath of missing) {
      console.error(`- ${filePath}`);
    }
  }

  if (invalidType.length > 0) {
    console.error('Customer packet paths that are not files:');
    for (const filePath of invalidType) {
      console.error(`- ${filePath}`);
    }
  }

  if (empty.length > 0) {
    console.error('Customer packet files with empty content:');
    for (const filePath of empty) {
      console.error(`- ${filePath}`);
    }
  }

  process.exit(1);
}

console.log('Customer documentation packet validation passed.');
