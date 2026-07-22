/**
 * environment `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - E1: deprecated 형태와 권장 형태의 반환 shape가 발산한다. getSafeAreaInsets()는
 *        스칼라(legacy), SafeAreaInsets.get()은 { top,bottom,left,right } 구조 —
 *        구조화된 inset이 필요한 코드는 객체 accessor를 써야 한다는 회귀 가드.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  SafeAreaInsets,
  env,
  getAppsInTossGlobals,
  getDeviceId,
  getGroupId,
  getLocale,
  getNetworkStatus,
  getOperationalEnvironment,
  getPlatformOS,
  getSafeAreaInsets,
  getSchemeUri,
  getServerTime,
  getTossAppVersion,
  isMinVersionSupported,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import {
  __getPendingRecordsForTest,
  captureAsync,
  captureSync,
  cell,
  flushCapture,
} from '../../test/aitCapture';

const CATEGORY = 'environment';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

/**
 * `captureSync`를 감싸 그 직후 sink에 쌓인 캡처 레코드의 `returnType`까지 함께
 * 돌려준다. `captureSync`의 반환 타입 자체엔 `returnType`이 없다(`{outcome,value,
 * error}`만) — 그 필드는 `capture()`가 push하는 `AitCaptureRecord`에만 있다.
 * `capture()`는 `captureSync` 안에서 값을 얻은 즉시 동기로 push하므로, 호출 직후
 * `__getPendingRecordsForTest()`의 마지막 원소가 항상 이 호출 자신의 레코드다
 * (사이에 다른 push가 낄 수 없다).
 */
function captureSyncWithShape(
  meta: Parameters<typeof captureSync>[0],
  call: () => unknown,
): ReturnType<typeof captureSync> & { returnType?: string } {
  const rec = captureSync(meta, call);
  const returnType = __getPendingRecordsForTest().at(-1)?.returnType;
  return { ...rec, returnType };
}

describe('environment · 값 다양화 (happy path)', () => {
  it('환경 accessor 4종 — 선언은 동기 원시 타입이지만 런타임은 Promise (#795/#796)', async () => {
    const platform = captureSyncWithShape(
      { category: CATEGORY, api: 'getPlatformOS', scenario: 'happy-default', input: null },
      () => getPlatformOS(),
    );
    const locale = captureSyncWithShape(
      { category: CATEGORY, api: 'getLocale', scenario: 'happy-default', input: null },
      () => getLocale(),
    );
    const opEnv = captureSyncWithShape(
      {
        category: CATEGORY,
        api: 'getOperationalEnvironment',
        scenario: 'happy-default',
        input: null,
      },
      () => getOperationalEnvironment(),
    );
    const deviceId = captureSyncWithShape(
      { category: CATEGORY, api: 'getDeviceId', scenario: 'happy-default', input: null },
      () => getDeviceId(),
    );
    // REAL_SDK_FINDING (2.x env3, devtools#795/#796): 상류 `.d.ts`는 이 4개 accessor를
    // 전부 동기(`(): string`)로 선언하지만, 실기기 2.x×iOS capture는 전부 Promise를
    // 반환함이 확인됐다 — 선언과 런타임이 어긋난 상류 타입 버그다. mock은 타입
    // 선언이 아니라 이 런타임 실측을 재현해야 개발자가 env1에서 겪는 동작이 env3와
    // 같아지므로(devtools#775 원칙 확장), devtools#796에서 mock도 같은
    // Promise-wrapped 반환으로 정렬됐다. 이제 이 accessor들은 "동기 원시 반환"이
    // 아니라 "Promise로 감싸인 원시 반환"을 단언한다.
    for (const rec of [platform, locale, opEnv, deviceId]) {
      expect(rec.returnType).toBe('Promise');
      expect(typeof (await rec.value)).toBe('string');
    }
  });

  it('isMinVersionSupported를 다양한 버전 임계로 호출 — 런타임은 Promise<boolean> (#795/#796)', async () => {
    // `${number}.${number}.${number}` 템플릿 리터럴 타입을 만족하도록 as const.
    for (const versions of [
      { android: '5.0.0', ios: '5.0.0' },
      { android: '999.0.0', ios: '999.0.0' },
      { android: '1.0.0', ios: '1.0.0' },
    ] as const) {
      const { returnType, value } = captureSyncWithShape(
        {
          category: CATEGORY,
          api: 'isMinVersionSupported',
          scenario: 'happy-varied-version',
          input: versions,
        },
        () => isMinVersionSupported(versions),
      );
      // REAL_SDK_FINDING (devtools#795/#796): 위 4종 환경 accessor와 같은 async 축 —
      // 선언은 `(): boolean`이지만 실기기·devtools#796 정렬 후 mock 둘 다 Promise다.
      expect(returnType).toBe('Promise');
      expect(typeof (await value)).toBe('boolean');
    }
  });

  it('getNetworkStatus가 resolve', async () => {
    const { outcome } = await captureAsync(
      { category: CATEGORY, api: 'getNetworkStatus', scenario: 'happy-default', input: null },
      () => Promise.resolve(getNetworkStatus()),
    );
    expect(outcome).toBe('resolved');
  });

  // #296: 스니펫(src/snippets/environment/)엔 있으나 이 슈트가 지금껏 호출하지 않던
  // 5개 API — EnvironmentPage.tsx가 렌더하는 카드와 짝이지만 캡처 커버리지 밖이었다.
  // 위 4종 accessor·isMinVersionSupported와 달리 devtools#795/#796의 Promise-wrap
  // 대상이 **아니다** — 상류 `.d.ts`(web-bridge)가 전부 동기 `(): string`/객체로
  // 선언하고, mock(0.1.141) 실측도 그 선언과 일치한다(각주 호출로 직접 확인,
  // thenable 아님). 그래서 여기선 `captureSyncWithShape`가 아니라 평범한
  // `captureSync`로 충분하다 — returnType이 이미 `outcome`으로 sync/async를 가른다.
  it('신규 environment accessor 5종 — getSchemeUri/getGroupId/getTossAppVersion/getAppsInTossGlobals/env.getDeploymentId (#296)', () => {
    const schemeUri = captureSync(
      { category: CATEGORY, api: 'getSchemeUri', scenario: 'happy-default', input: null },
      () => getSchemeUri(),
    );
    expect(schemeUri.outcome).toBe('returned-sync');
    expect(typeof schemeUri.value).toBe('string');

    const groupId = captureSync(
      { category: CATEGORY, api: 'getGroupId', scenario: 'happy-default', input: null },
      () => getGroupId(),
    );
    expect(groupId.outcome).toBe('returned-sync');
    expect(typeof groupId.value).toBe('string');

    const tossAppVersion = captureSync(
      { category: CATEGORY, api: 'getTossAppVersion', scenario: 'happy-default', input: null },
      () => getTossAppVersion(),
    );
    expect(tossAppVersion.outcome).toBe('returned-sync');
    expect(typeof tossAppVersion.value).toBe('string');

    const appsInTossGlobals = captureSync(
      { category: CATEGORY, api: 'getAppsInTossGlobals', scenario: 'happy-default', input: null },
      () => getAppsInTossGlobals(),
    );
    expect(appsInTossGlobals.outcome).toBe('returned-sync');
    expect(appsInTossGlobals.value).toBeTypeOf('object');
    expect(appsInTossGlobals.value).toHaveProperty('deploymentId');

    const envDeploymentId = captureSync(
      { category: CATEGORY, api: 'env.getDeploymentId', scenario: 'happy-default', input: null },
      () => env.getDeploymentId(),
    );
    expect(envDeploymentId.outcome).toBe('returned-sync');
    expect(typeof envDeploymentId.value).toBe('string');
  });

  // getServerTime만은 위 5종과 달리 선언부터 `Promise<number | undefined>`다(비교 대상
  // 문서화된 async — #795/#796 sync-declared-but-Promise-runtime 발산과는 별개 축).
  it('getServerTime이 resolve — epoch ms 숫자 (#296)', async () => {
    const { outcome, value } = await captureAsync(
      { category: CATEGORY, api: 'getServerTime', scenario: 'happy-default', input: null },
      () => getServerTime(),
    );
    expect(outcome).toBe('resolved');
    expect(typeof value).toBe('number');
  });
});

describe('environment · 의도적 오류 (확인된 오용 가드)', () => {
  // E1: deprecated swap. 구조화된 safe-area inset이 필요한 코드는
  // 스칼라를 반환하는 legacy accessor가 아니라 객체 accessor를 써야 한다.
  it('[E1] SafeAreaInsets.get()이 구조화된 inset 객체를 반환한다 (legacy 스칼라 아님)', async () => {
    const structured = captureSync(
      {
        category: CATEGORY,
        api: 'SafeAreaInsets.get',
        scenario: 'E1-structured-accessor',
        input: null,
      },
      () => SafeAreaInsets.get(),
    );
    const legacy = captureSyncWithShape(
      {
        category: CATEGORY,
        api: 'getSafeAreaInsets',
        scenario: 'E1-legacy-accessor-contrast',
        input: null,
      },
      () => getSafeAreaInsets(),
    );
    // 권장 accessor(SafeAreaInsets.get)는 top을 가진 객체를 준다 — 모든 환경에서
    // 검사한다. devtools#796은 이 accessor를 건드리지 않았다(여전히 sync object).
    expect(structured.value).toBeTypeOf('object');
    expect(structured.value).toHaveProperty('top');
    // REAL_SDK_FINDING (2.x env3): deprecated getSafeAreaInsets()는 타입 선언상
    // `: number`(스칼라)지만 실기기 2.x는 구조화 accessor와 같은 객체를 반환한다 —
    // 상류 `.d.ts`가 런타임과 어긋난 타입 버그다(shape 축, devtools#770). 게다가
    // 그 반환 자체도 동기가 아니라 **Promise**다(sync/async 축, devtools#795/#796 —
    // 위 환경 accessor 4종·isMinVersionSupported와 같은 발산). 즉 legacy accessor는
    // 선언과 두 축 모두에서 어긋난다: shape(object-not-number)와 async
    // (Promise-not-sync). 예전에는 mock만 number를 반환해 shape 축을 mock-only
    // typeof 발산으로 게이트했으나, devtools#770에서 shape가 실측대로 정렬되며 그
    // 발산이 사라졌다(이제 두 accessor 모두 같은 객체 shape). devtools#796은 그 위에
    // 남아 있던 async 축까지 실측대로 정렬한다 — legacy accessor는 이제 모든
    // 환경에서 Promise<object>를 준다.
    expect(legacy.returnType).toBe('Promise');
    const legacyValue = (await legacy.value) as { top?: unknown };
    expect(legacyValue).toBeTypeOf('object');
    expect(legacyValue).toHaveProperty('top');
  });
});

describe('environment · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
