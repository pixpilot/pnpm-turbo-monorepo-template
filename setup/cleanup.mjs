#!/usr/bin/env node
/**
 * Removes every trace of the one-time setup gate.
 *
 * Run by `setup/scaffoldfy.json` (task `remove-setup-guard`) once the
 * workspace-initializer has finished. The last step deletes this folder itself,
 * so nothing from the gate survives into the generated project.
 *
 * Every step is idempotent and non-fatal: a piece that is already gone (or was
 * edited by hand) is reported and skipped rather than failing the setup run.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Matched loosely on purpose. Earlier tasks in the run rewrite these files --
 * `sort-root-package` re-serializes package.json and the packages-section task
 * overwrites .husky/pre-commit -- so exact-string matching is not safe.
 */
const GUARD_REF = 'setup/guard.mjs';
const POSTINSTALL_SEGMENT =
  /\s*&&\s+node\s+setup\/guard\.mjs(?:\s+\w+)?|node\s+setup\/guard\.mjs(?:\s+\w+)?\s+&&\s*/u;
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

    for (const [name, value] of Object.entries(scripts)) {
      if (typeof value === 'string' && value.includes(GUARD_REF)) {
        scripts[name] = value.replace(POSTINSTALL_SEGMENT, '');
        changed = true;
        done.push(`unchained guard from scripts.${name}`);
      }
    }

    if (typeof scripts.postinstall === 'string') {
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
  } else if (file.text.includes(GUARD_REF)) {
    const kept = [];
    for (const line of file.text.split('\n')) {
      if (line.includes(GUARD_REF)) {
        // Also drop the comment that introduced the check, and its blank line.
        while (kept.length > 0 && kept[kept.length - 1].trimStart().startsWith('#')) {
          kept.pop();
        }
        while (kept.length > 0 && kept[kept.length - 1].trim() === '') {
          kept.pop();
        }
        continue;
      }
      kept.push(line);
    }
    writeFileSync(file.full, kept.join('\n'));
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

/*
 * 4. Delete this folder -- but only once nothing references it any more.
 *
 * Order matters: deleting setup/ while package.json still calls
 * `node setup/guard.mjs` from postinstall would make every later
 * `pnpm install` fail with MODULE_NOT_FOUND. So the folder is removed here,
 * after the edits above, and only if a re-read confirms no reference survived.
 */
const leftovers = ['package.json', '.husky/pre-commit', 'README.md'].filter(
  (relativePath) => readIfPresent(relativePath)?.text.includes('setup/guard.mjs'),
);

if (leftovers.length > 0) {
  console.warn(
    `  cleanup: WARNING -- setup/ kept, these still reference setup/guard.mjs: ${leftovers.join(', ')}`,
  );
  console.warn('  cleanup: remove those lines by hand, then delete the setup/ folder.');
} else {
  rmSync(dirname(fileURLToPath(import.meta.url)), { recursive: true, force: true });
  console.warn('  cleanup: removed the setup/ folder');
}

process.exit(0);
