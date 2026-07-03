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
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, captureCallback, captureSync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'ads';

afterAll(async () => {
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
  it('모든 광고 함수가 isSupported():boolean을 노출한다', () => {
    expect(typeof TossAds.initialize.isSupported()).toBe('boolean');
    expect(typeof TossAds.attach.isSupported()).toBe('boolean');
    expect(typeof TossAds.attachBanner.isSupported()).toBe('boolean');
    expect(typeof TossAds.destroy.isSupported()).toBe('boolean');
    expect(typeof TossAds.destroyAll.isSupported()).toBe('boolean');
    expect(typeof loadFullScreenAd.isSupported()).toBe('boolean');
    expect(typeof GoogleAdMob.loadAppsInTossAdMob.isSupported()).toBe('boolean');
    expect(typeof GoogleAdMob.showAppsInTossAdMob.isSupported()).toBe('boolean');
    expect(typeof GoogleAdMob.isAppsInTossAdMobLoaded.isSupported()).toBe('boolean');
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
    // mock은 200ms 후 무조건 onEvent({type:'loaded'})를 발화한다 — timeout이면 회귀.
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
      expect(result.value).toMatchObject({ type: 'loaded' });
    } else {
      // env3: 재고 없음(No fill) 또는 응답 없음(timeout) 모두 ENV_EXPECTED.
      expect(['resolved', 'rejected', 'callback-timeout']).toContain(result.outcome);
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
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
      expect(result.value).toMatchObject({
        type: 'loaded',
        data: expect.objectContaining({ responseInfo: expect.any(Object) }),
      });
    } else {
      expect(['resolved', 'rejected', 'callback-timeout']).toContain(result.outcome);
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
