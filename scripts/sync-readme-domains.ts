#!/usr/bin/env node
// sync-readme-domains.ts — regenerate README's domain catalog table from
// HomePage.tsx's `domains` array (single source of truth).
//
// Usage:
//   pnpm sync:readme           # rewrite README in place
//   pnpm sync:readme:check     # CI mode — exit 1 + diff if README is stale
//
// Reads the array body between SCAFFOLD_DOMAIN_ENTRIES_BEGIN/END markers in
// src/pages/HomePage.tsx and replaces the body between
// <!-- DOMAIN_TABLE_BEGIN --> ... <!-- DOMAIN_TABLE_END --> in README.md.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const HOME_TSX = resolve(ROOT, 'src/pages/HomePage.tsx');
const README_MD = resolve(ROOT, 'README.md');

const SCAFFOLD_BEGIN = '// SCAFFOLD_DOMAIN_ENTRIES_BEGIN';
const SCAFFOLD_END = '// SCAFFOLD_DOMAIN_ENTRIES_END';
const README_BEGIN = '<!-- DOMAIN_TABLE_BEGIN -->';
const README_END = '<!-- DOMAIN_TABLE_END -->';

interface DomainEntry {
  path: string;
  name: string;
  description: string;
  apiCount: number;
}

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function sliceBetween(source: string, begin: string, end: string, file: string): string {
  const beginIdx = source.indexOf(begin);
  const endIdx = source.indexOf(end);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    fail(
      `Could not find markers "${begin}" / "${end}" in ${file}. Markers may have been removed or reordered.`,
    );
  }
  return source.slice(beginIdx + begin.length, endIdx);
}

// Walk a TS-source slice that is the body of an array of object literals.
// Returns each top-level `{ ... }` chunk as a string. Tracks nesting on
// `{[(` so commas inside nested arrays/objects don't split entries.
function splitTopLevelObjects(slice: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inString: '"' | "'" | '`' | null = null;
  let escaped = false;
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        out.push(slice.slice(start, i + 1));
        start = -1;
      }
    } else if (ch === '[' || ch === '(') {
      depth++;
    } else if (ch === ']' || ch === ')') {
      depth--;
    }
  }
  if (depth !== 0) {
    fail('Unbalanced braces while parsing HomePage domains array.');
  }
  return out;
}

// Extract a single string-valued field (path/name/description) from an
// object-literal source chunk. Returns null if not present. Uses a permissive
// regex; we control both producer (scaffold) and consumer (this script).
function extractStringField(objSrc: string, field: string): string | null {
  const re = new RegExp(`${field}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`);
  const m = objSrc.match(re);
  if (!m) return null;
  // Unescape common sequences (\\n, \\t, \\', \\", \\`, \\\\).
  return m[2]!.replace(/\\(.)/g, (_, c) => {
    if (c === 'n') return '\n';
    if (c === 't') return '\t';
    return c;
  });
}

// Count entries inside the `apis: [...]` array by counting top-level
// string literals. Robust to whitespace and trailing commas.
function extractApiCount(objSrc: string): number {
  const re = /apis\s*:\s*\[([\s\S]*?)\]/;
  const m = objSrc.match(re);
  if (!m) return 0;
  const body = m[1]!;
  let count = 0;
  let inString: '"' | "'" | '`' | null = null;
  let escaped = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
        count++;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
    }
  }
  return count;
}

function parseDomains(homeTsx: string): DomainEntry[] {
  const slice = sliceBetween(homeTsx, SCAFFOLD_BEGIN, SCAFFOLD_END, 'src/pages/HomePage.tsx');
  const objects = splitTopLevelObjects(slice);
  if (objects.length === 0) {
    fail('No domain entries found between SCAFFOLD_DOMAIN_ENTRIES markers.');
  }
  return objects.map((src, idx) => {
    const path = extractStringField(src, 'path');
    const name = extractStringField(src, 'name');
    const description = extractStringField(src, 'description');
    if (path === null || name === null || description === null) {
      fail(
        `Domain entry #${idx + 1} is missing path/name/description. HomePage.domains shape may have changed — update sync-readme-domains.ts to match.`,
      );
    }
    return {
      path,
      name,
      description,
      apiCount: extractApiCount(src),
    };
  });
}

// Markdown table cells: escape `|` and collapse newlines so generated rows
// stay on a single line even if a description ever contains them.
function escapeCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function renderTable(entries: DomainEntry[]): string {
  const lines: string[] = [];
  lines.push(`<!-- Generated by scripts/sync-readme-domains.ts — do not edit by hand. -->`);
  lines.push(`<!-- Source of truth: src/pages/HomePage.tsx \`domains\` array. -->`);
  lines.push('');
  lines.push(`### 지원 SDK 도메인 (${entries.length}개)`);
  lines.push('');
  lines.push('| 경로 | 도메인 | 설명 | API 수 |');
  lines.push('|---|---|---|---|');
  for (const e of entries) {
    lines.push(
      `| \`${escapeCell(e.path)}\` | ${escapeCell(e.name)} | ${escapeCell(e.description)} | ${e.apiCount} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function replaceBetween(
  source: string,
  begin: string,
  end: string,
  body: string,
  file: string,
): string {
  const beginIdx = source.indexOf(begin);
  const endIdx = source.indexOf(end);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    fail(
      `Could not find markers "${begin}" / "${end}" in ${file}. Add them around the domain table region first.`,
    );
  }
  const before = source.slice(0, beginIdx + begin.length);
  const after = source.slice(endIdx);
  return `${before}\n${body}\n${after}`;
}

// Show only the marker region from current vs expected README. The rest of
// README is byte-identical by construction (we only ever rewrite between the
// markers), so any drift is contained there. This avoids the line-shift
// avalanche a naive paired diff produces when one row is added.
function markerRegionDiff(expected: string, actual: string): string {
  const slice = (src: string): string[] => {
    const begin = src.indexOf(README_BEGIN);
    const end = src.indexOf(README_END);
    if (begin === -1 || end === -1) return src.split('\n');
    return src.slice(begin, end + README_END.length).split('\n');
  };
  const exp = slice(expected);
  const act = slice(actual);
  const out: string[] = [];
  out.push('--- current README (between markers) ---');
  for (const line of act) out.push(`- ${line}`);
  out.push('--- expected (after `pnpm sync:readme`) ---');
  for (const line of exp) out.push(`+ ${line}`);
  return out.join('\n');
}

function main(): void {
  const checkMode = process.argv.includes('--check');

  const homeSrc = readFileSync(HOME_TSX, 'utf8');
  const readmeSrc = readFileSync(README_MD, 'utf8');

  const entries = parseDomains(homeSrc);
  const generated = renderTable(entries);
  const expected = replaceBetween(readmeSrc, README_BEGIN, README_END, generated, 'README.md');

  if (checkMode) {
    if (expected === readmeSrc) {
      console.log(`✓ README domain table is in sync (${entries.length} entries).`);
      return;
    }
    console.error('❌ README.md domain table is out of sync with HomePage.tsx `domains`.');
    console.error('   Run `pnpm sync:readme` and commit the result.\n');
    console.error(markerRegionDiff(expected, readmeSrc));
    process.exit(1);
  }

  if (expected === readmeSrc) {
    console.log(`✓ README already up to date (${entries.length} entries).`);
    return;
  }
  writeFileSync(README_MD, expected);
  console.log(`✓ README domain table regenerated (${entries.length} entries).`);
}

main();
