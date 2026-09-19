#!/usr/bin/env node
/**
 * Removes every trace of the one-time setup gate.
 *
 * Run by `setup/scaffoldfy.json` (task `remove-setup-guard`) once the
 * workspace-initializer has finished. A sibling `delete` task then removes this
 * whole folder, so nothing from the gate survives into the generated project.
 *
 * Every step is idempotent and non-fatal: a piece that is already gone (or was
 * edited by hand) is reported and skipped rather than failing the setup run.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const POSTINSTALL_SUFFIX = ' && node setup/guard.mjs warn';
const HUSKY_BLOCK =
  '\n# Block commits until the one-time workspace initializer has been run.\nnode setup/guard.mjs block || exit 1\n';
const JSON_INDENT = 2;
const README_NOTE_START = 'This is a one-time step.';

const done = [];
const skipped = [];

function readIfPresent(relativePath) {
  const full = join(root, relativePath);
  return existsSync(full) ? { full, text: readFileSync(full, 'utf8') } : null;
}

// 1. package.json -- drop `scripts.setup` and unchain the postinstall guard.
{
  const file = readIfPresent('package.json');
  if (file == null) {
    skipped.push('package.json not found');
  } else {
    const pkg = JSON.parse(file.text);
    const scripts = pkg.scripts ?? {};
    let changed = false;

    if ('setup' in scripts) {
      delete scripts.setup;
      changed = true;
      done.push('removed scripts.setup');
    }

    if (typeof scripts.postinstall === 'string') {
      if (scripts.postinstall.includes(POSTINSTALL_SUFFIX)) {
        scripts.postinstall = scripts.postinstall.replace(POSTINSTALL_SUFFIX, '');
        changed = true;
        done.push('unchained guard from scripts.postinstall');
      }
      // A postinstall that is now empty would break `pnpm install`.
      if (scripts.postinstall.trim() === '') {
        delete scripts.postinstall;
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(file.full, `${JSON.stringify(pkg, null, JSON_INDENT)}\n`);
    } else {
      skipped.push('package.json already clean');
    }
  }
}

// 2. .husky/pre-commit -- drop the blocking check, keep lint-staged.
{
  const file = readIfPresent('.husky/pre-commit');
  if (file == null) {
    skipped.push('.husky/pre-commit not found');
  } else if (file.text.includes(HUSKY_BLOCK)) {
    writeFileSync(file.full, file.text.replace(HUSKY_BLOCK, ''));
    done.push('removed guard from .husky/pre-commit');
  } else {
    skipped.push('.husky/pre-commit already clean');
  }
}

/*
 * 3. README.md -- normally moot, since the workspace-initializer rewrites the
 * README from its own template. Kept as a safety net for anyone running this
 * config with `clean-readme` disabled.
 */
{
  const file = readIfPresent('README.md');
  if (file != null && file.text.includes(README_NOTE_START)) {
    const lines = file.text.split('\n');
    const start = lines.findIndex((line) => line.includes(README_NOTE_START));
    let end = start;
    while (end < lines.length && lines[end].trim() !== '') {
      end += 1;
    }
    // Swallow the blank line that separated the note from the next step.
    while (end < lines.length && lines[end].trim() === '') {
      end += 1;
    }
    lines.splice(start, end - start);
    writeFileSync(file.full, lines.join('\n'));
    done.push('removed setup note from README.md');
  }
}

for (const message of done) {
  console.warn(`  cleanup: ${message}`);
}
for (const message of skipped) {
  console.warn(`  cleanup: skipped -- ${message}`);
}

process.exit(0);
