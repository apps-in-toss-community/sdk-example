/**
 * generate-deploy-release.ts
 *
 * Reads the intoss-private:// URL emitted by `ait deploy --scheme-only`
 * and writes a QR PNG + GitHub Release body to RELEASE_DIR (default
 * .tmp/release). Called from .github/workflows/deploy-ait.yml after the
 * deploy step.
 *
 * Inputs (env):
 *   DEPLOY_URL    intoss-private:// URL (required)
 *   TAG           release tag, e.g. v0.1.5 (optional — falls back to "(unknown)")
 *   COMMIT_SHA    full commit SHA (optional)
 *   RELEASE_DIR   output directory (default .tmp/release)
 *   BUNDLE_PATH   path to the .ait bundle for size reporting (default aitc-sdk-example.ait)
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');

const DEPLOY_URL = process.env.DEPLOY_URL ?? '';
const TAG = process.env.TAG ?? '(unknown)';
const COMMIT_SHA = process.env.COMMIT_SHA ?? '(unknown)';
const RELEASE_DIR = resolve(ROOT, process.env.RELEASE_DIR ?? '.tmp/release');
const BUNDLE_PATH = resolve(ROOT, process.env.BUNDLE_PATH ?? 'aitc-sdk-example.ait');

if (!DEPLOY_URL.startsWith('intoss-private://')) {
  console.error(
    `[generate-deploy-release] DEPLOY_URL must start with intoss-private:// (got: "${DEPLOY_URL}")`,
  );
  process.exit(1);
}

async function bundleSizeMB(): Promise<string> {
  try {
    const s = await stat(BUNDLE_PATH);
    return `${(s.size / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return '(missing)';
  }
}

async function main(): Promise<void> {
  await mkdir(RELEASE_DIR, { recursive: true });

  const qrPath = resolve(RELEASE_DIR, 'qr.png');
  await QRCode.toFile(qrPath, DEPLOY_URL, {
    type: 'png',
    width: 480,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  const size = await bundleSizeMB();
  const shortSha = COMMIT_SHA === '(unknown)' ? COMMIT_SHA : COMMIT_SHA.slice(0, 12);

  const body = [
    '## 토스 앱에서 미니앱 열기',
    '',
    '아래 URL을 토스 앱이 설치된 폰에서 열면 미니앱이 풀스크린으로 뜹니다 (리뷰 큐 통과 없이 직접 실행되는 dog-food 경로).',
    '',
    '```',
    DEPLOY_URL,
    '```',
    '',
    '첨부된 `qr.png`를 폰 카메라로 스캔해도 동일하게 열립니다.',
    '',
    '## 빌드 정보',
    '',
    `- Tag: \`${TAG}\``,
    `- Commit: \`${shortSha}\``,
    `- Bundle: \`aitc-sdk-example.ait\` (${size})`,
    '- App: `aitc-sdk-example` (miniAppId 31146, workspace 3095)',
    '',
    '---',
    '',
    '커뮤니티 오픈소스 프로젝트입니다.',
    '',
  ].join('\n');

  const bodyPath = resolve(RELEASE_DIR, 'release-body.md');
  await writeFile(bodyPath, body, 'utf8');

  console.log(`[generate-deploy-release] wrote ${qrPath}`);
  console.log(`[generate-deploy-release] wrote ${bodyPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
