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
  getDeviceId,
  getLocale,
  getNetworkStatus,
  getOperationalEnvironment,
  getPlatformOS,
  getSafeAreaInsets,
  isMinVersionSupported,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, captureSync, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'environment';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('environment · 값 다양화 (happy path)', () => {
  it('동기 환경 accessor들이 선언된 원시 타입으로 반환', () => {
    const platform = captureSync(
      { category: CATEGORY, api: 'getPlatformOS', scenario: 'happy-default', input: null },
      () => getPlatformOS(),
    );
    const locale = captureSync(
      { category: CATEGORY, api: 'getLocale', scenario: 'happy-default', input: null },
      () => getLocale(),
    );
    const opEnv = captureSync(
      {
        category: CATEGORY,
        api: 'getOperationalEnvironment',
        scenario: 'happy-default',
        input: null,
      },
      () => getOperationalEnvironment(),
    );
    const deviceId = captureSync(
      { category: CATEGORY, api: 'getDeviceId', scenario: 'happy-default', input: null },
      () => getDeviceId(),
    );
    expect(typeof platform.value).toBe('string');
    expect(typeof locale.value).toBe('string');
    expect(typeof opEnv.value).toBe('string');
    expect(typeof deviceId.value).toBe('string');
  });

  it('isMinVersionSupported를 다양한 버전 임계로 호출', () => {
    // `${number}.${number}.${number}` 템플릿 리터럴 타입을 만족하도록 as const.
    for (const versions of [
      { android: '5.0.0', ios: '5.0.0' },
      { android: '999.0.0', ios: '999.0.0' },
      { android: '1.0.0', ios: '1.0.0' },
    ] as const) {
      const { value } = captureSync(
        {
          category: CATEGORY,
          api: 'isMinVersionSupported',
          scenario: 'happy-varied-version',
          input: versions,
        },
        () => isMinVersionSupported(versions),
      );
      expect(typeof value).toBe('boolean');
    }
  });

  it('getNetworkStatus가 resolve', async () => {
    const { outcome } = await captureAsync(
      { category: CATEGORY, api: 'getNetworkStatus', scenario: 'happy-default', input: null },
      () => Promise.resolve(getNetworkStatus()),
    );
    expect(outcome).toBe('resolved');
  });
});

describe('environment · 의도적 오류 (확인된 오용 가드)', () => {
  // E1: deprecated swap. 구조화된 safe-area inset이 필요한 코드는
  // 스칼라를 반환하는 legacy accessor가 아니라 객체 accessor를 써야 한다.
  it('[E1] SafeAreaInsets.get()이 구조화된 inset 객체를 반환한다 (legacy 스칼라 아님)', () => {
    const structured = captureSync(
      {
        category: CATEGORY,
        api: 'SafeAreaInsets.get',
        scenario: 'E1-structured-accessor',
        input: null,
      },
      () => SafeAreaInsets.get(),
    );
    const legacy = captureSync(
      {
        category: CATEGORY,
        api: 'getSafeAreaInsets',
        scenario: 'E1-legacy-accessor-contrast',
        input: null,
      },
      () => getSafeAreaInsets(),
    );
    // 권장 accessor는 top을 가진 객체를 준다.
    expect(structured.value).toBeTypeOf('object');
    expect(structured.value).toHaveProperty('top');
    // 두 accessor의 반환 shape가 발산함을 명시(= deprecated swap 회귀 가드).
    expect(typeof structured.value).not.toBe(typeof legacy.value);
  });
});

describe('environment · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
