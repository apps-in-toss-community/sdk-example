// Primary locale strings (ko).
// Keys follow `<component>.<purpose>` convention. Variable interpolation
// uses `{name}` placeholders resolved via `t(key, { name: value })`.
//
// A few values are intentionally English (e.g. `Loading...`, `Copy`, `Copied!`,
// `Success`, `Error`, `Clear`, `History`, `DEMO`, `Docs ↗`). These are
// locale-neutral UI chrome carried over from the pre-i18n source — they live
// in `ko.ts` so the central catalog stays the single source of truth; a future
// English sweep can keep or translate them per design preference.

export const ko = {
  // ApiCard
  'apiCard.docsLink': 'Docs ↗',
  'apiCard.executing': '실행 중...',
  'apiCard.execute': '실행',

  // ResultView
  'resultView.loading': 'Loading...',
  'resultView.error': 'Error',
  'resultView.success': 'Success',
  'resultView.copy': 'Copy',
  'resultView.copied': 'Copied!',
  'resultView.copyAriaLabel': '결과 JSON 복사',

  // HistoryLog
  'historyLog.title': 'History ({count})',
  'historyLog.clear': 'Clear',
  'historyLog.clearAriaLabel': '기록 지우기',
  'historyLog.noData': '(no data)',

  // PageHeader
  'pageHeader.back': '뒤로가기',

  // ErrorBoundary
  'errorBoundary.title': '문제가 발생했어요',
  'errorBoundary.description': '렌더링 중 예기치 않은 에러가 발생했습니다.',
  'errorBoundary.retry': '다시 시도',
  'errorBoundary.goHome': '홈으로',

  // DemoBanner
  'demoBanner.ariaLabel': '데모 안내',
  'demoBanner.badge': 'DEMO',
  'demoBanner.summary': '@ait-co/devtools mock으로 동작하는 웹 데모',
  'demoBanner.collapse': '접기',
  'demoBanner.expand': '자세히',
  'demoBanner.description':
    '이 앱은 실제 SDK 동작을 모사하는 mock 레이어 위에서 동작합니다. 네이티브 API의 실제 동작은 앱인토스에서 확인하세요.',
  'demoBanner.qrAlt': '앱인토스 링크 QR',
  'demoBanner.mobileHint': '모바일에서 QR 스캔 또는 링크로 이동:',
  'demoBanner.openInAppsInToss': '앱인토스에서 열기 →',
  'demoBanner.pendingDeployUrl': '앱인토스 배포 URL은 배포 후 여기에 표시됩니다.',

  // PolyfillNotice
  'polyfillNotice.title': '@ait-co/polyfill 활성화됨',
  'polyfillNotice.description':
    '이 페이지의 SDK 호출과 동등한 표준 Web API({webApis})도 함께 제공됩니다. 두 경로는 동등한 기능을 목표로 하며, 앱인토스 환경에서는 polyfill이 SDK로 라우팅하고 브라우저에서는 네이티브 API로 fall-through합니다. (SDK와 Web API의 매핑은 일부 필드(accuracy 등급, share 메시지 구조 등)에서 손실 변환이 있을 수 있습니다.)',

  // ShimCompositionCard
  'shimComposition.title': 'Shim composition (devtools × polyfill)',
  'shimComposition.description':
    '@ait-co/devtools mock과 @ait-co/polyfill shim이 어떻게 합성되는지 페이지 로드 기준으로 진단합니다.',
  'shimComposition.sdkPresent': 'SDK present',
  'shimComposition.polyfillLoaded': 'Polyfill loaded',
  'shimComposition.isTossEnvironment': 'isTossEnvironment()',
  'shimComposition.mode': 'Composition mode',
  'shimComposition.runRoundTrip': 'writeText round-trip 실행',
  'shimComposition.roundTripIdle':
    'navigator.clipboard.writeText 호출이 mock state를 갱신하는지 확인합니다.',
  'shimComposition.roundTripRunning': '실행 중…',
  'shimComposition.devOnlyNote':
    'prod 빌드/실 디바이스에선 {windowAit}가 없어 mock-state 검증은 dev에서만 의미 있습니다.',
  'shimComposition.mode.mockViaPolyfill':
    'devtools mock + polyfill 둘 다 감지됨. polyfill이 SDK를 "present"로 인식해 mock 경유로 라우팅하는 게 의도된 합성입니다. 실제 라우팅까지 확인하려면 아래 round-trip을 실행하세요.',
  'shimComposition.mode.sdkDirect':
    'SDK는 감지됐지만 polyfill이 활성화되지 않았습니다. 페이지가 SDK를 직접 호출합니다.',
  'shimComposition.mode.polyfillDirect':
    'SDK가 감지되지 않아 polyfill이 브라우저 네이티브 Web API로 fall-through합니다.',
  'shimComposition.mode.unknown': '감지가 아직 끝나지 않았거나 두 경로 모두 비활성입니다.',
  'shimComposition.roundTrip.mismatchUndefined':
    'devtools mock state(window.__ait)가 노출되지 않았습니다. polyfill이 native browser clipboard로 fall-through했을 가능성이 큽니다.',
  'shimComposition.roundTrip.mismatchOther':
    'writeText 호출은 성공했지만 mock state가 갱신되지 않음. seen={seen}',
  'shimComposition.row.yes': 'yes',
  'shimComposition.row.no': 'no',
  'shimComposition.row.pending': '…',

  // PolyfillToggleCard
  'polyfillToggle.tablistAriaLabel': '{title} 호출 경로',

  // HomePage
  'homePage.title': 'SDK Example',
  'homePage.subtitle': '@apps-in-toss/web-framework',
  'homePage.searchPlaceholder': 'API 이름으로 검색...',
  'homePage.searchReset': '초기화',
  'homePage.apiCount': '{count} APIs',
  'homePage.noResults': '검색 결과가 없습니다',

  // AuthPage
  'pages.auth.appLogin.description': '앱 로그인, authorizationCode 반환',
  'pages.auth.getIsTossLoginIntegratedService.description': '토스 로그인 연동 서비스 여부',
  'pages.auth.getUserKeyForGame.description': '게임용 유저 해시 키',
  'pages.auth.appsInTossSignTossCert.description': '토스 인증서 서명',

  // IAPPage
  'pages.iap.getProductItemList.description': '상품 목록 조회',
  'pages.iap.getPendingOrders.description': '미완료 주문 조회',
  'pages.iap.getCompletedOrRefundedOrders.description': '완료/환불 주문 조회',
  'pages.iap.getSubscriptionInfo.description': '구독 정보 조회',
  'pages.iap.checkoutPayment.description': 'TossPay 결제',

  // EnvironmentPage
  'pages.environment.getPlatformOS.description': 'SDK — 플랫폼 OS',
  'pages.environment.getOperationalEnvironment.description': 'SDK — 실행 환경',
  'pages.environment.getNetworkStatus.description': 'SDK — 네트워크 상태',
  'pages.environment.getTossAppVersion.description': '토스 앱 버전',
  'pages.environment.isMinVersionSupported.description': '최소 버전 지원 확인',
  'pages.environment.getSchemeUri.description': '현재 scheme URI',
  'pages.environment.getLocale.description': '로케일',
  'pages.environment.getDeviceId.description': '디바이스 ID',
  'pages.environment.getGroupId.description': '그룹 ID',
  'pages.environment.getServerTime.description': '서버 시간',
  'pages.environment.envGetDeploymentId.description': '배포 ID',
  'pages.environment.getAppsInTossGlobals.description': '앱인토스 글로벌 설정',
  'pages.environment.safeAreaInsetsGet.description': 'Safe Area Insets',
  'pages.environment.getSafeAreaInsets.description': 'Safe Area Insets (legacy)',
  'pages.environment.navigatorOnline.description': '표준 Web API (via @ait-co/polyfill)',
  'pages.environment.navigatorConnection.description':
    '표준 Web API (via @ait-co/polyfill) — NetworkInformation snapshot',

  // NavigationPage
  'pages.navigation.closeView.description': 'SDK — 현재 뷰 닫기',
  'pages.navigation.openURL.description': 'SDK — URL 열기',
  'pages.navigation.share.description': 'SDK — 메시지 공유',
  'pages.navigation.getTossShareLink.description': '토스 공유 링크 생성',
  'pages.navigation.setIosSwipeGestureEnabled.description': 'iOS 스와이프 제스처 활성화',
  'pages.navigation.setDeviceOrientation.description': '화면 방향 설정',
  'pages.navigation.setScreenAwakeMode.description': '화면 꺼짐 방지',
  'pages.navigation.setSecureScreen.description': '보안 화면 설정',
  'pages.navigation.requestReview.description': '앱 리뷰 요청',
  'pages.navigation.navigatorShare.description': '표준 Web API (via @ait-co/polyfill)',

  // ClipboardPage
  'pages.clipboard.writeText.title': '클립보드에 텍스트 복사',
  'pages.clipboard.setClipboardText.description': 'SDK — 클립보드에 텍스트 복사',
  'pages.clipboard.navigatorWriteText.description': '표준 Web API (via @ait-co/polyfill)',
  'pages.clipboard.readText.title': '클립보드 텍스트 읽기',
  'pages.clipboard.getClipboardText.description': 'SDK — 클립보드 텍스트 읽기',
  'pages.clipboard.navigatorReadText.description': '표준 Web API (via @ait-co/polyfill)',

  // LocationPage
  'pages.location.getCurrentLocation.description': 'SDK — 현재 위치 조회',
  'pages.location.startUpdateLocation.description': 'SDK — 위치 업데이트 시작',
  'pages.location.navigatorGetCurrentPosition.description': '표준 Web API (via @ait-co/polyfill)',
  'pages.location.navigatorWatchPosition.description':
    '표준 Web API (via @ait-co/polyfill) — 첫 위치 이벤트 이후 자동 clearWatch',

  // HapticPage
  'pages.haptic.hapticVibrate.title': '햅틱 피드백 / 진동',
  'pages.haptic.generateHapticFeedback.description': 'SDK — 햅틱 피드백 생성',
  'pages.haptic.navigatorVibrate.description':
    '표준 Web API (via @ait-co/polyfill) — ms 단위 pattern. 쉼표로 구분하면 vibrate/pause 시퀀스.',
  'pages.haptic.saveBase64Data.description': 'SDK — Base64 데이터 저장',

  // CameraPage
  'pages.camera.openCamera.description': '카메라 열기',
  'pages.camera.fetchAlbumPhotos.description': '앨범 사진 가져오기',

  // ContactsPage
  'pages.contacts.fetchContacts.description': '연락처 가져오기',

  // PermissionsPage
  'pages.permissions.getPermission.description': '권한 상태 조회',
  'pages.permissions.openPermissionDialog.description': '권한 요청 다이얼로그',
  'pages.permissions.requestPermission.description': '권한 요청',

  // StoragePage
  'pages.storage.setItem.description': '값 저장',
  'pages.storage.getItem.description': '값 조회',
  'pages.storage.removeItem.description': '값 삭제',
  'pages.storage.clearItems.description': '전체 삭제',

  // AnalyticsPage
  'pages.analytics.screen.description': '화면 조회 로그',
  'pages.analytics.impression.description': '노출 로그',
  'pages.analytics.click.description': '클릭 로그',
  'pages.analytics.eventLog.description': '커스텀 이벤트 로그',

  // GamePage
  'pages.game.grantPromotionReward.description': '프로모션 리워드 지급',
  'pages.game.grantPromotionRewardForGame.description': '게임 프로모션 리워드 지급',
  'pages.game.submitGameCenterLeaderBoardScore.description': '리더보드 점수 제출',
  'pages.game.getGameCenterGameProfile.description': '게임 프로필 조회',
  'pages.game.openGameCenterLeaderboard.description': '리더보드 열기',
  'pages.game.contactsViral.description': '연락처 바이럴 공유',

  // AdsPage
  'pages.ads.tossAdsInitialize.description': 'TossAds 초기화',
  'pages.ads.tossAdsAttach.description': '배너 슬롯 부착 (deprecated — attachBanner 사용 권장)',
  'pages.ads.tossAdsAttachBanner.description': '배너 슬롯 부착 — 반환된 destroy()로 해제',
  'pages.ads.tossAdsDestroy.description': '특정 슬롯 ID 제거',
  'pages.ads.tossAdsDestroyAll.description': '모든 TossAds 슬롯 제거',
  'pages.ads.loadFullScreenAd.description': '전면 광고 로드 — 여러 이벤트를 수신합니다',
  'pages.ads.showFullScreenAd.description': '전면 광고 표시 — 여러 이벤트를 수신합니다',
  'pages.ads.isAppsInTossAdMobLoaded.description': 'AdMob 광고가 로드 상태인지 확인',

  // EventsPage
  'pages.events.graniteBackEvent.description': '뒤로가기 버튼 이벤트 구독',
  'pages.events.graniteHomeEvent.description': '홈 버튼 이벤트 구독',
  'pages.events.tdsNavigationAccessoryEvent.description':
    '상단 네비게이션 액세서리 버튼 이벤트 구독',
  'pages.events.onVisibilityChangedByTransparentServiceWeb.description':
    '투명 서비스 웹 가시성 변경 이벤트 구독',

  // PartnerPage
  'pages.partner.addAccessoryButton.description': '액세서리 버튼 추가',
  'pages.partner.removeAccessoryButton.description': '액세서리 버튼 제거',
} as const;

export type StringKey = keyof typeof ko;
