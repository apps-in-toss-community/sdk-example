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
} as const;

export type StringKey = keyof typeof ko;
