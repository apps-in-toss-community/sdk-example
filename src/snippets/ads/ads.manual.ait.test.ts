/**
 * ads `.manual.ait.test` — 수동-변형 슈트 (devtools 0.1.132 `--manual-blocking`
 * 전용). 파일명 접미사 `.manual.ait.test.ts`는 다음을 의미한다:
 *
 *  - `pnpm test`(vitest, env1)에서는 `vitest.config.ts`의 `exclude`로 완전히
 *    건너뛴다 — CI에 영향 없음.
 *  - `pnpm test:env3`(devtools-test CLI)에서도 **기본적으로 제외**된다.
 *    `--manual-blocking` 플래그를 줄 때만 실행되며, 그때는 일반 파일들이 먼저
 *    돌고 이 파일이 **마지막**에 스케줄된다. 각 manual 파일 실행 전 QR
 *    대시보드가 폰에 push되어 사람이 화면을 보고 상호작용해야 한다.
 *  - env1(mock)에서도 이 파일 자체는 정상 import·실행 가능하지만, 위 이유로
 *    일반 `pnpm test` 실행 경로에서는 애초에 discover되지 않는다.
 *
 * 여기 담는 것: `showFullScreenAd` / `GoogleAdMob.showAppsInTossAdMob` —
 * fullscreen interstitial을 실제로 띄우고 사용자가 보고 닫아야(dismiss) 하는
 * 경로. mock(env1)은 비차단(setTimeout으로 이벤트를 자동 발화)이라 사람 개입
 * 없이도 완주하지만, 실기기(env3)는 화면을 가리는 진짜 UI라 사람이 지켜보며
 * 닫아야 한다 — 그래서 무인 슈트(`ads.ait.test.ts`)에서 제외하고 이 파일로
 * 분리했다.
 *
 * SHOW는 LOAD가 선행돼야 한다 — mock은 `aitState.ads.isLoaded`가 false면
 * `onError('Ad not loaded')`로 즉시 실패한다(devtools mock/index.js:1486,1603).
 * 그래서 각 SHOW 테스트는 같은 광고 계열의 LOAD를 먼저 호출해 로드 상태를
 * 만든 뒤 SHOW를 호출한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  GoogleAdMob,
  loadFullScreenAd,
  showFullScreenAd,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureCallback, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'ads';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('ads · SHOW (수동-변형 — 사람이 fullscreen interstitial을 지켜보고 닫는다)', () => {
  it('showFullScreenAd — 사람: 화면에 전면 광고가 뜨면 확인 후 닫아 주세요 (mock은 자동 dismiss)', async () => {
    // 1) LOAD 선행 — 로드가 안 된 상태로 SHOW를 부르면 mock/env3 모두 즉시
    //    onError('Ad not loaded')로 실패한다(계약상 정상, 회귀 아님).
    const loadResult = await captureCallback(
      {
        category: CATEGORY,
        api: 'loadFullScreenAd',
        scenario: 'manual-show-prereq-load',
        input: { adGroupId: 'adGroupId' },
      },
      ({ onEvent, onError }) =>
        loadFullScreenAd({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );

    // 2) SHOW — 사람 관찰 포인트: 전면 광고 UI가 나타나고, 클릭/노출/닫힘 이벤트가
    //    순서대로 오는지 확인한다. mock은 clicked@100ms, dismissed@1500ms로 자동
    //    진행되므로 사람이 직접 닫을 필요는 없다 — 실기기에서만 실제 dismiss
    //    제스처가 필요하다.
    const showResult = await captureCallback(
      {
        category: CATEGORY,
        api: 'showFullScreenAd',
        scenario: 'manual-show',
        input: { adGroupId: 'adGroupId' },
        // fullscreen show는 사람 반응을 기다릴 수 있으므로 무인 LOAD보다 여유 있게.
        timeoutMs: 5000,
      },
      ({ onEvent, onError }) =>
        showFullScreenAd({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );

    // LOAD가 실패했으면(재고 없음 등 ENV_EXPECTED) SHOW도 'Ad not loaded'로
    // 거부되는 것이 계약대로다 — 이 경우도 shape만 캡처하고 강제 실패시키지 않는다.
    if (loadResult.outcome === 'resolved') {
      // SHOW 이벤트 스펙(ShowFullScreenAdEvent)은 {type:'requested'|'clicked'|
      // 'dismissed'|'failedToShow'|'impression'|'show'|'userEarnedReward'} 합집합.
      expect(['resolved', 'rejected', 'callback-timeout']).toContain(showResult.outcome);
      if (showResult.outcome === 'resolved') {
        expect(showResult.value).toMatchObject({ type: expect.any(String) });
      }
    } else {
      expect(['rejected', 'callback-timeout']).toContain(showResult.outcome);
    }
  });

  it('GoogleAdMob.showAppsInTossAdMob — 사람: AdMob 전면/보상형 광고를 확인 후 닫아 주세요 (mock은 자동 dismiss)', async () => {
    const loadResult = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'manual-show-prereq-load',
        input: { adGroupId: 'adGroupId' },
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );

    // 사람 관찰 포인트: AdMob 전면/보상형 광고가 뜨는지, userEarnedReward →
    // dismissed 순서로 이벤트가 오는지(mock은 userEarnedReward@1000ms,
    // dismissed@1500ms로 자동 진행) 확인한다.
    const showResult = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.showAppsInTossAdMob',
        scenario: 'manual-show',
        input: { adGroupId: 'adGroupId' },
        timeoutMs: 5000,
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.showAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: 'adGroupId' },
        }),
    );

    if (loadResult.outcome === 'resolved') {
      expect(['resolved', 'rejected', 'callback-timeout']).toContain(showResult.outcome);
      if (showResult.outcome === 'resolved') {
        expect(showResult.value).toMatchObject({ type: expect.any(String) });
      }
    } else {
      expect(['rejected', 'callback-timeout']).toContain(showResult.outcome);
    }
  });
});
