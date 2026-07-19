/**
 * engine 프로브를 **iOS Simulator(실 iOS WebKit)**에서 돌리기 위한 페이지 생성기.
 *
 * ─ 왜 이 rung이 필요한가 ────────────────────────────────────────────────────
 * `e2e/engine-probes.spec.ts`의 데스크톱 webkit은 env2(실기기 WebKit)의 근사치다.
 * 그 문장 자체는 맞지만 **근사가 얼마나 빗나가는지는 수치가 없었다** — env2 축을
 * chromium↔desktop-webkit으로만 재면 두 데스크톱 엔진의 차이를 잴 뿐, 실 iOS
 * WebKit과의 거리는 안 나온다. iOS Simulator는 실기기와 **같은 WebKit 빌드**를
 * 쓰므로 폰 없이 그 기준점을 만든다.
 *
 * ─ 프로브를 다시 쓰지 않는다 ────────────────────────────────────────────────
 * Playwright는 `page.evaluate(probe.run)`으로 프로브를 페이지에 보내지만
 * Simulator Safari에는 그런 채널이 없다. 그렇다고 프로브 본문을 손으로 옮겨
 * 적으면 대조가 "엔진 차이"가 아니라 "코드 차이"를 재게 되어 무효다
 * (`src/test/engineProbes.ts` 상단 "단일 정본" 참조). 그래서 정본의 `run`을
 * `Function.prototype.toString()`으로 **그대로 직렬화**해 페이지에 심는다.
 *
 * 프로브가 self-contained(모듈 스코프 식별자 미참조)라는 기존 제약이 이걸
 * 가능하게 하는 전제이고, 그 제약이 깨지면 페이지 실행 시 `ReferenceError`로
 * 즉시 드러난다.
 *
 * ─ verdict만 실어 보낸다 ────────────────────────────────────────────────────
 * 페이지는 `{ ok, ... }` verdict만 만들어 POST하고, 캡처 레코드 변환은 러너 쪽
 * 정본(`captureProbeVerdict`)이 맡는다 — Playwright 경로와 같은 구조라
 * `outcome`/`errorName`/`valueKeys`가 러너와 무관하게 같은 값이 된다.
 *
 * ─ 실행 ─────────────────────────────────────────────────────────────────────
 *   bash scripts/run-engine-probes-ios-sim.sh
 * (이 파일을 직접 부를 일은 거의 없다 — 위 드라이버가 호출한다.)
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { writeFileSync } from 'node:fs';
import { ENGINE_PROBES } from '../src/test/engineProbes';

const entries = ENGINE_PROBES.map(
  (probe) => `  { api: ${JSON.stringify(probe.api)}, run: ${probe.run.toString()} }`,
).join(',\n');

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>engine probe</title>
  </head>
  <body>
    <pre id="out">running…</pre>
    <script>
      // 아래 프로브 본문은 src/test/engineProbes.ts에서 직렬화된 것이다 — 손으로 고치지 말 것.
      var PROBES = [
${entries}
      ];

      var verdicts = [];
      for (var i = 0; i < PROBES.length; i++) {
        var probe = PROBES[i];
        var verdict;
        try {
          verdict = probe.run();
        } catch (err) {
          // 프로브는 던지지 않도록 쓰여 있다. 던졌다면 그 자체가 관측 대상이므로
          // 삼키지 않고 errorName에 실어 보낸다 (self-contained 제약 위반이면
          // 여기서 ReferenceError로 드러난다).
          var name = err && err.name ? err.name : 'unknown';
          verdict = { ok: false, errorName: 'ProbeThrew:' + name };
        }
        verdicts.push({ api: probe.api, verdict: verdict });
      }

      var payload = { userAgent: navigator.userAgent, verdicts: verdicts };
      document.getElementById('out').textContent = JSON.stringify(payload, null, 2);

      fetch('/result', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    </script>
  </body>
</html>
`;

const outPath = process.argv[2];
if (!outPath) {
  console.error('usage: tsx scripts/build-engine-probe-page.ts <out.html>');
  process.exit(1);
}
writeFileSync(outPath, html, 'utf8');
console.log(`engine probe page -> ${outPath} (${ENGINE_PROBES.length} probes)`);
