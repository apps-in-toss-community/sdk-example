/**
 * build-og-images.tsx
 *
 * Generates static Open Graph PNGs (1200x630) for the homepage and every SDK
 * domain group in src/og/manifest.ts. Output: public/og/<slug>.png.
 *
 * Pipeline: JSX template (src/og/template.tsx) -> satori -> SVG -> sharp -> PNG.
 *
 * Runs ahead of `vite build` so the committed PNGs in public/og/ always match
 * the current group manifest and template. Removing/renaming a group drops or
 * renames its PNG on the next build; reviewing the diff is the consistency
 * check.
 */

import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import { ALL_ENTRIES, type OgEntry } from '../src/og/manifest.ts';
import { OgTemplate } from '../src/og/template.tsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/og');
const FONTS_DIR = resolve(ROOT, 'src/og/fonts');

async function loadFonts(): Promise<Parameters<typeof satori>[1]['fonts']> {
  const [bold, semibold, medium] = await Promise.all([
    readFile(resolve(FONTS_DIR, 'Pretendard-Bold.otf')),
    readFile(resolve(FONTS_DIR, 'Pretendard-SemiBold.otf')),
    readFile(resolve(FONTS_DIR, 'Pretendard-Medium.otf')),
  ]);
  return [
    { name: 'Pretendard', data: medium, weight: 500, style: 'normal' },
    { name: 'Pretendard', data: semibold, weight: 600, style: 'normal' },
    { name: 'Pretendard', data: bold, weight: 800, style: 'normal' },
  ];
}

async function renderEntry(
  entry: OgEntry,
  fonts: Awaited<ReturnType<typeof loadFonts>>,
): Promise<void> {
  const svg = await satori(
    <OgTemplate
      eyebrow={entry.eyebrow}
      title={entry.title}
      subtitle={entry.subtitle}
      footer={entry.footer}
    />,
    { width: 1200, height: 630, fonts },
  );
  // palette: true switches to 8-bit colormap PNG, ~3x smaller for the limited
  // palette we use (brand blue, grays, white).
  const png = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  await writeFile(resolve(OUT_DIR, `${entry.slug}.png`), png);
}

/** Remove any stale PNGs whose slug no longer matches a manifest entry. */
async function pruneStale(validSlugs: Set<string>): Promise<void> {
  let existing: string[];
  try {
    existing = await readdir(OUT_DIR);
  } catch {
    return;
  }
  await Promise.all(
    existing
      .filter((f) => f.endsWith('.png'))
      .filter((f) => !validSlugs.has(f.replace(/\.png$/, '')))
      .map((f) => unlink(resolve(OUT_DIR, f))),
  );
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const fonts = await loadFonts();

  console.log(`[og] generating ${ALL_ENTRIES.length} images...`);
  const start = Date.now();
  for (const entry of ALL_ENTRIES) {
    await renderEntry(entry, fonts);
    console.log(`[og]  -> ${entry.slug}.png`);
  }
  await pruneStale(new Set(ALL_ENTRIES.map((e) => e.slug)));
  console.log(`[og] done in ${Date.now() - start}ms`);
}

main().catch((err) => {
  console.error('[og] failed:', err);
  process.exit(1);
});
