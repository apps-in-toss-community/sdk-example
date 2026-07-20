#!/usr/bin/env node
/**
 * iOS Simulator 엔진 프로브 verdict를 **canonical capture 경로로 replay**해
 * `diff:captures`가 읽는 corpus 레코드로 승격한다.
 *
 * ─ 무엇을 푸는가 ────────────────────────────────────────────────────────────
 * `scripts/run-engine-probes-ios-sim.sh`는 실 iOS WebKit(Simulator)에서 9개
 * `engine.*` 프로브를 돌려 `{ userAgent, verdicts: [{ api, verdict }] }`를
 * `.ait-engine-sim/<device>.json`에 남긴다. 그건 full-value 요약이지
 * `AitCaptureRecord`가 아니라서 `diff:captures`(env1↔env3와 같은 계기)로는 못 읽는다.
 * env2(실 iOS WebKit)가 env3를 얼마나 재현하는지를 **사람 눈이 아니라 같은 계기의
 * 수치**로 말하려면 이 verdict를 corpus 레코드로 바꿔야 한다.
 *
 * ─ 왜 hand-convert가 아니라 replay인가 (포맷 drift 차단) ─────────────────────
 * 레코드 포맷은 `captureAsync`→`extractErrorShape`/`extractValueShape`가 만든다.
 * 손으로 흉내 내면 미묘하게 어긋난다 — 대표적으로 rejected 프로브(`vibrate` 등)는
 * `namedError`의 `e.name = name`이 own-enumerable 프로퍼티라 **`errorKeys: ['name']`**
 * 을 남기는데, 이건 diff의 비교 필드다. 손으로 `[]`를 쓰면 `vibrate`에서 **거짓
 * 불일치**가 난다. 그래서 verdict를 `captureProbeVerdict`(세 러너가 공유하는 canonical
 * 낙착 함수)에 그대로 흘려보내 env3와 **바이트 단위로 같은** 레코드를 얻는다.
 *
 * ─ 축 격리 ──────────────────────────────────────────────────────────────────
 * `AIT_CELL_PLATFORM=ios-sim` + `AIT_CAPTURE_DIR=<outDir>`로 이 실행분을 env1
 * corpus(`.ait-capture/`)에서 떼어 자기 dir로 flush한다 — 섞으면 engine 키가
 * chromium+ios-sim 2관측이 돼 env1↔env3 diff가 깨진다(`aitCapture.ts` flushCapture
 * 의 `AIT_CAPTURE_DIR` 주석 참조).
 *
 * ─ 사용 ─────────────────────────────────────────────────────────────────────
 *   pnpm tsx scripts/replay-engine-sim-capture.ts <in.json> [outDir]
 *     in.json  — `.ait-engine-sim/<device>.json`
 *     outDir   — 기본 `.ait-capture-env2` (gitignored, diff corpus dir로 지정해 씀)
 * 이후:
 *   pnpm diff:captures --a .ait-capture-env2 --b .ait-run/.ait-capture   # env2↔env3 engine
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flushCapture } from '../src/test/aitCapture';
import { captureProbeVerdict, ENGINE_CATEGORY, ENGINE_PROBES } from '../src/test/engineProbes';

/** iOS-Sim 페이지가 POST한 payload — `scripts/build-engine-probe-page.ts` 참조. */
interface SimPayload {
  userAgent?: string;
  verdicts: { api: string; verdict: { ok: boolean; value?: unknown; errorName?: string } }[];
}

const DEFAULT_OUT_DIR = '.ait-capture-env2';

function parseSimPayload(raw: string): SimPayload {
  const parsed: unknown = JSON.parse(raw);
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { verdicts?: unknown }).verdicts)
  ) {
    throw new Error(
      '입력이 { verdicts: [...] } 형태가 아닙니다 (.ait-engine-sim/<device>.json 인가?)',
    );
  }
  return parsed as SimPayload;
}

/**
 * verdict 배열을 canonical capture 경로로 replay한다. 각 verdict의 `api`로 실제
 * `ENGINE_PROBES` 정의를 찾아(레코드의 api 축을 정본과 일치시키려고) 그 verdict를
 * `captureProbeVerdict`에 넘긴다 — 판정 함수는 `probe.run()`이 아니라 넘긴 verdict를
 * 그대로 낙착시킨다(`settleProbeVerdict`). 정본에 없는 api가 오면 fail-fast한다:
 * 조용히 건너뛰면 커버리지 갭이 "동치"로 오인된다.
 */
export async function replayVerdicts(payload: SimPayload): Promise<number> {
  const byApi = new Map(ENGINE_PROBES.map((p) => [p.api, p]));
  let replayed = 0;
  for (const { api, verdict } of payload.verdicts) {
    const probe = byApi.get(api);
    if (!probe) {
      throw new Error(`정본 ENGINE_PROBES에 없는 api: ${api} — 프로브 정의와 입력이 어긋났습니다.`);
    }
    const settled =
      verdict.ok === true
        ? { ok: true as const, value: (verdict.value ?? {}) as Record<string, unknown> }
        : { ok: false as const, errorName: verdict.errorName ?? 'UnknownProbeFailure' };
    await captureProbeVerdict(probe, settled);
    replayed++;
  }
  return replayed;
}

/** 입력 파일을 읽어 replay하고, `<outDir>/engine.<sdkLine>.ios-sim.json`으로 flush한다. */
export async function replayEngineSimFile(inputPath: string, outDir: string): Promise<number> {
  // canonical 경로가 이 실행분을 env2(ios-sim) 축으로 자기 dir에 떨어뜨리게 한다.
  // cell.platform은 첫 capture 전에 이 값을 읽어 캐시하므로 여기서 세우면 충분하다.
  process.env.AIT_CELL_PLATFORM = 'ios-sim';
  process.env.AIT_CAPTURE_DIR = outDir;
  const payload = parseSimPayload(readFileSync(resolve(inputPath), 'utf8'));
  const n = await replayVerdicts(payload);
  await flushCapture(ENGINE_CATEGORY);
  return n;
}

async function main(): Promise<void> {
  const [, , inputPath, outDirArg] = process.argv;
  if (!inputPath) {
    console.error('usage: pnpm tsx scripts/replay-engine-sim-capture.ts <in.json> [outDir]');
    process.exit(1);
  }
  const outDir = outDirArg ?? DEFAULT_OUT_DIR;
  const n = await replayEngineSimFile(inputPath, outDir);
  console.log(`engine verdict ${n}건 → ${outDir}/engine.2.x.ios-sim.json (canonical replay)`);
  console.log(`대조: pnpm diff:captures --a ${outDir} --b .ait-run/.ait-capture`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
