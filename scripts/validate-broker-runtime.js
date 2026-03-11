const fs = require('node:fs');
const path = require('node:path');

const composePath = 'infrastructure/docker/docker-compose.dev.yml';
const requiredComposeSnippets = [
  'mosquitto:',
  'redpanda:',
  './mosquitto/config:/mosquitto/config:ro',
  './mosquitto/data:/mosquitto/data',
  './mosquitto/log:/mosquitto/log',
  "- '1883:1883'",
  "- '9001:9001'",
  "- '19092:19092'"
];

const requiredEntries = [
  { path: 'infrastructure/docker/mosquitto/config/mosquitto.conf', type: 'file' },
  { path: 'infrastructure/docker/mosquitto/data', type: 'directory' },
  { path: 'infrastructure/docker/mosquitto/log', type: 'directory' }
];

const requiredMosquittoSnippets = [
  'listener 1883',
  'listener 9001',
  'protocol mqtt',
  'protocol websockets',
  'allow_anonymous true',
  'persistence true',
  'persistence_location /mosquitto/data/'
];

const failures = [];

const absoluteComposePath = path.resolve(process.cwd(), composePath);
if (!fs.existsSync(absoluteComposePath)) {
  failures.push(`Missing required compose file: ${composePath}`);
} else {
  const composeContent = fs.readFileSync(absoluteComposePath, 'utf8');
  for (const snippet of requiredComposeSnippets) {
    if (!composeContent.includes(snippet)) {
      failures.push(`Compose file missing expected broker wiring snippet: ${snippet}`);
    }
  }
}

for (const entry of requiredEntries) {
  const absolutePath = path.resolve(process.cwd(), entry.path);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required path: ${entry.path}`);
    continue;
  }

  const stats = fs.statSync(absolutePath);
  const isExpectedType =
    (entry.type === 'file' && stats.isFile()) ||
    (entry.type === 'directory' && stats.isDirectory());

  if (!isExpectedType) {
    failures.push(`Invalid path type for ${entry.path}; expected ${entry.type}`);
  }
}

const mosquittoConfigPath = path.resolve(
  process.cwd(),
  'infrastructure/docker/mosquitto/config/mosquitto.conf'
);

if (fs.existsSync(mosquittoConfigPath)) {
  const mosquittoConfig = fs.readFileSync(mosquittoConfigPath, 'utf8');
  for (const snippet of requiredMosquittoSnippets) {
    if (!mosquittoConfig.includes(snippet)) {
      failures.push(`Mosquitto config missing required entry: ${snippet}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Broker runtime wiring validation failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Broker runtime wiring validation passed.');
