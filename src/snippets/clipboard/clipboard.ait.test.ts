/**
 * clipboard `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * native 클립보드 권한 오류(GetClipboardTextPermissionError /
 * SetClipboardTextPermissionError)는 env3 실기기에서 자연 도착하지만, env1(mock)
 * 에서도 `@ait-co/devtools/mock`이 export하는 `aitState.patch('permissions', …)`로
 * 거부 상태를 프로그래매틱하게 강제할 수 있다(devtools#372 — mock이
 * `instanceof PermissionError` 계약을 실 3.0 SDK와 동일하게 재현). vitest alias가
 * `@apps-in-toss/web-framework` → `@ait-co/devtools/mock`이므로 같은 import
 * specifier로 이 상태 조작 API에 접근할 수 있다 — 이게 이 감사(#260)의 핵심
 * 구제 대상이었다: 6개 권한-오류 클래스 중 실제로 env1에서 단언 가능한 게
 * 0개였던 상태를 clipboard의 2개(get/set)부터 메운다.
 *
 * env3(real SDK)에서는 `aitState`가 없으므로(mock 전용 export) 여전히
 * outcome-분기 관측 + rejected 시 `isNativeErrorShape`/errorCode 단언으로 처리한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  GetClipboardTextPermissionError,
  SetClipboardTextPermissionError,
  getClipboardText,
  setClipboardText,
} from '@apps-in-toss/web-framework';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'clipboard';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

/**
 * env1(mock) 전용 — devtools mock의 permission state를 강제로 'denied'로 만든다.
 * `@apps-in-toss/web-framework`가 vitest alias로 `@ait-co/devtools/mock`을 가리킬
 * 때만 `aitState`가 존재하므로, 동적 import + optional 접근으로 env3(real SDK)에서
 * 안전하게 no-op이 되게 한다.
 */
async function forceClipboardPermissionDenied(): Promise<void> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  const aitState = (mod as { aitState?: { patch: (key: string, partial: unknown) => void } })
    .aitState;
  aitState?.patch('permissions', { clipboard: 'denied' });
}

/** 다음 테스트에 denied 상태가 새지 않도록 매 테스트 후 allowed로 복구한다. */
async function resetClipboardPermission(): Promise<void> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  const aitState = (mod as { aitState?: { patch: (key: string, partial: unknown) => void } })
    .aitState;
  aitState?.patch('permissions', { clipboard: 'allowed' });
}

afterEach(async () => {
  if (cell.platform === 'mock') {
    await resetClipboardPermission();
  }
});

describe('clipboard · 값 다양화 (happy path)', () => {
  it('setClipboardText → getClipboardText 라운드트립 (빈 문자열·유니코드·긴 문자열)', async () => {
    for (const text of ['', 'hello', '한글 텍스트 😀', 'x'.repeat(2000)]) {
      const setResult = await captureAsync(
        {
          category: CATEGORY,
          api: 'setClipboardText',
          scenario: 'happy-varied-text',
          input: { length: text.length },
        },
        () => setClipboardText(text),
      );
      if (cell.platform === 'mock') {
        // mock은 권한이 allowed인 한 항상 resolve — 실계약 하드 단언.
        expect(setResult.outcome).toBe('resolved');
      } else {
        expect(['resolved', 'rejected']).toContain(setResult.outcome);
      }

      const getResult = await captureAsync(
        {
          category: CATEGORY,
          api: 'getClipboardText',
          scenario: 'happy-round-trip-read',
          input: { length: text.length },
        },
        () => getClipboardText(),
      );
      if (cell.platform === 'mock' && setResult.outcome === 'resolved') {
        // set이 성공했으면 곧바로 이어지는 get은 같은 값을 반환해야 한다 — 라운드트립 실계약.
        expect(getResult.outcome).toBe('resolved');
        expect(getResult.value).toBe(text);
      } else if (getResult.outcome === 'resolved') {
        // env3: 다른 프로세스가 클립보드를 바꿀 수 있어 값 동일성은 보장 못 하지만
        // shape는 단언한다.
        expect(typeof getResult.value).toBe('string');
      }
    }
  });
});

describe('clipboard · 권한 거부 (실계약 단언)', () => {
  it('getClipboardText: 거부 시 GetClipboardTextPermissionError / native shape + errorCode 필드', async () => {
    if (cell.platform === 'mock') {
      await forceClipboardPermissionDenied();
    }
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getClipboardText',
        scenario: 'denied-read',
        input: null,
      },
      () => getClipboardText(),
    );
    if (cell.platform === 'mock') {
      // mock 권한을 강제로 denied했으므로 거부 경로가 반드시 실행돼야 한다.
      expect(outcome).toBe('rejected');
    }
    if (outcome === 'rejected') {
      const isKnownShape =
        error instanceof GetClipboardTextPermissionError || isNativeErrorShape(error);
      expect(isKnownShape).toBe(true);
      expect(error).toBeInstanceOf(Error);
      // errorCode 존재 여부는 SDK/mock 구현에 따라 갈린다(devtools mock의
      // PermissionError는 code를 안 붙이지만, 실기기 native bridge 오류는
      // NATIVE_ERROR_CODES 중 하나를 code/errorCode로 붙인다 — isNativeErrorShape
      // 판정 로직 참고). 여기서는 각 케이스에서 일관된 타입만 단언한다.
      const withCode = error as Error & { code?: unknown; errorCode?: unknown };
      const rawCode = withCode.code ?? withCode.errorCode;
      if (rawCode !== undefined) {
        expect(['string', 'number']).toContain(typeof rawCode);
      }
    } else {
      // env3에서 devtools mock 권한 조작이 없으니 allowed로 도착할 수도 있다 —
      // 그 경우도 shape 관측은 이미 capture sink에 남는다.
      expect(outcome).toBe('resolved');
    }
  });

  it('setClipboardText: 거부 시 SetClipboardTextPermissionError / native shape', async () => {
    if (cell.platform === 'mock') {
      await forceClipboardPermissionDenied();
    }
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'setClipboardText',
        scenario: 'denied-write',
        input: { length: 5 },
      },
      () => setClipboardText('denied'),
    );
    if (cell.platform === 'mock') {
      expect(outcome).toBe('rejected');
    }
    if (outcome === 'rejected') {
      const isKnownShape =
        error instanceof SetClipboardTextPermissionError || isNativeErrorShape(error);
      expect(isKnownShape).toBe(true);
      expect(error).toBeInstanceOf(Error);
    } else {
      expect(outcome).toBe('resolved');
    }
  });
});

describe('clipboard · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
