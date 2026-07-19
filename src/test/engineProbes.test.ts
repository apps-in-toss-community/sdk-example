/**
 * `engineProbes.ts`의 **polyfill 투명성** 단위 테스트.
 *
 * 왜 별도 파일이 필요한가: `engine.ait.test.ts`의 `SHIM_TARGET_APIS` 게이트는
 * polyfill이 실제로 로드된 환경(env3)에서만 의미 있게 발화한다. CI가 도는
 * jsdom에는 `navigator.share`/`vibrate`/`clipboard`가 아예 없어 세 프로브가
 * 전부 reject되므로, 그 게이트도 백업 키 경로도 CI에서 **한 번도 실행되지
 * 않는다**. 즉 상류 polyfill이 `Symbol.for(...)` 키 이름을 바꿔도 실기기 run을
 * 돌리기 전까지는 아무도 모른다.
 *
 * 그래서 여기서 백업 키를 손으로 심어 세 프로브의 분기를 직접 구동한다.
 * 핵심 케이스는 "shim이 슬롯을 덮고 있지만 엔진은 지원하지 않는" 상황이다 —
 * `navigator.share`가 (polyfill shim이라) 함수인데도 프로브는 **거부**해야
 * 한다. 그게 안 되면 프로브는 다시 "polyfill 설치 여부"를 재게 된다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ENGINE_PROBES } from './engineProbes';

const VIBRATE_BACKUP = Symbol.for('@ait-co/polyfill/vibrate.original');
const SHARE_BACKUP = Symbol.for('@ait-co/polyfill/share.original');
const CLIPBOARD_BACKUP = Symbol.for('@ait-co/polyfill/clipboard.original');

/** polyfill이 `host = navigator`에 백업을 심는 것과 같은 형태로 흉내낸다. */
const navAny = navigator as unknown as Record<symbol | string, unknown>;

function probeFor(api: string) {
  const probe = ENGINE_PROBES.find((p) => p.api === api);
  if (!probe) {
    throw new Error(`probe not found: ${api}`);
  }
  return probe;
}

afterEach(() => {
  // 심어둔 백업 키와 shim 흉내를 모두 걷어낸다 — 다른 테스트 파일로 새면
  // 프로브 결과가 오염된다.
  delete navAny[VIBRATE_BACKUP];
  delete navAny[SHARE_BACKUP];
  delete navAny[CLIPBOARD_BACKUP];
  delete navAny.vibrate;
  delete navAny.share;
  delete navAny.clipboard;
});

describe('engineProbes · polyfill 투명성 (백업 키 경유)', () => {
  describe('engine.vibrate', () => {
    it('백업 키가 없으면 navigator를 직접 읽는다', () => {
      navAny.vibrate = () => true;
      const verdict = probeFor('engine.vibrate').run();
      expect(verdict).toEqual({ ok: true, value: { available: true, polyfillShimmed: false } });
    });

    it('백업 키가 있으면 백업값을 읽고 shim 여부를 기록한다', () => {
      navAny.vibrate = () => true; // polyfill shim (엔진 원본 아님)
      navAny[VIBRATE_BACKUP] = () => true; // 엔진 원본
      const verdict = probeFor('engine.vibrate').run();
      expect(verdict).toEqual({ ok: true, value: { available: true, polyfillShimmed: true } });
    });

    it('shim이 덮여 있어도 백업이 undefined면 미지원으로 거부한다', () => {
      // 이게 핵심 회귀 케이스다 — navigator.vibrate는 shim이라 함수지만,
      // 엔진은 지원하지 않으므로 프로브는 반드시 거부해야 한다.
      navAny.vibrate = () => true;
      navAny[VIBRATE_BACKUP] = undefined;
      const verdict = probeFor('engine.vibrate').run();
      expect(verdict).toEqual({ ok: false, errorName: 'VibrationUnsupported' });
    });
  });

  describe('engine.share', () => {
    it('백업 키가 없으면 navigator를 직접 읽는다', () => {
      navAny.share = async () => undefined;
      const verdict = probeFor('engine.share').run();
      expect(verdict).toEqual({ ok: true, value: { available: true, polyfillShimmed: false } });
    });

    it('백업 객체의 share가 함수면 지원으로 본다', () => {
      navAny.share = async () => undefined;
      navAny[SHARE_BACKUP] = { share: async () => undefined, canShare: undefined };
      const verdict = probeFor('engine.share').run();
      expect(verdict).toEqual({ ok: true, value: { available: true, polyfillShimmed: true } });
    });

    it('shim이 덮여 있어도 백업 객체의 share가 없으면 거부한다', () => {
      navAny.share = async () => undefined;
      navAny[SHARE_BACKUP] = { share: undefined, canShare: undefined };
      const verdict = probeFor('engine.share').run();
      expect(verdict).toEqual({ ok: false, errorName: 'WebShareUnsupported' });
    });
  });

  describe('engine.clipboardApi', () => {
    it('백업 키가 없으면 navigator를 직접 읽는다', () => {
      navAny.clipboard = { readText: () => {}, writeText: () => {} };
      const verdict = probeFor('engine.clipboardApi').run();
      expect(verdict).toEqual({
        ok: true,
        value: { hasRead: true, hasWrite: true, polyfillShimmed: false },
      });
    });

    it('백업 객체에서 readText/writeText 유무를 읽는다', () => {
      navAny.clipboard = { readText: () => {}, writeText: () => {} };
      navAny[CLIPBOARD_BACKUP] = { writeText: () => {} }; // 엔진 원본엔 readText 없음
      const verdict = probeFor('engine.clipboardApi').run();
      expect(verdict).toEqual({
        ok: true,
        value: { hasRead: false, hasWrite: true, polyfillShimmed: true },
      });
    });

    it('shim이 덮여 있어도 백업이 undefined면 거부한다', () => {
      navAny.clipboard = { readText: () => {}, writeText: () => {} };
      navAny[CLIPBOARD_BACKUP] = undefined;
      const verdict = probeFor('engine.clipboardApi').run();
      expect(verdict).toEqual({ ok: false, errorName: 'ClipboardApiUnsupported' });
    });
  });
});
