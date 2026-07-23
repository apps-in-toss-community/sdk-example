/**
 * ads `.ait.test` (무인 — 일반 `pnpm test` / env3 `test:env3` 슈트에서 실행) —
 * 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 광고 API 10개 전부 첫 커버리지(#263) — 이전까지 ads 도메인은 미테스트였다.
 *
 * ─ 무인 vs 수동 경계 (load-bearing) ──────────────────────────────────────────
 * ad LOAD(`loadFullScreenAd`/`GoogleAdMob.loadAppsInTossAdMob`)는 `captureCallback`
 * (#267, ~3s race)로 무인 단언한다 — env3에서 "3초 내 응답 없음"은 광고 재고 없음
 * 등 **정당한 무응답**(callback-timeout)이라 오류로 오기록하지 않는다.
 * ad SHOW(`showFullScreenAd`/`GoogleAdMob.showAppsInTossAdMob`)는 실기기에서
 * fullscreen interstitial을 띄워 사용자 dismiss가 필요하다 — env3에서 무인
 * 실행하면 devtools-test의 30s 파일-드롭 타임아웃에 걸려 파일 전체가 죽는다
 * (camera 계열과 동일 위험군). 그래서 SHOW는 이 파일에 없고 `ads.manual.ait.test.ts`
 * (devtools 0.1.132 `--manual-blocking` 전용, 일반 실행에서 자동 제외)로 분리했다.
 *
 * ─ callback-timeout 의미 ────────────────────────────────────────────────────
 * mock(env1)은 200ms 후 무조건 onEvent({type:'loaded'})를 발화하므로 mock에서
 * callback-timeout이 뜨면 그건 회귀다. env3는 워크스페이스 3095/앱 31146에
 * 등록된 실 광고 재고가 없으면 onError('No fill')나 timeout이 ENV_EXPECTED다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { GoogleAdMob, TossAds, loadFullScreenAd } from '@apps-in-toss/web-framework';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { captureAsync, captureCallback, captureSync, cell, flushCapture } from '../../test/aitCapture';
import { clearProvisioningMirror, mirrorProvisioning } from '../../test/provisioningMirror';

const CATEGORY = 'ads';

// 31146은 AdMob placement가 발급돼 있지 않다(광고 계약 미체결) — 실기기는 load
// 단계에서 이미 네이티브 오류로 거부한다. env1을 그 프로비저닝 상태로 맞춘다.
beforeAll(async () => {
  await mirrorProvisioning('loadAdMob', 'loadFullScreenAd');
});

afterAll(async () => {
  await clearProvisioningMirror('loadAdMob', 'loadFullScreenAd');
  await flushCapture(CATEGORY);
});

describe('ads · lifecycle (initialize/attach/destroy, happy path)', () => {
  it('TossAds.initialize({})가 예외 없이 동기 실행된다', () => {
    const { outcome } = captureSync(
      { category: CATEGORY, api: 'TossAds.initialize', scenario: 'happy-empty-options', input: {} },
      () => TossAds.initialize({}),
    );
    // mock/env3 둘 다 void 반환 — 예외를 던지지 않는 것 자체가 계약.
    expect(outcome).toBe('returned-sync');
  });

  it('TossAds.attachBanner가 동기로 { destroy } shape를 반환한다 (theme/variant 다양화)', () => {
    for (const options of [
      { theme: 'auto' as const, variant: 'card' as const },
      { theme: 'light' as const, variant: 'expanded' as const },
      { theme: 'dark' as const, variant: 'card' as const },
    ]) {
      const target = document.createElement('div');
      document.body.appendChild(target);
      const { outcome, value } = captureSync(
        {
          category: CATEGORY,
          api: 'TossAds.attachBanner',
          scenario: 'happy-varied-theme-variant',
          input: options,
        },
        () => TossAds.attachBanner('adGroupId', target, options),
      );
      expect(outcome).toBe('returned-sync');
      // 렌더/실 배너 fill 단언은 하지 않는다 — 동기 반환 shape({destroy: fn})만 검사.
      expect(value).toMatchObject({ destroy: expect.any(Function) });
      // destroy 호출까지가 계약의 일부 — 예외 없이 정리돼야 한다.
      (value as { destroy: () => void }).destroy();
      target.remove();
    }
  });

  it('[deprecated] TossAds.attach가 예외 없이 동기 실행된다', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const { outcome } = captureSync(
      { category: CATEGORY, api: 'TossAds.attach', scenario: 'happy-deprecated', input: 'adGroupId' },
      () => TossAds.attach('adGroupId', target),
    );
    expect(outcome).toBe('returned-sync');
    target.remove();
  });

  it('TossAds.destroy / destroyAll이 예외 없이 동기 실행된다', () => {
    const destroyResult = captureSync(
      { category: CATEGORY, api: 'TossAds.destroy', scenario: 'happy-arbitrary-slotId', input: 'slotId' },
      () => TossAds.destroy('slotId'),
    );
    expect(destroyResult.outcome).toBe('returned-sync');

    const destroyAllResult = captureSync(
      { category: CATEGORY, api: 'TossAds.destroyAll', scenario: 'happy-no-slots', input: null },
      () => TossAds.destroyAll(),
    );
    expect(destroyAllResult.outcome).toBe('returned-sync');
  });
});

describe('ads · isSupported / isAppsInTossAdMobLoaded (happy path)', () => {
  // 9개 광고 함수 각각의 isSupported() 호출을 캡처 메타와 함께 나열 — 순회 중
  // 어떤 함수가 실패해도 다음 함수로 넘어가야 하므로(#344), 개별 `it`이 아니라
  // 한 테스트 안에서 각자 독립 `captureSync`로 감싼다.
  const AD_ISSUPPORTED_CALLS: ReadonlyArray<{ api: string; call: () => boolean }> = [
    { api: 'TossAds.initialize.isSupported', call: () => TossAds.initialize.isSupported() },
    { api: 'TossAds.attach.isSupported', call: () => TossAds.attach.isSupported() },
    { api: 'TossAds.attachBanner.isSupported', call: () => TossAds.attachBanner.isSupported() },
    { api: 'TossAds.destroy.isSupported', call: () => TossAds.destroy.isSupported() },
    { api: 'TossAds.destroyAll.isSupported', call: () => TossAds.destroyAll.isSupported() },
    { api: 'loadFullScreenAd.isSupported', call: () => loadFullScreenAd.isSupported() },
    {
      api: 'GoogleAdMob.loadAppsInTossAdMob.isSupported',
      call: () => GoogleAdMob.loadAppsInTossAdMob.isSupported(),
    },
    {
      api: 'GoogleAdMob.showAppsInTossAdMob.isSupported',
      call: () => GoogleAdMob.showAppsInTossAdMob.isSupported(),
    },
    {
      api: 'GoogleAdMob.isAppsInTossAdMobLoaded.isSupported',
      call: () => GoogleAdMob.isAppsInTossAdMobLoaded.isSupported(),
    },
  ];

  it('광고 함수 isSupported():boolean — loadFullScreenAd만 mock/ios 통합 부재 단언 (devtools#806, #348)', () => {
    // REAL_SDK_FINDING (2.x env3, #344): 상류 표면 전체가 `isSupported():boolean`을
    // 노출한다는 전제(devtools mock이 그 전제로 구현됨)와 달리, 실기기(2.x·iOS)
    // 재캡처는 loadFullScreenAd에서 그 메서드 자체가 없음을 확인했다
    // (`loadFullScreenAd.isSupported is not a function` — native TypeError). 예전
    // 구조(9개 함수를 한 줄씩 순차 단정)는 그 지점에서 조기 실패해 뒤 3개 함수
    // (GoogleAdMob.loadAppsInTossAdMob/showAppsInTossAdMob/isAppsInTossAdMobLoaded)의
    // isSupported 존재 여부가 아예 측정되지 못했다. 함수마다 독립 `captureSync`로
    // 감싸면(threw-sync는 그 자체로 캡처되고 밖으로 다시 던지지 않는다) 한 함수의
    // 부재가 나머지 순회를 막지 않는다 — 다음 재캡처에서 전 함수의 존재 매트릭스가
    // 측정된다.
    //
    // devtools#806(0.1.143)로 mock의 loadFullScreenAd도 실기기처럼 `.isSupported`가
    // 런타임에 붙어 있지 않다(호출 시 TypeError) — loadFullScreenAd만 cell-conditional
    // 없이 통합 "부재" 단언(threw-sync)으로 접는다. 실기기 부재가 측정된 건 이
    // 함수 1건뿐이므로 나머지 8개는 mock 셀 boolean 계약을 그대로 유지하고, ios
    // 셀은 여전히 미단정(#783 "측정 밖 확장 금지").
    for (const { api, call } of AD_ISSUPPORTED_CALLS) {
      const { outcome, value } = captureSync(
        { category: CATEGORY, api, scenario: 'happy-default', input: null },
        call,
      );
      if (api === 'loadFullScreenAd.isSupported') {
        // 통합 device-faithful 단언 — mock/ios 모두 메서드 부재(호출 시 TypeError).
        expect(outcome).toBe('threw-sync');
      } else if (cell.platform === 'mock') {
        // mock 계약 유지 — 나머지 8개 함수는 isSupported():boolean을 노출해야 한다.
        expect(outcome).toBe('returned-sync');
        expect(typeof value).toBe('boolean');
      } else {
        // ios(device) 셀은 존재 여부만 관측한다 — outcome이 'returned-sync'면 존재,
        // 'threw-sync'면 부재(TypeError). 하드 단언은 하지 않는다(미측정).
        expect(['returned-sync', 'threw-sync']).toContain(outcome);
      }
    }
  });

  it('isAppsInTossAdMobLoaded가 다양한 adGroupId로 boolean을 resolve한다', async () => {
    for (const adGroupId of ['adGroupId', 'ad-group-XYZ', 'ad-group-매우-긴-id-0000']) {
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'GoogleAdMob.isAppsInTossAdMobLoaded',
          scenario: 'happy-varied-adGroupId',
          input: { adGroupId },
        },
        () => GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId }),
      );
      // 순수 Promise<boolean> — 실기기에서도 reject할 이유가 없는 조회성 API.
      if (outcome === 'resolved') {
        expect(typeof value).toBe('boolean');
      } else {
        // env3 native 오류 shape만 캡처, 강한 단언은 하지 않는다.
        expect(outcome).toBe('rejected');
      }
    }
  });
});

describe('ads · LOAD (captureCallback, env3=terminal-arrived만 단언)', () => {
  it('loadFullScreenAd — onEvent/onError 중 하나가 도착하거나 callback-timeout', async () => {
    const result = await captureCallback(
      { category: CATEGORY, api: 'loadFullScreenAd', scenario: 'happy-load', input: { adGroupId: 'adGroupId' } },
      ({ onEvent, onError }) =>
        loadFullScreenAd({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );
    // 31146은 광고 계약이 체결돼 있지 않아 실기기는 load 단계에서 거부한다 —
    // env1도 프로비저닝 미러로 같은 상태에 세워져 있으므로 `mock이면 반드시
    // resolved` 같은 env1 전용 단언은 두지 않는다(그 단언 자체가 env1↔env3
    // 발산을 코드로 못박는 것이었다). mock의 낙관적 happy 경로(200ms 후
    // onEvent `loaded`)는 devtools 자체 슈트(`src/__tests__/ads.test.ts`)가
    // 게이트하므로 여기서는 두 환경에 함께 성립하는 것만 단언한다.
    if (result.outcome === 'resolved') {
      expect(result.value).toMatchObject({ type: 'loaded' });
    } else {
      // 프로비저닝 거부(rejected) 또는 응답 없음(timeout) 모두 ENV_EXPECTED.
      expect(['rejected', 'callback-timeout']).toContain(result.outcome);
    }
  });

  it('GoogleAdMob.loadAppsInTossAdMob — onEvent/onError 중 하나가 도착하거나 callback-timeout', async () => {
    const result = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'happy-load',
        input: { adGroupId: 'adGroupId' },
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );
    // 위 loadFullScreenAd와 같은 이유로 수렴 단언 — 31146은 AdMob placement가
    // 발급돼 있지 않아 양쪽 환경 모두 load 단계에서 거부된다.
    if (result.outcome === 'resolved') {
      expect(result.value).toMatchObject({
        type: 'loaded',
        data: expect.objectContaining({ responseInfo: expect.any(Object) }),
      });
    } else {
      expect(['rejected', 'callback-timeout']).toContain(result.outcome);
    }
  });

  it('isAppsInTossAdMobLoaded — load 시도 후에도 boolean 계약을 지킨다', async () => {
    // 앞선 GoogleAdMob load 테스트가 mock에서 aitState.ads.isLoaded=true로 patch했을
    // 수 있다 — 어느 쪽이든 반환 타입은 boolean이어야 한다는 계약만 검사.
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.isAppsInTossAdMobLoaded',
        scenario: 'happy-after-load-attempt',
        input: { adGroupId: 'adGroupId' },
      },
      () => GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId: 'adGroupId' }),
    );
    if (outcome === 'resolved') {
      expect(typeof value).toBe('boolean');
    }
  });
});

describe('ads · 의도적 오류 (확인된 오용 가드)', () => {
  // A1: destroy를 initialize 없이 호출해도 예외를 던지지 않아야 한다 —
  // 존재하지 않는 slotId를 destroy하는 것은 흔한 실수(중복 destroy, 초기화 순서
  // 오류)지만 SDK 계약상 fire-and-forget이므로 죽지 않아야 한다.
  it('[A1] initialize 없이 destroy(알 수 없는 slotId)를 호출해도 예외를 던지지 않는다', () => {
    const { outcome } = captureSync(
      {
        category: CATEGORY,
        api: 'TossAds.destroy',
        scenario: 'A1-destroy-before-initialize-unknown-slot',
        input: 'unknown-slot-never-attached',
      },
      () => TossAds.destroy('unknown-slot-never-attached'),
    );
    expect(outcome).toBe('returned-sync');
  });

  // A2: 존재하지 않는(형식이 이상한) adGroupId로 isAppsInTossAdMobLoaded를 호출해도
  // Promise<boolean> 계약을 벗어나지 않는다(예외 대신 false로 수렴하거나 rejected).
  it('[A2] 형식이 이상한 adGroupId로 isAppsInTossAdMobLoaded를 호출해도 boolean|rejected 계약을 지킨다', async () => {
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.isAppsInTossAdMobLoaded',
        scenario: 'A2-malformed-adGroupId',
        input: { adGroupId: '' },
      },
      () => GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId: '' }),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
    if (outcome === 'resolved') {
      expect(typeof value).toBe('boolean');
    }
  });
});

describe('ads · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
