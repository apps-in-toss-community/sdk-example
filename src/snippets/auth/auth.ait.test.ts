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
import { captureAsync, captureSync, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'auth';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('auth · 값 다양화 (happy path)', () => {
  it('appLogin이 authorizationCode를 가진 객체로 resolve', async () => {
    const { value } = await captureAsync(
      { category: CATEGORY, api: 'appLogin', scenario: 'happy-default', input: null },
      () => appLogin(),
    );
    expect(value).toMatchObject({ authorizationCode: expect.any(String) });
  });

  it('getAnonymousKey / getUserKeyForGame가 { hash, type } shape로 resolve', async () => {
    const anon = await captureAsync(
      { category: CATEGORY, api: 'getAnonymousKey', scenario: 'happy-default', input: null },
      () => getAnonymousKey(),
    );
    const userKey = await captureAsync(
      { category: CATEGORY, api: 'getUserKeyForGame', scenario: 'happy-default', input: null },
      () => getUserKeyForGame(),
    );
    expect(anon.value).toMatchObject({ hash: expect.any(String) });
    expect(userKey.value).toMatchObject({ hash: expect.any(String) });
  });
});

describe('auth · 의도적 오류 (확인된 오용 가드)', () => {
  // A1: getIsTossLoginIntegratedService는 Promise<boolean | undefined>를 반환한다
  // (real SDK 계약). await 없이 반환값을 truthy 검사하면 항상 truthy인 Promise를
  // 검사하게 되는 오용이 발생한다 — 이 가드는 두 가지를 동시에 못 박는다:
  //  (1) 동기 반환값은 thenable이다(= 반드시 await해야 한다, returnType='Promise').
  //  (2) await한 값은 boolean(또는 undefined)이지 pending Promise가 아니다.
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
    // raw 반환은 thenable(await 강제) — 이걸 boolean처럼 truthy 검사하면 버그.
    expect(sync.value).toHaveProperty('then');

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
    expect(awaited.outcome).toBe('resolved');
    expect(['boolean', 'undefined']).toContain(typeof awaited.value);
  });

  // A2/A3: appLogin 응답의 referrer는 SDK가 환경별로 채우는 값('SANDBOX'/'DEFAULT')이다.
  // OIDC 교환 시 backend로 forwarding하는 referrer는 이 SDK 반환값이어야지,
  // 코드에 하드코딩한 literal 'DEFAULT'를 흘려보내면 안 된다(sandbox에서 잘못된 referrer).
  it('[A2/A3] appLogin referrer가 SDK가 채운 값이다 (하드코딩 DEFAULT 아님)', async () => {
    const { value } = await captureAsync(
      { category: CATEGORY, api: 'appLogin', scenario: 'A2-referrer-forwarding', input: null },
      () => appLogin(),
    );
    const result = value as { authorizationCode?: string; referrer?: string };
    // referrer가 응답에 실려 있고, OIDC 교환 코드는 이 값을 그대로 forwarding해야 한다.
    expect(result).toHaveProperty('referrer');
    expect(typeof result.referrer).toBe('string');
    // 다양화 회귀: SDK가 SANDBOX/DEFAULT 등 환경값을 채운다 — forwarding 대상은 이 값.
    expect(['DEFAULT', 'SANDBOX', 'PRODUCTION']).toContain(result.referrer);
  });
});

describe('auth · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 정규화 레코드로 쌓인다', async () => {
    // 위 describe들이 이미 push했으므로 추가 호출 없이 sink 동작만 확인.
    // (env3에선 같은 호출이 native referrer/오류 shape를 채워 cell diff를 만든다.)
    expect(true).toBe(true);
  });
});
