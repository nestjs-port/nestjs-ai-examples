#!/bin/bash

# Update @nestjs-ai and @nestjs-port dependency versions across all package.json files
# Usage: ./scripts/update-nestjs-ai-dependency-versions.sh @nestjs-ai/pkg=1.2.3 @nestjs-port/pkg=0.1.0

set -e

if [ "$#" -eq 0 ]; then
  echo "Usage: ./scripts/update-nestjs-ai-dependency-versions.sh @nestjs-ai/pkg=1.2.3 @nestjs-port/pkg=0.1.0"
  exit 1
fi

for pair in "$@"; do
  if [[ ! "$pair" =~ ^@?(nestjs-ai|nestjs-port)/[^=]+=[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]]; then
    echo "Error: invalid version mapping: $pair"
    echo "Expected format: @nestjs-ai/pkg=1.2.3 or @nestjs-port/pkg=0.1.0"
    exit 1
  fi
done

echo "Updating dependency versions..."
for pair in "$@"; do
  package_name="${pair%%=*}"
  version="${pair#*=}"
  echo "  $package_name -> $version"
done
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

TARGET_JSON="$(mktemp)"
CHANGED_FILES="$(mktemp)"
CHANGED_DIRS="$(mktemp)"
export TARGET_JSON CHANGED_FILES CHANGED_DIRS

node - "$TARGET_JSON" "$@" <<'NODE'
const fs = require('fs');

const targetFile = process.argv[2];
const targets = {};

for (let i = 3; i < process.argv.length; i++) {
  const [name, version] = process.argv[i].split('=');
  targets[name] = version;
}

fs.writeFileSync(targetFile, JSON.stringify(targets, null, 2) + '\n');
NODE

node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const changedFiles = process.env.CHANGED_FILES;
const changedDirs = process.env.CHANGED_DIRS;
const targets = JSON.parse(fs.readFileSync(process.env.TARGET_JSON, 'utf8'));

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry.isFile() && entry.name === 'package.json' && !full.includes(`${path.sep}spring-ai-examples${path.sep}`)) {
      const raw = fs.readFileSync(full, 'utf8');
      const pkg = JSON.parse(raw);
      let changed = false;

      for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const deps = pkg[section];
        if (!deps) continue;

        for (const [name] of Object.entries(deps)) {
          const nextVersion = targets[name];
          if (!nextVersion) continue;
          const normalized = `^${nextVersion}`;
          if (deps[name] !== normalized) {
            deps[name] = normalized;
            changed = true;
          }
        }
      }

      if (changed) {
        const relativePath = path.relative(root, full);
        fs.writeFileSync(full, JSON.stringify(pkg, null, 2) + '\n');
        fs.appendFileSync(changedFiles, `${relativePath}\n`);
        fs.appendFileSync(changedDirs, `${path.dirname(relativePath)}\n`);
        console.log(relativePath);
      }
    }
  }
}

walk(root);
NODE

rm -f "${TARGET_JSON}"

if [ ! -s "${CHANGED_FILES}" ]; then
  echo "No package.json files needed updates."
  rm -f "${CHANGED_FILES}" "${CHANGED_DIRS}"
  echo ""
  echo "✅ Dependency version update complete!"
  exit 0
fi

echo ""
echo "Updating lockfiles with pnpm..."
sort -u "${CHANGED_DIRS}" | while IFS= read -r dir; do
  [ -z "$dir" ] && continue
  lockfile="${dir}/pnpm-lock.yaml"
  if [ -f "$lockfile" ]; then
    backup_lockfile="${BACKUP_DIR}/${lockfile}"
    mkdir -p "$(dirname "$backup_lockfile")"
    cp "$lockfile" "$backup_lockfile"
    (cd "$dir" && pnpm install --lockfile-only --ignore-scripts >/dev/null)
    echo "  ✓ $dir"
  fi
done

rm -f "${CHANGED_FILES}" "${CHANGED_DIRS}"

echo ""
echo "Summary:"
echo "✅ Dependency version update complete!"
