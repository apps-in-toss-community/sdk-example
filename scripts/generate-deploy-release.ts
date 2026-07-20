/**
 * generate-deploy-release.ts
 *
 * Reads the intoss-private:// URL emitted by `ait deploy --scheme-only`
 * and writes a QR PNG + GitHub Release body to RELEASE_DIR (default
 * .tmp/release). Called from .github/workflows/deploy-ait.yml after the
 * deploy step.
 *
 * Inputs (env):
 *   DEPLOY_URL    intoss-private:// URL (required) — the 2.x-style scheme
 *                 URL from `ait deploy --scheme-only` (no `host` param).
 *   HOST_URL      optional console test-link carrying the `host` param the
 *                 3.0 runtime entry requires (#289). Emitted by the
 *                 "Fetch console test-link" workflow step, which is
 *                 best-effort — empty when unavailable, in which case only
 *                 the DEPLOY_URL section below is rendered (unchanged
 *                 behavior).
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
const HOST_URL = process.env.HOST_URL ?? '';
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

  let hostQrWritten = false;
  if (HOST_URL) {
    const hostQrPath = resolve(RELEASE_DIR, 'qr-host.png');
    await QRCode.toFile(hostQrPath, HOST_URL, {
      type: 'png',
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    hostQrWritten = true;
  }

  const size = await bundleSizeMB();
  const shortSha = COMMIT_SHA === '(unknown)' ? COMMIT_SHA : COMMIT_SHA.slice(0, 12);
  const deploymentId = new URL(DEPLOY_URL).searchParams.get('_deploymentId') ?? '(unknown)';

  const hostLinkSection = hostQrWritten
    ? [
        '## 3.x host-param entry (console test-link)',
        '',
        '3.0 런타임 진입은 `host` 파라미터(`host=appsInTossHost`)가 필수입니다 — 위 2.x scheme URL에는 없습니다 (#289). 아래는 콘솔 test-link로, 3.x 셀에서는 이 URL/`qr-host.png`를 사용합니다.',
        '',
        '```',
        HOST_URL,
        '```',
        '',
      ]
    : [];

  const body = [
    '## 2.x scheme entry',
    '',
    '아래 intoss-private URL을 폰의 토스 앱에서 열거나 `qr.png`를 카메라로 스캔합니다. (`host` 파라미터가 없는 2.x 시절 계약 — 3.x 진입은 아래 섹션 참고.)',
    '',
    '```',
    DEPLOY_URL,
    '```',
    '',
    ...hostLinkSection,
    '> **미니앱이 안 뜬다면** — 31146이 아직 출시 review 통과 전(`serviceStatus: PREPARE`)이라 intoss-private URL만으론 bundle이 load되지 않을 수 있습니다. 그땐 운영자가 로컬에서 한 번 더 push를 보내야 합니다:',
    '>',
    '> ```sh',
    `> aitcc app bundles test-push --workspace 3095 --app 31146 --deployment-id ${deploymentId}`,
    '> ```',
    '>',
    '> 토스 앱에 push 알림이 오고, 그 알림을 통해 이 bundle이 load됩니다. 자세한 배경은 umbrella `CLAUDE.md` "Dog-food 흐름" 참고.',
    '',
    '## 빌드 정보',
    '',
    `- Tag: \`${TAG}\``,
    `- Commit: \`${shortSha}\``,
    `- Bundle: \`aitc-sdk-example.ait\` (${size})`,
    `- DeploymentId: \`${deploymentId}\``,
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
  if (hostQrWritten) {
    console.log(`[generate-deploy-release] wrote ${resolve(RELEASE_DIR, 'qr-host.png')}`);
  }
  console.log(`[generate-deploy-release] wrote ${bodyPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
