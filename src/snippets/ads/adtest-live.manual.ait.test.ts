/**
 * env3 실기기 광고 관측 드라이버 — issue #358의 재현 수단.
 *
 * 표준 `ads.ait.test.ts`는 placeholder `'adGroupId'`를 써서 LOAD가 rejected
 * 되는 걸 ENV_EXPECTED로 캡처한다. 이 파일은 대신 **실제로 발급된 ID**로
 * load→show를 구동해 실기기에서 광고가 서빙되는지를 관측한다:
 *
 * 1. AdsPage "테스트 ID 프리셋"이 쓰는 공식 Google 테스트 ID
 * 2. 31146 자체 발급 실 지면(`AD_REAL_PLACEMENT_GROUPS`)
 * 3. 통합 경로(`loadFullScreenAd`) 1건 교차 캡처
 *
 * 2026-07-25/26 관측 결과(iOS, web-framework 2.10.0, `PREPARE` candidate 번들):
 * 1·2가 **동일하게** `PLACEMENT_ID_FETCH_FAILED`로 실패했고 광고는 뜨지
 * 않았다 — 테스트 ID 고유 현상이 아니다. 3은 `EXECUTION_ERROR`
 * (`광고 요청 처리에 실패했습니다 [1011]`)로 서버까지는 도달했다.
 * 원인이 사업자/정산 승인 게이트인지 `PREPARE`/비-APPROVED 배포 상태인지는
 * 아직 가르지 못했다 — APPROVED 배포가 생기면 **이 파일을 그대로 재실행**해
 * 에러 코드를 대조하는 것이 #358의 acceptance다. 그래서 폐기하지 않고 남긴다.
 *
 * 강제 실패(assert)를 걸지 않는 이유: 목적이 판정이 아니라 관측이라서다.
 * outcome shape만 느슨히 확인하고 실제 신호는 capture 파일에 남긴다.
 *
 * `.manual.ait.test.ts` 접미사 → `pnpm test`(vitest, CI) 제외, debugger-test
 * `--manual-blocking`에서만 실행. 광고가 실제로 뜨는 경우 사람이 폰에서 보고
 * 닫으면 이벤트 스트림
 * (requested→loaded→impression→clicked→userEarnedReward→dismissed)이 캡처된다.
 */
import { GoogleAdMob, loadFullScreenAd } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { AD_REAL_PLACEMENT_GROUPS } from '../../constants';
import { captureCallback, flushCapture } from '../../test/aitCapture';

// 표준 무인 슈트(`ads.ait.test.ts`)와 갈라 둔다 — `flushCapture(CATEGORY)`가
// `<category>.<sdkLine>.<platform>.json`으로 떨어뜨리므로 같은 `'ads'`를 쓰면 이
// 파일이 표준 슈트의 캡처를 통째로 덮어써 `happy-load` 비교 키가 사라진다(#368).
// diff 비교 키는 `(api, scenario)`라 카테고리 이름은 대조 의미를 바꾸지 않는다
// (`scripts/diff-ait-captures.ts`).
const CATEGORY = 'ads-live';

// AdsPage AD_TEST_ID_PRESETS와 동일한 값.
const TEST_ID_INTERSTITIAL = 'ait-ad-test-interstitial-id';
const TEST_ID_REWARDED = 'ait-ad-test-rewarded-id';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('ads · LIVE 테스트 ID (env3 실기기 — 사람이 광고를 보고 닫는다)', () => {
  it('전면형 테스트 광고: load → show (사람: 광고 확인 후 닫아 주세요)', async () => {
    const load = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'live-testid-interstitial-load',
        input: { adGroupId: TEST_ID_INTERSTITIAL },
        timeoutMs: 15000,
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: TEST_ID_INTERSTITIAL },
        }),
    );

    const show = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.showAppsInTossAdMob',
        scenario: 'live-testid-interstitial-show',
        input: { adGroupId: TEST_ID_INTERSTITIAL },
        timeoutMs: 45000, // 사람이 전면 광고를 보고 닫는 시간.
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.showAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: TEST_ID_INTERSTITIAL },
        }),
    );

    // 강제 실패 없음 — 관측이 목적. load/show 결과 shape만 느슨히 확인.
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(load.outcome);
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(show.outcome);
  });

  it('보상형 테스트 광고: load → show (사람: 끝까지 보고 보상 후 닫아 주세요)', async () => {
    const load = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'live-testid-rewarded-load',
        input: { adGroupId: TEST_ID_REWARDED },
        timeoutMs: 15000,
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: TEST_ID_REWARDED },
        }),
    );

    const show = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.showAppsInTossAdMob',
        scenario: 'live-testid-rewarded-show',
        input: { adGroupId: TEST_ID_REWARDED },
        timeoutMs: 60000, // 보상형은 끝까지 시청해야 userEarnedReward가 온다.
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.showAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: TEST_ID_REWARDED },
        }),
    );

    expect(['resolved', 'rejected', 'callback-timeout']).toContain(load.outcome);
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(show.outcome);
  });
});

describe('ads · 판별 실험 — 실 지면 ID vs 테스트 ID 에러 코드 비교 (load만)', () => {
  // 가설 분리: 실 지면(ait.v2.live.*)이 테스트 ID와 동일하게
  // PLACEMENT_ID_FETCH_FAILED면 앱/배포 상태 전체가 광고 불가(가설 B),
  // 다른 에러 코드(승인 거부류)면 게이트가 ID 종류를 구분한다는 뜻(가설 A).
  it('실 지면 interstitial load — 에러 코드 캡처', async () => {
    const r = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'live-realid-interstitial-load',
        input: { adGroupId: AD_REAL_PLACEMENT_GROUPS.interstitial },
        timeoutMs: 15000,
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: AD_REAL_PLACEMENT_GROUPS.interstitial },
        }),
    );
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(r.outcome);
  });

  it('실 지면 rewarded load — 에러 코드 캡처', async () => {
    const r = await captureCallback(
      {
        category: CATEGORY,
        api: 'GoogleAdMob.loadAppsInTossAdMob',
        scenario: 'live-realid-rewarded-load',
        input: { adGroupId: AD_REAL_PLACEMENT_GROUPS.rewarded },
        timeoutMs: 15000,
      },
      ({ onEvent, onError }) =>
        GoogleAdMob.loadAppsInTossAdMob({
          onEvent,
          onError,
          options: { adGroupId: AD_REAL_PLACEMENT_GROUPS.rewarded },
        }),
    );
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(r.outcome);
  });

  // 통합 경로(loadFullScreenAd → 브리지 'loadTossAdOrAdmob')는 별도 네이티브
  // 메서드라 GoogleAdMob 직행 경로와 다르게 반응할 수 있다 — 1건만 교차 캡처.
  it('통합 loadFullScreenAd + 테스트 ID — 경로별 차이 캡처', async () => {
    const r = await captureCallback(
      {
        category: CATEGORY,
        api: 'loadFullScreenAd',
        scenario: 'live-testid-integrated-load',
        input: { adGroupId: TEST_ID_INTERSTITIAL },
        timeoutMs: 15000,
      },
      ({ onEvent, onError }) =>
        loadFullScreenAd({
          onEvent,
          onError,
          options: { adGroupId: TEST_ID_INTERSTITIAL },
        }),
    );
    expect(['resolved', 'rejected', 'callback-timeout']).toContain(r.outcome);
  });
});
