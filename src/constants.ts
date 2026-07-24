/**
 * 앱인토스에 배포된 실제 앱의 링크. 31146의 serviceStatus가 OPENED로 전환되어 공개
 * URL이 생기기 전까지는 빈 문자열이며, DemoBanner가 이 값을 보고 QR/링크 섹션을 숨긴다.
 */
export const APP_IN_TOSS_URL = '';

/**
 * 광고 타입별 실 지면(placement group) adGroupId — 31146(aitc-sdk-example) 전용으로
 * `aitcc app ads placement-groups create`(2026-07-24)로 발급했고 라이브 확인된 값이다.
 * 클라이언트 코드에 넣는 공개 식별자라 비밀은 아니지만 **이 예제 앱 전용**이다 — 이
 * boilerplate를 복사해 다른 미니앱을 만든다면 반드시 본인 콘솔에서 발급받은 지면 ID로
 * 교체해야 한다(#355). AdsPage의 "실 지면(dog-food)" 프리셋이 이 값을 소비한다.
 *
 * 콘솔 상태는 발급 시점(2026-07-24) 스냅샷이라 시간이 지나면 달라질 수 있다 — 재확인은
 * `aitcc app ads placement-groups list`.
 */
export const AD_REAL_PLACEMENT_GROUPS = {
  /**
   * 전면형(INTERSTITIAL). 소비 API: GoogleAdMob.loadAppsInTossAdMob/showAppsInTossAdMob,
   * loadFullScreenAd/showFullScreenAd. 콘솔 상태(발급 시점): ENABLED.
   */
  interstitial: 'ait.v2.live.f75ef8504e254b11',
  /**
   * 리워드(REWARDED). 소비 API는 전면형과 동일(fullscreen, `userEarnedReward` 이벤트로
   * 구분). 콘솔 상태(발급 시점): REGISTERING.
   */
  rewarded: 'ait.v2.live.4ebc5e0284164325',
  /**
   * 배너 리스트형(BANNER/NORMAL). 소비 API: TossAds.attachBanner. 콘솔 상태(발급 시점):
   * REGISTERING.
   */
  bannerList: 'ait.v2.live.934f395bb2b44754',
  /**
   * 배너 피드형(BANNER/NATIVE_IMAGE). 소비 API: TossAds.attachBanner. 콘솔 상태(발급
   * 시점): REGISTERING.
   */
  bannerFeed: 'ait.v2.live.8e3e176e1b224c7f',
} as const;
