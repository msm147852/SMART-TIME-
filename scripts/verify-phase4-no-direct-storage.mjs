import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/**/*.{ts,tsx}');
let violations = [];

for (const file of files) {
  if (file.endsWith('storageAdapter.ts')) continue;
  if (file.endsWith('storageKeys.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (/localStorage\.setItem\s*\(/.test(content)) {
    violations.push(file);
  }
}

if (violations.length > 0) {
  console.error('Phase 4 FAILED - Direct localStorage.setItem found in:');
  violations.forEach((file) => console.error(' -', file));
  process.exit(1);
}

console.log(`Phase 4 PASS - Zero direct localStorage.setItem in src/ (${files.length} files scanned)`);
