// English locale strings.
// Keys mirror ko.ts 1:1. SDK method names / param names are kept as-is.
// A few values that were already English in ko.ts (e.g. "Loading...", "Copy",
// "Copied!", "Success", "Error", "Clear", "History", "DEMO", "Docs ↗") are
// carried over unchanged — they are locale-neutral UI chrome.

import type { StringKey } from './ko';

export const en: Record<StringKey, string> = {
  // ApiCard
  'apiCard.docsLink': 'Docs ↗',
  'apiCard.executing': 'Running...',
  'apiCard.execute': 'Run',

  // ResultView
  'resultView.loading': 'Loading...',
  'resultView.error': 'Error',
  'resultView.success': 'Success',
  'resultView.copy': 'Copy',
  'resultView.copied': 'Copied!',
  'resultView.copyAriaLabel': 'Copy result JSON',

  // HistoryLog
  'historyLog.title': 'History ({count})',
  'historyLog.clear': 'Clear',
  'historyLog.clearAriaLabel': 'Clear history',
  'historyLog.noData': '(no data)',

  // PageHeader
  'pageHeader.back': 'Back',

  // ErrorBoundary
  'errorBoundary.title': 'Something went wrong',
  'errorBoundary.description': 'An unexpected error occurred during rendering.',
  'errorBoundary.retry': 'Retry',
  'errorBoundary.goHome': 'Go home',

  // DemoBanner
  'demoBanner.ariaLabel': 'Demo notice',
  'demoBanner.badge': 'DEMO',
  'demoBanner.summary': 'Web demo powered by @ait-co/devtools mock',
  'demoBanner.collapse': 'Collapse',
  'demoBanner.expand': 'Details',
  'demoBanner.description':
    'This app runs on a mock layer that simulates the real SDK behavior. Check the actual native API behavior inside Apps in Toss.',
  'demoBanner.qrAlt': 'Apps in Toss link QR code',
  'demoBanner.mobileHint': 'On mobile, scan the QR code or open the link:',
  'demoBanner.openInAppsInToss': 'Open in Apps in Toss →',
  'demoBanner.pendingDeployUrl': 'The Apps in Toss deployment URL will appear here after deploy.',

  // PolyfillNotice
  'polyfillNotice.title': '@ait-co/polyfill active',
  'polyfillNotice.description':
    'Standard Web APIs ({webApis}) equivalent to the SDK calls on this page are also available. Both paths aim for feature parity: in the Apps in Toss environment the polyfill routes through the SDK, while in a browser it falls through to native APIs. (Some field mappings between the SDK and Web APIs may be lossy — e.g. accuracy grades, share message structure.)',

  // ShimCompositionCard
  'shimComposition.title': 'Shim composition (devtools × polyfill)',
  'shimComposition.description':
    'Diagnoses how @ait-co/devtools mock and @ait-co/polyfill shim compose at page load.',
  'shimComposition.sdkPresent': 'SDK present',
  'shimComposition.polyfillLoaded': 'Polyfill loaded',
  'shimComposition.isTossEnvironment': 'isTossEnvironment()',
  'shimComposition.mode': 'Composition mode',
  'shimComposition.runRoundTrip': 'Run writeText round-trip',
  'shimComposition.roundTripIdle':
    'Verifies whether a navigator.clipboard.writeText call updates the mock state.',
  'shimComposition.roundTripRunning': 'Running…',
  'shimComposition.devOnlyNote':
    'In prod builds / on a real device {windowAit} is absent, so mock-state verification is only meaningful in dev.',
  'shimComposition.mode.mockViaPolyfill':
    'Both devtools mock and polyfill detected. The polyfill sees the SDK as "present" and routes through the mock — this is the intended composition. Run the round-trip below to confirm actual routing.',
  'shimComposition.mode.sdkDirect':
    'SDK detected but polyfill is not active. The page calls the SDK directly.',
  'shimComposition.mode.polyfillDirect':
    'No SDK detected — polyfill falls through to native browser Web APIs.',
  'shimComposition.mode.unknown': 'Detection not yet complete, or both paths are inactive.',
  'shimComposition.roundTrip.mismatchUndefined':
    'The devtools mock state (window.__ait) is not exposed. The polyfill likely fell through to the native browser clipboard.',
  'shimComposition.roundTrip.mismatchOther':
    'writeText succeeded but mock state was not updated. seen={seen}',
  'shimComposition.row.yes': 'yes',
  'shimComposition.row.no': 'no',
  'shimComposition.row.pending': '…',

  // AttachStatusIcon (relay attach state indicator)
  'attachStatus.connecting': 'Connecting to relay',
  'attachStatus.connected': 'Relay connected',
  'attachStatus.failed': 'Relay connection failed',

  // PolyfillToggleCard
  'polyfillToggle.tablistAriaLabel': '{title} call path',

  // HomePage
  'homePage.title': 'SDK Example',
  'homePage.subtitle': '@apps-in-toss/web-framework',
  'homePage.searchPlaceholder': 'Search by API name...',
  'homePage.searchReset': 'Reset',
  'homePage.apiCount': '{count} APIs',
  'homePage.noResults': 'No results found',

  // AuthPage
  'pages.auth.appLogin.description': 'App login — returns authorizationCode',
  'pages.auth.getIsTossLoginIntegratedService.description':
    'Check whether the service integrates Toss login',
  'pages.auth.getUserKeyForGame.description':
    'Hashed user key for games (deprecated — use getAnonymousKey instead)',
  'pages.auth.getAnonymousKey.description':
    'Anonymous user identifier — replaces getUserKeyForGame',
  'pages.auth.appsInTossSignTossCert.description': 'Sign with Toss certificate',

  // IAPPage
  'pages.iap.selectProduct': 'Select product',
  'pages.iap.selectProductFirst': 'Select a product first',
  'pages.iap.onetimePurchase': 'One-time purchase',
  'pages.iap.subscriptionPurchase': 'Subscription purchase',
  'pages.iap.reset': 'Reset',
  'pages.iap.getProductItemList.description': 'Fetch product list',
  'pages.iap.getPendingOrders.description': 'Fetch pending orders',
  'pages.iap.getCompletedOrRefundedOrders.description': 'Fetch completed or refunded orders',
  'pages.iap.getSubscriptionInfo.description': 'Fetch subscription info',
  'pages.iap.checkoutPayment.description': 'TossPay checkout',
  'pages.iap.completeProductGrant.description':
    'Notify product grant completion (Android/iOS 5.233.0+)',

  // EnvironmentPage
  'pages.environment.getPlatformOS.description': 'SDK — platform OS',
  'pages.environment.getOperationalEnvironment.description': 'SDK — operational environment',
  'pages.environment.getNetworkStatus.description': 'SDK — network status',
  'pages.environment.getTossAppVersion.description': 'Toss app version',
  'pages.environment.isMinVersionSupported.description': 'Check minimum version support',
  'pages.environment.getSchemeUri.description': 'Current scheme URI',
  'pages.environment.getLocale.description': 'Locale',
  'pages.environment.getDeviceId.description': 'Device ID',
  'pages.environment.getGroupId.description': 'Group ID',
  'pages.environment.getServerTime.description': 'Server time',
  'pages.environment.envGetDeploymentId.description': 'Deployment ID',
  'pages.environment.getAppsInTossGlobals.description': 'Apps in Toss global settings',
  'pages.environment.safeAreaInsetsGet.description': 'Safe Area Insets',
  'pages.environment.safeAreaInsetsGet.notes.partnerTop':
    'In a partner WebView the Toss native top bar is drawn outside the viewport, so applying the SDK top inset as padding creates a duplicate gap. Treat top as informational only in partner apps. game/external WebViews must apply it as padding.',
  'pages.environment.safeAreaInsetsGet.notes.subscribeStale':
    'SafeAreaInsets.subscribe delivers a stale top channel on landscape→portrait rotation — the value matches the previous landscape left/right (deterministic). Use subscribe as a signal only and call get() each time to read consistent insets.',
  'pages.environment.getSafeAreaInsets.description': 'Safe Area Insets (legacy)',
  'pages.environment.navigatorOnline.description': 'Standard Web API (via @ait-co/polyfill)',
  'pages.environment.navigatorConnection.description':
    'Standard Web API (via @ait-co/polyfill) — NetworkInformation snapshot',

  // NavigationPage
  'pages.navigation.closeView.description': 'SDK — close the current view',
  'pages.navigation.openURL.description': 'SDK — open a URL',
  'pages.navigation.openPDFViewer.description': 'Open PDF viewer',
  'pages.navigation.share.description': 'SDK — share a message',
  'pages.navigation.getTossShareLink.description': 'Generate a Toss share link',
  'pages.navigation.setIosSwipeGestureEnabled.description': 'Enable iOS swipe gesture',
  'pages.navigation.setDeviceOrientation.description': 'Set screen orientation',
  'pages.navigation.setScreenAwakeMode.description': 'Keep screen awake',
  'pages.navigation.setSecureScreen.description': 'Configure secure screen',
  'pages.navigation.requestReview.description': 'Request app review',
  'pages.navigation.navigatorShare.description': 'Standard Web API (via @ait-co/polyfill)',

  // ClipboardPage
  'pages.clipboard.writeText.title': 'Copy text to clipboard',
  'pages.clipboard.setClipboardText.description': 'SDK — copy text to clipboard',
  'pages.clipboard.navigatorWriteText.description': 'Standard Web API (via @ait-co/polyfill)',
  'pages.clipboard.readText.title': 'Read text from clipboard',
  'pages.clipboard.getClipboardText.description': 'SDK — read text from clipboard',
  'pages.clipboard.navigatorReadText.description': 'Standard Web API (via @ait-co/polyfill)',

  // LocationPage
  'pages.location.getCurrentLocation.description': 'SDK — get current location',
  'pages.location.startUpdateLocation.description': 'SDK — start location updates',
  'pages.location.navigatorGetCurrentPosition.description':
    'Standard Web API (via @ait-co/polyfill)',
  'pages.location.navigatorWatchPosition.description':
    'Standard Web API (via @ait-co/polyfill) — auto clearWatch after the first location event',

  // HapticPage
  'pages.haptic.hapticVibrate.title': 'Haptic feedback / vibration',
  'pages.haptic.generateHapticFeedback.description': 'SDK — generate haptic feedback',
  'pages.haptic.navigatorVibrate.description':
    'Standard Web API (via @ait-co/polyfill) — pattern in ms; comma-separated values produce vibrate/pause sequences.',

  // CameraPage
  'pages.camera.openCamera.description': 'Open camera',
  'pages.camera.fetchAlbumPhotos.description': 'Fetch photos from album',
  'pages.camera.fetchAlbumItems.description': 'Fetch photos and videos from album',

  // ContactsPage
  'pages.contacts.fetchContacts.description': 'Fetch contacts',

  // PermissionsPage
  'pages.permissions.getPermission.description': 'Query permission status',
  'pages.permissions.openPermissionDialog.description': 'Open permission request dialog',
  'pages.permissions.requestPermission.description': 'Request permission',

  // StoragePage
  'pages.storage.setItem.description': 'Store a value',
  'pages.storage.getItem.description': 'Retrieve a value',
  'pages.storage.removeItem.description': 'Delete a value',
  'pages.storage.clearItems.description': 'Delete all values',
  'pages.storage.saveBase64Data.description': 'SDK — save Base64 data',

  // AnalyticsPage
  'pages.analytics.screen.description': 'Screen view log',
  'pages.analytics.impression.description': 'Impression log',
  'pages.analytics.click.description': 'Click log',
  'pages.analytics.eventLog.description': 'Custom event log',

  // GamePage
  'pages.game.grantPromotionReward.description': 'Grant promotion reward',
  'pages.game.grantPromotionRewardForGame.description': 'Grant game promotion reward',
  'pages.game.submitGameCenterLeaderBoardScore.description': 'Submit leaderboard score',
  'pages.game.getGameCenterGameProfile.description': 'Fetch game profile',
  'pages.game.openGameCenterLeaderboard.description': 'Open leaderboard',
  'pages.game.contactsViral.description': 'Contacts viral sharing',

  // AdsPage
  'pages.ads.reset': 'Reset',
  'pages.ads.resetAriaLabel': 'Reset GoogleAdMob workflow',
  'pages.ads.tossAdsInitialize.description': 'Initialize TossAds',
  'pages.ads.tossAdsAttach.description':
    'Attach banner slot (deprecated — use attachBanner instead)',
  'pages.ads.tossAdsAttachBanner.description':
    'Attach banner slot — call the returned destroy() to detach',
  'pages.ads.tossAdsDestroy.description': 'Remove a specific slot by ID',
  'pages.ads.tossAdsDestroyAll.description': 'Remove all TossAds slots',
  'pages.ads.loadFullScreenAd.description': 'Load full-screen ad — emits multiple events',
  'pages.ads.showFullScreenAd.description': 'Show full-screen ad — emits multiple events',
  'pages.ads.isAppsInTossAdMobLoaded.description': 'Check whether an AdMob ad is loaded',

  // EventsPage
  'pages.events.subscribing': 'Subscribed',
  'pages.events.notSubscribed': 'Not subscribed',
  'pages.events.unsubscribe': 'Unsubscribe',
  'pages.events.subscribe': 'Subscribe',
  'pages.events.reserved': 'Reserved',
  'pages.events.graniteBackEvent.description': 'Subscribe to back button events',
  'pages.events.graniteHomeEvent.description': 'Subscribe to home button events',
  'pages.events.tdsNavigationAccessoryEvent.description':
    'Subscribe to top navigation accessory button events',
  'pages.events.onVisibilityChangedByTransparentServiceWeb.description':
    'Subscribe to transparent service web visibility change events',
  'pages.events.appsInTossEventAddEventListener.description':
    'Subscribe to Apps in Toss platform events — no event keys are defined in the current SDK version; reserved for future use',

  // NotificationPage
  'pages.notification.requestNotificationAgreement.description':
    'Show push notification consent UI — 3-way result: newAgreement / alreadyAgreed / agreementRejected',

  // PartnerPage
  'pages.partner.addAccessoryButton.description': 'Add an accessory button',
  'pages.partner.removeAccessoryButton.description': 'Remove an accessory button',

  // PaymentPage
  'pages.payment.requestTossPayPaysBilling.description':
    'Authenticate TossPay recurring payment via wrappedToken — actual charge is handled server-side',
} as const;
