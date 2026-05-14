/**
 * build-route-html.ts
 *
 * sdk-example is a SPA (single dist/index.html), so a regular Vite build
 * cannot give crawlers a per-route og:image. This postbuild step takes the
 * already-built dist/index.html and emits a per-route copy at
 * dist/<slug>/index.html with og:* / twitter:* / <title> rewritten to match
 * the matching OG image in public/og/<slug>.png.
 *
 * Same JS bundle in every HTML file → SPA still boots normally for humans;
 * crawlers (Slack/Discord/Twitter unfurl, which don't run JS) just read the
 * static meta from the right HTML file. GitHub Pages serves <slug>/index.html
 * automatically when the URL is /<slug>, so no SPA fallback rewrites needed.
 *
 * Runs after `vite build`. Reads the canonical site URL from public/CNAME.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ENTRIES, type OgEntry } from '../src/og/manifest.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CNAME = resolve(ROOT, 'public/CNAME');

/** Vite's base path, mirrors vite.config.ts (defaults to "/"). */
const BASE_PATH = process.env.BASE_PATH ?? '/';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Replace the value of an existing meta tag matched by attr=key. Returns the
 *  patched HTML, or the original string if the tag wasn't found. Meta keys
 *  here are stable identifiers (og:title, twitter:image, …) so no escaping. */
function patchMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*("[^>]*>)`, 'i');
  return html.replace(re, `$1${escapeHtml(value)}$2`);
}

function patchTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function imageUrl(siteOrigin: string, slug: string): string {
  // BASE_PATH ends in "/" by Vite convention. og:image must be an absolute URL
  // for most crawlers to use it, so we prefer the canonical site origin from
  // public/CNAME when available; otherwise fall back to BASE_PATH-relative.
  const path = `${BASE_PATH.replace(/\/$/, '')}/og/${slug}.png`;
  if (siteOrigin) return `${siteOrigin}${path}`;
  return path;
}

function buildJsonLd(entry: OgEntry, siteOrigin: string, titleText: string): string {
  const url = siteOrigin ? `${siteOrigin}${entry.route}` : entry.route;
  const isHome = entry.slug === 'home';
  const graph: unknown[] = [
    isHome
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'sdk-example',
          url,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          description: entry.subtitle,
          inLanguage: 'ko',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: titleText,
          url,
          description: entry.subtitle,
          isPartOf: {
            '@type': 'WebSite',
            name: 'sdk-example',
            url: siteOrigin || '/',
          },
        },
  ];
  if (!isHome && siteOrigin) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'sdk-example', item: siteOrigin },
        { '@type': 'ListItem', position: 2, name: entry.title, item: url },
      ],
    });
  }
  return JSON.stringify(graph);
}

function injectHeadExtras(
  html: string,
  entry: OgEntry,
  siteOrigin: string,
  titleText: string,
): string {
  const canonical = siteOrigin ? `${siteOrigin}${entry.route}` : entry.route;
  const jsonLd = buildJsonLd(entry, siteOrigin, titleText);
  const extras = [
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');
  return html.replace(/<\/head>/i, `    ${extras}\n  </head>`);
}

function buildRouteHtml(template: string, entry: OgEntry, siteOrigin: string): string {
  const titleText = entry.pageTitle ?? `${entry.title} — sdk-example`;
  const ogImage = imageUrl(siteOrigin, entry.slug);

  let html = template;
  html = patchTitle(html, titleText);
  html = patchMeta(html, 'name', 'description', entry.subtitle);
  html = patchMeta(html, 'property', 'og:title', titleText);
  html = patchMeta(html, 'property', 'og:description', entry.subtitle);
  html = patchMeta(html, 'property', 'og:image', ogImage);
  html = patchMeta(html, 'name', 'twitter:title', titleText);
  html = patchMeta(html, 'name', 'twitter:description', entry.subtitle);
  html = patchMeta(html, 'name', 'twitter:image', ogImage);
  html = injectHeadExtras(html, entry, siteOrigin, titleText);
  return html;
}

async function readSiteOrigin(): Promise<string> {
  try {
    const cname = (await readFile(CNAME, 'utf8')).trim();
    return cname ? `https://${cname}` : '';
  } catch {
    return '';
  }
}

async function main(): Promise<void> {
  const indexPath = resolve(DIST, 'index.html');
  const template = await readFile(indexPath, 'utf8');
  const siteOrigin = await readSiteOrigin();

  console.log(
    `[route-html] writing ${ALL_ENTRIES.length} HTML files (origin=${siteOrigin || '(relative)'})`,
  );
  const start = Date.now();

  for (const entry of ALL_ENTRIES) {
    const html = buildRouteHtml(template, entry, siteOrigin);
    if (entry.slug === 'home') {
      // home overrides dist/index.html itself so the apex URL also gets the
      // canonical og:image (instead of the legacy /og-image.png placeholder).
      await writeFile(indexPath, html);
      console.log('[route-html]  -> dist/index.html (home)');
      continue;
    }
    const dir = resolve(DIST, entry.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'index.html'), html);
    console.log(`[route-html]  -> dist/${entry.slug}/index.html`);
  }

  console.log(`[route-html] done in ${Date.now() - start}ms`);
}

main().catch((err) => {
  console.error('[route-html] failed:', err);
  process.exit(1);
});
