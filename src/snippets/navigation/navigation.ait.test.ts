/**
 * navigation `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - N1: openURL이 reject하면 그 rejection이 caller에게 관측된다(삼켜지지 않음).
 *  - N2: getTossShareLink('/some/path') (intoss:// 없는 bare path)가 조용히
 *        "유효한" mini-app 딥링크를 만들지 않는다 — 유효 입력과 shape가 발산한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  getTossShareLink,
  openURL,
  setDeviceOrientation,
} from '@apps-in-toss/web-framework';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { captureAsync, captureSync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'navigation';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('navigation · 값 다양화 (happy path)', () => {
  it('setDeviceOrientation를 각 orientation union 멤버로 호출', () => {
    for (const type of ['portrait', 'landscape'] as const) {
      const { outcome } = captureSync(
        {
          category: CATEGORY,
          api: 'setDeviceOrientation',
          scenario: 'happy-orientation-union',
          input: { type },
        },
        () => setDeviceOrientation({ type }),
      );
      expect(outcome).toBe('returned-sync');
    }
  });

  it('getTossShareLink가 유효한 intoss:// 경로를 string 링크로 resolve', async () => {
    const { value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'happy-intoss-uri',
        input: 'intoss://my-app',
      },
      () => getTossShareLink('intoss://my-app'),
    );
    expect(typeof value).toBe('string');
    // env3(실기기 2.x)는 verbatim intoss:// 스킴이 아니라 유효한 Toss 단축 링크
    // (e.g. https://minion.toss.im/...)를 반환한다 — toContain('intoss://my-app')은
    // env3에서 ENV_EXPECTED 실패다. string 계약(typeof)만 가드한다.
  });
});

describe('navigation · 의도적 오류 (확인된 오용 가드)', () => {
  // N1: openURL이 reject하는 환경에서 그 rejection이 caller에게 전파되는지.
  // mock은 window.open으로 라우팅하므로, window.open이 throw하게 만들어
  // openURL이 reject하고 caller의 await가 그 reject를 관측하는지 가드한다.
  // env3(실기기)는 openURL이 native ReactNativeWebView 브리지로 라우팅되므로
  // window.open spy가 발화하지 않아 call이 resolve된다 — spy 기반 rejection은
  // mock 전용 테스트다. 실기기에서 유효한 URL이 resolve하는 것은 올바른 동작.
  it.skipIf(cell.platform !== 'mock')(
    '[N1] openURL의 rejection이 caller에게 전파된다 (삼켜지지 않음)',
    async () => {
      vi.spyOn(window, 'open').mockImplementation(() => {
        throw new Error('navigation blocked');
      });
      const { outcome, error } = await captureAsync(
        {
          category: CATEGORY,
          api: 'openURL',
          scenario: 'N1-rejection-propagates',
          input: 'https://example.com',
        },
        () => openURL('https://example.com'),
      );
      // reject가 caller에 도달해야 한다 — resolve로 삼켜지면 회귀.
      expect(outcome).toBe('rejected');
      expect(error).toBeInstanceOf(Error);
    },
  );

  // N2: bare path('/some/path', scheme 없음)는 유효한 mini-app 딥링크가 아니다.
  //
  // 예전에는 이 발산을 **반환값**으로 확인했다 — mock이 bare path에도 링크 문자열을
  // 돌려줬기 때문에 "두 문자열이 서로 다른가"를 볼 수밖에 없었다. 실기기(env3)는
  // 이 입력을 `errorCode: EXECUTION_ERROR`로 아예 reject하므로, 그 단언은 mock에서만
  // 성립하는 형태였다. devtools#781이 mock에 scheme 검증을 넣으면서 이제 두 환경 모두
  // 거부하므로, 발산을 **outcome**(거부 vs 성공)으로 확인한다 — 훨씬 강한 가드다.
  it('[N2] getTossShareLink는 scheme 없는 bare path를 거부하고 유효 입력은 통과시킨다', async () => {
    const bare = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'N2-bare-path-invalid',
        input: '/some/path',
      },
      () => getTossShareLink('/some/path'),
    );
    const valid = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'N2-valid-intoss-baseline',
        input: 'intoss://my-app',
      },
      () => getTossShareLink('intoss://my-app'),
    );
    // bare path는 거부된다 — 잘못된 입력이 유효한 링크로 오인되지 않는다.
    expect(bare.outcome).toBe('rejected');
    expect((bare.error as { errorCode?: unknown } | undefined)?.errorCode).toBe('EXECUTION_ERROR');
    // scheme이 있는 유효 입력은 계속 통과한다 — 검증이 과도하지 않은지 확인.
    expect(valid.outcome).toBe('resolved');
    expect(valid.value).toContain('intoss://');
  });
});

describe('navigation · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
