/**
 * 프로브 페이지 생성기의 계약 — 이 rung 전체가 기대는 두 불변식을 지킨다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_PROBES } from '../src/test/engineProbes';

function generate(): string {
  const out = join(mkdtempSync(join(tmpdir(), 'ait-probe-')), 'page.html');
  execFileSync('pnpm', ['exec', 'tsx', 'scripts/build-engine-probe-page.ts', out], {
    cwd: join(__dirname, '..'),
    stdio: 'pipe',
  });
  return readFileSync(out, 'utf8');
}

describe('engine 프로브 페이지 생성기', () => {
  const html = generate();

  it('정본의 프로브를 하나도 빠뜨리지 않는다', () => {
    for (const probe of ENGINE_PROBES) {
      expect(html, `${probe.api}가 페이지에 없다`).toContain(probe.api);
    }
    // api 문자열이 정확히 프로브 수만큼 등장한다 — 중복 주입/누락을 함께 잡는다.
    const injected = html.match(/api: "engine\./g) ?? [];
    expect(injected).toHaveLength(ENGINE_PROBES.length);
  });

  it('페이지의 프로브가 정본과 같은 판정을 낸다 — 손으로 쓴 사본이 아니다', () => {
    // 이 rung의 측정이 "엔진 차이"를 재려면 페이지의 프로브가 정본과 같아야 한다.
    // 바이트 동일로는 검증할 수 없다 — 생성기(tsx)와 이 테스트(vitest)의
    // 트랜스파일러가 서로 다르게 출력하므로 문자열 대조는 트랜스파일러 차이를
    // 잡을 뿐이다. 그래서 **양쪽을 같은 환경에서 실행해 verdict를 대조**한다.
    const source = html.match(/var PROBES = \[([\s\S]*?)\n {6}\];/);
    expect(source, 'PROBES 배열을 페이지에서 찾지 못했다').not.toBeNull();

    const pageProbes = new Function(`return [${source?.[1]}]`)() as typeof ENGINE_PROBES;
    expect(pageProbes.map((p) => p.api)).toEqual(ENGINE_PROBES.map((p) => p.api));

    for (const [i, probe] of ENGINE_PROBES.entries()) {
      const canonical = probe.run();
      const fromPage = pageProbes[i]?.run();
      expect(fromPage, `${probe.api}의 판정이 정본과 다르다`).toEqual(canonical);
    }
  });

  it('프로브가 self-contained라 페이지에서 그대로 실행된다', () => {
    // 프로브가 모듈 스코프 식별자를 클로저로 잡으면 페이지에서 ReferenceError가
    // 난다. import/require/모듈 헬퍼 참조가 직렬화 결과에 새어들지 않는지 본다 —
    // 이 rung과 Playwright 경로가 함께 기대는 제약이라 여기서 못박는다.
    for (const probe of ENGINE_PROBES) {
      const body = probe.run.toString();
      expect(body, `${probe.api}가 import를 참조한다`).not.toMatch(/\bimport\s*\(|\brequire\s*\(/);
      expect(body, `${probe.api}가 모듈 스코프 식별자를 참조한다`).not.toMatch(
        /\b(captureAsync|ENGINE_PROBES|ENGINE_CATEGORY|ENGINE_SCENARIO|namedError|settleProbeVerdict)\b/,
      );
    }
  });
});
