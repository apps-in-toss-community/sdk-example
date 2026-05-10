#!/usr/bin/env node
// scaffold-domain.ts — generate boilerplate for a new SDK domain page.
//
// Usage:
//   pnpm scaffold:domain <name> [--label "Display"] [--group misc]
//                              [--description "..."] [--dry-run]
//
// Edits three files via BEGIN/END markers (no AST):
//   - src/pages/<Pascal>Page.tsx   (created)
//   - src/App.tsx                  (import + route inserted)
//   - src/pages/HomePage.tsx       (domains entry inserted)
//
// Idempotent: re-running with the same name is a no-op (warns and exits 0).

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const APP_TSX = join(ROOT, 'src/App.tsx');
const HOME_TSX = join(ROOT, 'src/pages/HomePage.tsx');
const PAGES_DIR = join(ROOT, 'src/pages');

const KNOWN_GROUPS = ['core', 'permissions', 'commerce', 'telemetry', 'misc'] as const;

interface Options {
  name: string;
  label: string;
  group: string;
  description: string;
  dryRun: boolean;
}

interface PlannedChange {
  path: string;
  action: 'create' | 'edit' | 'skip';
  reason?: string;
}

function parseArgs(argv: string[]): Options {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const name = positional[0];
  if (!name) {
    fail(
      'Usage: pnpm scaffold:domain <name> [--label "Display"] [--group misc] [--description "..."] [--dry-run]',
    );
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    fail(`Invalid name "${name}": must be lowercase, hyphen-separated (e.g. my-domain).`);
  }

  const labelRaw = flags.label;
  const groupRaw = flags.group;
  const descRaw = flags.description;

  const label = typeof labelRaw === 'string' ? labelRaw : capitalize(name);
  const group = typeof groupRaw === 'string' ? groupRaw : 'misc';
  const description = typeof descRaw === 'string' ? descRaw : '';

  // The domains[] entry on HomePage is currently flat ({path, name, description, apis}) and
  // does not store group. --group is captured for future use (e.g. when HomePage groups cards
  // by category) but has no runtime effect today — warn loudly so callers don't expect grouping.
  if (groupRaw !== undefined) {
    const known = KNOWN_GROUPS.includes(group as (typeof KNOWN_GROUPS)[number]);
    const suffix = known ? '' : ` (not in known set [${KNOWN_GROUPS.join(', ')}])`;
    console.warn(
      `⚠️  --group "${group}"${suffix} is recorded only as intent — the current HomePage entry schema does not store group, so this value has no runtime effect.`,
    );
  }

  return { name, label, group, description, dryRun: flags['dry-run'] === true };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s
    .split('-')
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

function pascal(s: string): string {
  return s
    .split('-')
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : ''))
    .join('');
}

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function pageTemplate(opts: Options): string {
  const componentName = `${pascal(opts.name)}Page`;
  const desc = opts.description || `${opts.label} 도메인 API`;
  return `import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';

export function ${componentName}() {
  return (
    <div>
      <PageHeader title="${escapeJsxAttr(opts.label)}" />
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">${escapeJsxText(desc)}</p>
        {/* TODO: Add an <ApiCard /> for each SDK method in this domain. */}
        <ApiCard
          name="placeholder"
          description="새 API 카드를 추가하세요"
          params={[]}
          execute={async () => ({ ok: true })}
        />
      </div>
    </div>
  );
}
`;
}

function ensureMarkers(content: string, begin: string, end: string, file: string): string {
  if (content.includes(begin) && content.includes(end)) return content;
  fail(
    `Markers ${begin} / ${end} not found in ${file}. ` +
      `Add them around the section the scaffold should manage, then re-run.`,
  );
}

function insertBeforeMarker(
  content: string,
  endMarker: string,
  insertion: string,
  alreadyContains: (c: string) => boolean,
): { content: string; inserted: boolean } {
  if (alreadyContains(content)) return { content, inserted: false };
  const idx = content.indexOf(endMarker);
  if (idx === -1) {
    fail(`End marker ${endMarker} missing.`);
  }
  // Find the start of the line containing the end marker, preserve its indent.
  const lineStart = content.lastIndexOf('\n', idx) + 1;
  const indent = content.slice(lineStart, idx);
  const withIndent = insertion
    .split('\n')
    .map((l) => (l ? indent + l : l))
    .join('\n');
  const next = `${content.slice(0, lineStart)}${withIndent}\n${content.slice(lineStart)}`;
  return { content: next, inserted: true };
}

function plan(opts: Options): {
  changes: PlannedChange[];
  apply: () => string[];
} {
  const componentName = `${pascal(opts.name)}Page`;
  const pagePath = join(PAGES_DIR, `${componentName}.tsx`);
  const routePath = `/${opts.name}`;
  const importLine = `import { ${componentName} } from './pages/${componentName}';`;
  const routeLine = `<Route path="${routePath}" element={<${componentName} />} />`;
  const entryLine = `{ path: '${routePath}', name: '${escapeSingleQuote(opts.label)}', description: '${escapeSingleQuote(
    opts.description || opts.label,
  )}', apis: [] },`;

  const changes: PlannedChange[] = [];

  // Page file
  if (existsSync(pagePath)) {
    changes.push({ path: pagePath, action: 'skip', reason: 'page already exists' });
  } else {
    changes.push({ path: pagePath, action: 'create' });
  }

  // App.tsx
  const appSrc = readFileSync(APP_TSX, 'utf8');
  ensureMarkers(appSrc, 'SCAFFOLD_DOMAIN_IMPORTS_BEGIN', 'SCAFFOLD_DOMAIN_IMPORTS_END', APP_TSX);
  ensureMarkers(appSrc, 'SCAFFOLD_DOMAIN_ROUTES_BEGIN', 'SCAFFOLD_DOMAIN_ROUTES_END', APP_TSX);
  const importExists = appSrc.includes(importLine);
  // Match the full <Route prefix to avoid false positives on path substrings (e.g. /ads vs /ads-foo).
  const routeExists = appSrc.includes(`<Route path="${routePath}"`);
  if (importExists && routeExists) {
    changes.push({ path: APP_TSX, action: 'skip', reason: 'route + import already present' });
  } else {
    changes.push({ path: APP_TSX, action: 'edit' });
  }

  // HomePage.tsx
  const homeSrc = readFileSync(HOME_TSX, 'utf8');
  ensureMarkers(homeSrc, 'SCAFFOLD_DOMAIN_ENTRIES_BEGIN', 'SCAFFOLD_DOMAIN_ENTRIES_END', HOME_TSX);
  const entryExists = homeSrc.includes(`path: '${routePath}'`);
  if (entryExists) {
    changes.push({ path: HOME_TSX, action: 'skip', reason: 'domains entry already present' });
  } else {
    changes.push({ path: HOME_TSX, action: 'edit' });
  }

  const apply = (): string[] => {
    const written: string[] = [];

    if (!existsSync(pagePath)) {
      writeFileSync(pagePath, pageTemplate(opts), 'utf8');
      written.push(pagePath);
    }

    let nextApp = appSrc;
    if (!importExists) {
      const r = insertBeforeMarker(nextApp, '// SCAFFOLD_DOMAIN_IMPORTS_END', importLine, (c) =>
        c.includes(importLine),
      );
      nextApp = r.content;
    }
    if (!routeExists) {
      const r = insertBeforeMarker(nextApp, '{/* SCAFFOLD_DOMAIN_ROUTES_END */}', routeLine, (c) =>
        c.includes(`path="${routePath}"`),
      );
      nextApp = r.content;
    }
    if (nextApp !== appSrc) {
      writeFileSync(APP_TSX, nextApp, 'utf8');
      written.push(APP_TSX);
    }

    if (!entryExists) {
      const r = insertBeforeMarker(homeSrc, '// SCAFFOLD_DOMAIN_ENTRIES_END', entryLine, (c) =>
        c.includes(`path: '${routePath}'`),
      );
      if (r.inserted) {
        writeFileSync(HOME_TSX, r.content, 'utf8');
        written.push(HOME_TSX);
      }
    }

    return written;
  };

  return { changes, apply };
}

function escapeSingleQuote(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeJsxAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

function escapeJsxText(s: string): string {
  return s
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function relative(p: string): string {
  return p.startsWith(`${ROOT}/`) ? p.slice(ROOT.length + 1) : p;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { changes, apply } = plan(opts);

  console.log(
    `\n📋 Plan for domain "${opts.name}" (label="${opts.label}", group="${opts.group}"):`,
  );
  for (const c of changes) {
    const marker = c.action === 'create' ? '+' : c.action === 'edit' ? '~' : '·';
    const suffix = c.reason ? ` (${c.reason})` : '';
    console.log(`  ${marker} ${c.action.padEnd(6)} ${relative(c.path)}${suffix}`);
  }

  if (opts.dryRun) {
    console.log('\n🔍 --dry-run: no files written.');
    return;
  }

  const written = apply();
  if (written.length === 0) {
    console.log('\n✅ Nothing to do — domain already scaffolded.');
    return;
  }

  console.log('\n✏️  Wrote:');
  for (const f of written) console.log(`   ${relative(f)}`);

  // Format the changed files via biome so output is idempotent and CI-clean.
  try {
    const rel = written.map(relative).join(' ');
    execSync(`pnpm exec biome check --write ${rel}`, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.warn('\n⚠️  biome check --write failed; run `pnpm lint:fix` manually.');
  }

  console.log(
    `\n👉 Next steps:\n   1. Open src/pages/${pascal(opts.name)}Page.tsx and add ApiCards.\n   2. Add the API list to the HomePage entry's "apis" array.\n   3. Run \`pnpm dev\` and visit /${opts.name}.\n`,
  );
}

main();
