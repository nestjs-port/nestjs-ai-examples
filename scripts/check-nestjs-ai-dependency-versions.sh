#!/bin/bash

# Check @nestjs-ai and @nestjs-port dependency versions across all package.json files
# Usage: ./scripts/check-nestjs-ai-dependency-versions.sh

set -e

echo "Checking @nestjs-ai and @nestjs-port dependency versions in all package.json files..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const prefixRe = /^@(nestjs-ai|nestjs-port)\//;
const versions = new Map();
let totalFiles = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry.isFile() && entry.name === 'package.json' && !full.includes(`${path.sep}spring-ai-examples${path.sep}`)) {
      totalFiles += 1;
      const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const deps = pkg[section];
        if (!deps) continue;
        for (const [name, version] of Object.entries(deps)) {
          if (!prefixRe.test(name)) continue;
          if (!versions.has(name)) versions.set(name, new Map());
          const byVersion = versions.get(name);
          byVersion.set(version, (byVersion.get(version) ?? 0) + 1);
        }
      }
    }
  }
}

walk(root);

const names = [...versions.keys()].sort();
let inconsistent = false;

if (names.length === 0) {
  console.log("No matching dependencies found.");
  process.exit(0);
}

for (const name of names) {
  const byVersion = versions.get(name);
  const unique = [...byVersion.keys()].sort();
  if (unique.length > 1) inconsistent = true;

  console.log(name);
  for (const version of unique) {
    console.log(`  ${version}  (${byVersion.get(version)} files)`);
  }
}

console.log("");
console.log("Statistics:");
console.log("-----------");
console.log(`  Total package.json files scanned: ${totalFiles}`);
console.log(`  Packages checked: ${names.length}`);

console.log("");
if (inconsistent) {
  console.log("⚠️  WARNING: Multiple versions detected for at least one package");
  process.exit(1);
}

console.log("✅ All checked packages use a single version each");
NODE
