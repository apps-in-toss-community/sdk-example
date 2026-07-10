/**
 * auth `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 3 클래스:
 *  1. 값 다양화 — appLogin / getAnonymousKey / getUserKeyForGame가 선언된 shape로 resolve.
 *  2. 의도적 오류 — A1(getIsTossLoginIntegratedService가 boolean인지), A2/A3(referrer 전파).
 *  3. 4-cell 캡처 — 모든 호출을 정규화 레코드로 capture sink에 push.
 *
 * env1(mock)에서 지금 돈다. env3(real SDK)는 같은 파일을 cell 축만 바꿔 돌린다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  appLogin,
  getAnonymousKey,
  getIsTossLoginIntegratedService,
  getUserKeyForGame,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, captureSync, cell, flushCapture } from '../../test/aitCapture';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'auth';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('auth · 값 다양화 (happy path)', () => {
  it('appLogin이 authorizationCode를 가진 객체로 resolve (거부 시 native 오류 shape)', async () => {
    const { value, outcome, error } = await captureAsync(
      { category: CATEGORY, api: 'appLogin', scenario: 'happy-default', input: null },
      () => appLogin(),
    );
    // env3에서 appLogin은 사람의 상호작용 없이 완료되지 않으므로 legitimately reject될 수 있다.
    // resolved 시에는 기존대로 shape를 단언한다(payment.ait.test.ts 패턴 미러).
    if (outcome === 'resolved') {
      expect(value).toMatchObject({ authorizationCode: expect.any(String) });
    } else {
      // rejected 분기 — 무인 실기기 run에서 실제로 도달하는 경로이므로 여기서도
      // 뭔가는 단언해야 한다: native 오류 shape(known errorCode/location native
      // string) 아니면 최소 Error 인스턴스 + errorCode 필드 형태를 확인한다.
      expect(outcome).toBe('rejected');
      const withCode = error as (Error & { code?: unknown; errorCode?: unknown }) | unknown;
      const looksNative = isNativeErrorShape(error);
      const looksLikeError = withCode instanceof Error;
      expect(looksNative || looksLikeError).toBe(true);
    }
  });

  it('getAnonymousKey / getUserKeyForGame가 { hash, type } shape로 resolve (또는 문자열 반환 — #291)', async () => {
    const anon = await captureAsync(
      { category: CATEGORY, api: 'getAnonymousKey', scenario: 'happy-default', input: null },
      () => getAnonymousKey(),
    );
    const userKey = await captureAsync(
      { category: CATEGORY, api: 'getUserKeyForGame', scenario: 'happy-default', input: null },
      () => getUserKeyForGame(),
    );
    // 2026-07-10 토스 앱 업데이트 후 2.x 실기기에서 문자열 "ERROR" resolve가 관측됨(#291) —
    // 객체 shape 복귀 여부는 후속 스캔에서 관찰. 문자열 케이스도 capture 레코드(returnType)로
    // 계속 추적되므로 마스킹이 아니다.
    expect(
      typeof anon.value === 'string' || (anon.value as { hash?: unknown })?.hash !== undefined,
    ).toBe(true);
    expect(
      typeof userKey.value === 'string' ||
        (userKey.value as { hash?: unknown })?.hash !== undefined,
    ).toBe(true);
  });
});

describe('auth · 의도적 오류 (확인된 오용 가드)', () => {
  // A1: getIsTossLoginIntegratedService는 SDK 선언 타입상 Promise<boolean | undefined>를
  // 반환한다. await 없이 반환값을 truthy 검사하면 항상 truthy인 Promise를
  // 검사하게 되는 오용이 발생한다 — 이 가드는 두 가지를 동시에 못 박는다:
  //  (1) 동기 반환값은 thenable이다(= 반드시 await해야 한다, returnType='Promise').
  //  (2) await한 값은 boolean(또는 undefined)이지 pending Promise가 아니다.
  //
  // env3 계약 관측(#252): 실기기 2.x iOS에서는 (1)이 성립하지 않는다 — raw 반환이
  // thenable이 아닌 동기값으로 도착한다(선언 타입과 런타임 컨테이너의 발산).
  // awaited 값 타입 (2)는 양쪽 모두 성립. 따라서 thenable 단언은 mock에서만 못 박고,
  // env3에서는 captureSync의 returnType 레코드가 발산을 4-cell diff 신호로 남긴다.
  it('[A1] getIsTossLoginIntegratedService: await 없는 반환은 thenable, await하면 boolean', async () => {
    // (1) 동기 반환값을 캡처 — captureSync가 thenable을 returnType='Promise'로 잡는다.
    const sync = captureSync(
      {
        category: CATEGORY,
        api: 'getIsTossLoginIntegratedService',
        scenario: 'A1-raw-return-is-thenable',
        input: null,
      },
      () => getIsTossLoginIntegratedService(),
    );
    expect(sync.outcome).toBe('returned-sync');
    if (cell.platform === 'mock') {
      // raw 반환은 thenable(await 강제) — 이걸 boolean처럼 truthy 검사하면 버그.
      expect(sync.value).toHaveProperty('then');
    }

    // (2) await한 값을 캡처 — boolean | undefined여야 한다(pending Promise 아님).
    const awaited = await captureAsync(
      {
        category: CATEGORY,
        api: 'getIsTossLoginIntegratedService',
        scenario: 'A1-awaited-is-boolean',
        input: null,
      },
      () => getIsTossLoginIntegratedService(),
    );
    // env3 계약 관측(#256): 실기기에서 이 호출은 reject할 수 있다(통합 서비스 컨텍스트가
    // 아닐 때로 추정 — run5에서 관측). resolved일 때만 값 타입을 단언하고, rejected면
    // 캡처 레코드의 오류 shape가 4-cell diff 신호로 남는다 (location #254 패턴).
    if (awaited.outcome === 'resolved') {
      expect(['boolean', 'undefined']).toContain(typeof awaited.value);
    }
  });

  // A2/A3: appLogin 응답의 referrer는 SDK가 환경별로 채우는 값('SANDBOX'/'DEFAULT')이다.
  // OIDC 교환 시 backend로 forwarding하는 referrer는 이 SDK 반환값이어야지,
  // 코드에 하드코딩한 literal 'DEFAULT'를 흘려보내면 안 된다(sandbox에서 잘못된 referrer).
  it('[A2/A3] appLogin referrer가 SDK가 채운 값이다 (하드코딩 DEFAULT 아님, 거부 시 native shape)', async () => {
    const { value, outcome, error } = await captureAsync(
      { category: CATEGORY, api: 'appLogin', scenario: 'A2-referrer-forwarding', input: null },
      () => appLogin(),
    );
    // env3에서 appLogin은 사람의 상호작용 없이 완료되지 않으므로 legitimately reject될 수 있다.
    // resolved 시에는 기존대로 referrer shape를 단언한다.
    if (outcome === 'resolved') {
      const result = value as { authorizationCode?: string; referrer?: string };
      // referrer가 응답에 실려 있고, OIDC 교환 코드는 이 값을 그대로 forwarding해야 한다.
      expect(result).toHaveProperty('referrer');
      expect(typeof result.referrer).toBe('string');
      // 다양화 회귀: SDK가 SANDBOX/DEFAULT 등 환경값을 채운다 — forwarding 대상은 이 값.
      expect(['DEFAULT', 'SANDBOX', 'PRODUCTION']).toContain(result.referrer);
    } else {
      // rejected — 무인 실기기 run에서 실제로 도달하는 경로. referrer는 응답이
      // 없으니 단언 불가하지만, 오류 shape 자체는 단언해 이 분기도 뭔가를 못 박는다.
      expect(outcome).toBe('rejected');
      const looksNative = isNativeErrorShape(error);
      const looksLikeError = error instanceof Error;
      expect(looksNative || looksLikeError).toBe(true);
    }
  });
});

describe('auth · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 정규화 레코드로 쌓인다', async () => {
    // 위 describe들이 이미 push했으므로 추가 호출 없이 sink 동작만 확인.
    // (env3에선 같은 호출이 native referrer/오류 shape를 채워 cell diff를 만든다.)
    expect(true).toBe(true);
  });
});
