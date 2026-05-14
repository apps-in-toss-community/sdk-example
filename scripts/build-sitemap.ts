/**
 * build-sitemap.ts
 *
 * Emits dist/sitemap.xml from src/og/manifest.ts, so every documented route
 * gets a sitemap entry pointing at its canonical URL. Origin comes from
 * public/CNAME (same source as build-route-html.ts).
 *
 * Runs after `vite build` (alongside build-route-html.ts).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ENTRIES } from '../src/og/manifest.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CNAME = resolve(ROOT, 'public/CNAME');

async function readSiteOrigin(): Promise<string> {
  try {
    const cname = (await readFile(CNAME, 'utf8')).trim();
    return cname ? `https://${cname}` : '';
  } catch {
    return '';
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main(): Promise<void> {
  const origin = await readSiteOrigin();
  if (!origin) {
    console.warn('[sitemap] no public/CNAME — skipping sitemap.xml');
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = ALL_ENTRIES.map((entry) => {
    const loc = escapeXml(`${origin}${entry.route}`);
    const priority = entry.slug === 'home' ? '1.0' : '0.7';
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(resolve(DIST, 'sitemap.xml'), xml);
  console.log(`[sitemap] wrote dist/sitemap.xml (${ALL_ENTRIES.length} urls)`);
}

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});
