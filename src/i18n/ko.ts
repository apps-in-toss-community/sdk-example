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
  'pages.auth.getUserKeyForGame.description':
    '게임용 유저 해시 키 (deprecated — getAnonymousKey 사용 권장)',
  'pages.auth.getAnonymousKey.description': '익명 사용자 식별 키 — getUserKeyForGame 대체',
  'pages.auth.appsInTossSignTossCert.description': '토스 인증서 서명',

  // IAPPage
  'pages.iap.selectProduct': '상품 선택',
  'pages.iap.selectProductFirst': '상품을 먼저 선택하세요',
  'pages.iap.onetimePurchase': '일회성 구매',
  'pages.iap.subscriptionPurchase': '구독 구매',
  'pages.iap.reset': '초기화',
  'pages.iap.getProductItemList.description': '상품 목록 조회',
  'pages.iap.getPendingOrders.description': '미완료 주문 조회',
  'pages.iap.getCompletedOrRefundedOrders.description': '완료/환불 주문 조회',
  'pages.iap.getSubscriptionInfo.description': '구독 정보 조회',
  'pages.iap.checkoutPayment.description': 'TossPay 결제',
  'pages.iap.completeProductGrant.description': '상품 지급 완료 알림 (Android/iOS 5.233.0+)',

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
  'pages.environment.safeAreaInsetsGet.notes.partnerTop':
    'partner WebView 에선 토스 native 상단바가 viewport 밖이라 SDK 가 보고하는 top inset 을 padding 으로 적용하면 콘텐츠 위에 중복 빈 공간이 생깁니다. partner 미니앱은 top inset 을 정보용으로만 쓰세요. game/external 은 padding 으로 그대로 적용합니다.',
  'pages.environment.safeAreaInsetsGet.notes.subscribeStale':
    'SafeAreaInsets.subscribe 의 payload 가 landscape→portrait 회전 시 top 채널을 직전 landscape 의 left/right 값으로 stale 전달합니다 (deterministic). subscribe 는 signal 로만 쓰고 매번 get() 을 다시 호출해 정합한 값을 읽으세요.',
  'pages.environment.getSafeAreaInsets.description': 'Safe Area Insets (legacy)',
  'pages.environment.navigatorOnline.description': '표준 Web API (via @ait-co/polyfill)',
  'pages.environment.navigatorConnection.description':
    '표준 Web API (via @ait-co/polyfill) — NetworkInformation snapshot',

  // NavigationPage
  'pages.navigation.closeView.description': 'SDK — 현재 뷰 닫기',
  'pages.navigation.openURL.description': 'SDK — URL 열기',
  'pages.navigation.openPDFViewer.description': 'PDF 뷰어 열기',
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
  'pages.location.getCurrentLocation.permissionHelp':
    '위치 정보를 가져오지 못했어요. 이미 권한을 허용했더라도 iOS 설정 > 개인정보 보호 및 보안 > 위치 서비스에서 토스의 위치 접근이 켜져 있는지 확인해 주세요.',
  'pages.location.checkLocationPermission.description': 'SDK — 위치 권한 상태 확인 (getPermission)',
  'pages.location.startUpdateLocation.description': 'SDK — 위치 업데이트 시작',
  'pages.location.navigatorGetCurrentPosition.description': '표준 Web API (via @ait-co/polyfill)',
  'pages.location.navigatorWatchPosition.description':
    '표준 Web API (via @ait-co/polyfill) — 첫 위치 이벤트 이후 자동 clearWatch',

  // HapticPage
  'pages.haptic.hapticVibrate.title': '햅틱 피드백 / 진동',
  'pages.haptic.generateHapticFeedback.description': 'SDK — 햅틱 피드백 생성',
  'pages.haptic.navigatorVibrate.description':
    '표준 Web API (via @ait-co/polyfill) — ms 단위 pattern. 쉼표로 구분하면 vibrate/pause 시퀀스.',

  // CameraPage
  'pages.camera.openCamera.description': '카메라 열기',
  'pages.camera.fetchAlbumPhotos.description': '앨범 사진 가져오기',
  'pages.camera.fetchAlbumItems.description': '앨범에서 사진·동영상 가져오기',

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
  'pages.storage.saveBase64Data.description': 'SDK — Base64 데이터 저장',

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
  'pages.ads.reset': '초기화',
  'pages.ads.resetAriaLabel': 'GoogleAdMob 워크플로우 초기화',
  'pages.ads.tossAdsInitialize.description': 'TossAds 초기화',
  'pages.ads.tossAdsAttach.description': '배너 슬롯 부착 (deprecated — attachBanner 사용 권장)',
  'pages.ads.tossAdsAttachBanner.description': '배너 슬롯 부착 — 반환된 destroy()로 해제',
  'pages.ads.tossAdsDestroy.description': '특정 슬롯 ID 제거',
  'pages.ads.tossAdsDestroyAll.description': '모든 TossAds 슬롯 제거',
  'pages.ads.loadFullScreenAd.description': '전면 광고 로드 — 여러 이벤트를 수신합니다',
  'pages.ads.showFullScreenAd.description': '전면 광고 표시 — 여러 이벤트를 수신합니다',
  'pages.ads.isAppsInTossAdMobLoaded.description': 'AdMob 광고가 로드 상태인지 확인',

  // EventsPage
  'pages.events.subscribing': '구독 중',
  'pages.events.notSubscribed': '미구독',
  'pages.events.unsubscribe': '구독 해제',
  'pages.events.subscribe': '구독',
  'pages.events.reserved': '예약됨',
  'pages.events.graniteBackEvent.description': '뒤로가기 버튼 이벤트 구독',
  'pages.events.graniteHomeEvent.description': '홈 버튼 이벤트 구독',
  'pages.events.tdsNavigationAccessoryEvent.description':
    '상단 네비게이션 액세서리 버튼 이벤트 구독',
  'pages.events.onVisibilityChangedByTransparentServiceWeb.description':
    '투명 서비스 웹 가시성 변경 이벤트 구독',
  'pages.events.appsInTossEventAddEventListener.description':
    '앱인토스 플랫폼 이벤트 구독 — 현재 SDK 버전은 정의된 이벤트 키가 없어 예약 상태',

  // NotificationPage
  'pages.notification.requestNotificationAgreement.description':
    '푸시 알림 동의 UI 표시 — newAgreement / alreadyAgreed / agreementRejected 3-way 결과',

  // PartnerPage
  'pages.partner.addAccessoryButton.description': '액세서리 버튼 추가',
  'pages.partner.removeAccessoryButton.description': '액세서리 버튼 제거',

  // PaymentPage
  'pages.payment.requestTossPayPaysBilling.description':
    '토스페이 정기결제 인증 — wrappedToken으로 사용자 인증 (실제 결제는 서버)',
} as const;

export type StringKey = keyof typeof ko;
