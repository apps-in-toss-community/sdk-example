/**
 * generate-deploy-release.ts
 *
 * Reads the intoss-private:// URL (constructed by the CI workflow from the
 * deploymentId embedded in the .ait bundle) and writes a QR PNG + GitHub
 * Release body to RELEASE_DIR (default .tmp/release).
 * Called from .github/workflows/deploy-ait.yml after the deploy step.
 *
 * web-framework 3.0: `ait deploy --scheme-only` is gone. The URL is now
 * constructed in the workflow as `intoss-private://aitc-sdk-example?_deploymentId=<id>`
 * and passed here via DEPLOY_URL.
 *
 * Inputs (env):
 *   DEPLOY_URL    intoss-private:// URL (required)
 *   TAG           release tag, e.g. v0.1.5 (optional — falls back to "(unknown)")
 *   COMMIT_SHA    full commit SHA (optional)
 *   CHANNEL       build channel: "release" (default) or "dogfood"
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
const CHANNEL = process.env.CHANNEL === 'dogfood' ? 'dogfood' : 'release';
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
  const deploymentId = new URL(DEPLOY_URL).searchParams.get('_deploymentId') ?? '(unknown)';

  const isDogfood = CHANNEL === 'dogfood';

  const dogfoodNote = [
    '## dogfood 빌드 — on-device relay attach 가능',
    '',
    '이 번들은 `RELEASE_CHANNEL=dogfood`로 빌드되었습니다. `?debug=1&relay=<wss>` query param을 URL에 포함해 미니앱을 열면 우상단에 attach 상태 아이콘(dot)이 표시되고, CDP relay가 연결되면 초록색으로 전환됩니다.',
    '',
    '연결 절차:',
    '',
    '1. 노트북에서 `pnpm exec devtools-mcp` 실행 → cloudflared quick tunnel URL 출력',
    '2. `?_deploymentId=<id>&debug=1&relay=<wss_url>` deep-link를 QR로 생성해 폰 카메라로 스캔',
    '3. 미니앱 우상단 dot이 초록색이 되면 relay 연결 성공',
    '',
    '',
  ];

  const body = [
    '## 토스 앱에서 미니앱 열기',
    '',
    '아래 intoss-private URL을 폰의 토스 앱에서 열거나 `qr.png`를 카메라로 스캔합니다.',
    '',
    '```',
    DEPLOY_URL,
    '```',
    '',
    '> **미니앱이 안 뜬다면** — 31146이 아직 출시 review 통과 전(`serviceStatus: PREPARE`)이라 cold-load가 필요합니다. `?_deploymentId=<id>&debug=1&relay=<wss>` 형식의 deep-link를 QR로 렌더해 폰 카메라로 스캔하면 PREPARE 상태에서도 bundle이 load됩니다(umbrella `CLAUDE.md` §3.2 "Dog-food 흐름" 참고). `test-push` 경로는 폐기됐습니다.',
    '',
    ...(isDogfood ? dogfoodNote : []),
    '## 빌드 정보',
    '',
    `- Channel: \`${CHANNEL}\``,
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
  console.log(`[generate-deploy-release] wrote ${bodyPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
