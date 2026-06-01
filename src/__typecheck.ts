/**
 * SDK export coverage typecheck
 *
 * 빌드에 포함되지 않는다. tsc --noEmit으로만 실행.
 * @apps-in-toss/web-framework의 모든 public export가 여기 나열되어 있다.
 * SDK가 업데이트되어 새 export가 추가됐는데 여기 없으면 tsc --noEmit이 실패한다.
 */

// biome-ignore-all lint/style/useImportType: this file's whole purpose is value-import coverage —
// `typeof X` on a value import catches the "SDK export turned type-only" regression; converting
// to `import type` would silently weaken that guarantee.
import {
  Accuracy,
  Analytics,
  appLogin,
  appsInTossEvent,
  appsInTossSignTossCert,
  checkoutPayment,
  closeView,
  contactsViral,
  env,
  eventLog,
  FetchAlbumPhotosPermissionError,
  FetchContactsPermissionError,
  fetchAlbumItems,
  fetchAlbumPhotos,
  fetchContacts,
  GetClipboardTextPermissionError,
  GetCurrentLocationPermissionError,
  GoogleAdMob,
  generateHapticFeedback,
  getAnonymousKey,
  getAppsInTossGlobals,
  getClipboardText,
  getCurrentLocation,
  getDeviceId,
  getGroupId,
  getLocale,
  getNetworkStatus,
  getOperationalEnvironment,
  getPermission,
  getPlatformOS,
  getSafeAreaInsets,
  getSchemeUri,
  getServerTime,
  getTossAppVersion,
  getTossShareLink,
  graniteEvent,
  IAP,
  isMinVersionSupported,
  loadFullScreenAd,
  OpenCameraPermissionError,
  openCamera,
  openPDFViewer,
  openPermissionDialog,
  openURL,
  PermissionError,
  partner,
  requestNotificationAgreement,
  requestPermission,
  requestReview,
  requestTossPayPaysBilling,
  SafeAreaInsets,
  SetClipboardTextPermissionError,
  StartUpdateLocationPermissionError,
  Storage,
  setClipboardText,
  setDeviceOrientation,
  setIosSwipeGestureEnabled,
  setScreenAwakeMode,
  setSecureScreen,
  share,
  showFullScreenAd,
  startUpdateLocation,
  TossAds,
  tdsEvent,
} from '@apps-in-toss/web-framework';

export type _Accuracy = typeof Accuracy;
export type _Analytics = typeof Analytics;
export type _appLogin = typeof appLogin;
export type _appsInTossEvent = typeof appsInTossEvent;
export type _appsInTossSignTossCert = typeof appsInTossSignTossCert;
export type _checkoutPayment = typeof checkoutPayment;
export type _closeView = typeof closeView;
export type _contactsViral = typeof contactsViral;
export type _env = typeof env;
export type _eventLog = typeof eventLog;
export type _fetchAlbumItems = typeof fetchAlbumItems;
export type _fetchAlbumPhotos = typeof fetchAlbumPhotos;
export type _fetchContacts = typeof fetchContacts;
export type _FetchAlbumPhotosPermissionError = typeof FetchAlbumPhotosPermissionError;
export type _FetchContactsPermissionError = typeof FetchContactsPermissionError;
export type _generateHapticFeedback = typeof generateHapticFeedback;
export type _getAnonymousKey = typeof getAnonymousKey;
export type _getAppsInTossGlobals = typeof getAppsInTossGlobals;
export type _getClipboardText = typeof getClipboardText;
export type _GetClipboardTextPermissionError = typeof GetClipboardTextPermissionError;
export type _getCurrentLocation = typeof getCurrentLocation;
export type _GetCurrentLocationPermissionError = typeof GetCurrentLocationPermissionError;
export type _getDeviceId = typeof getDeviceId;
export type _getGroupId = typeof getGroupId;
export type _getLocale = typeof getLocale;
export type _getNetworkStatus = typeof getNetworkStatus;
export type _getOperationalEnvironment = typeof getOperationalEnvironment;
export type _getPermission = typeof getPermission;
export type _getPlatformOS = typeof getPlatformOS;
export type _getSafeAreaInsets = typeof getSafeAreaInsets;
export type _getSchemeUri = typeof getSchemeUri;
export type _getServerTime = typeof getServerTime;
export type _getTossAppVersion = typeof getTossAppVersion;
export type _getTossShareLink = typeof getTossShareLink;
export type _GoogleAdMob = typeof GoogleAdMob;
export type _graniteEvent = typeof graniteEvent;
export type _IAP = typeof IAP;
export type _isMinVersionSupported = typeof isMinVersionSupported;
export type _loadFullScreenAd = typeof loadFullScreenAd;
export type _openCamera = typeof openCamera;
export type _OpenCameraPermissionError = typeof OpenCameraPermissionError;
export type _openPDFViewer = typeof openPDFViewer;
export type _openPermissionDialog = typeof openPermissionDialog;
export type _openURL = typeof openURL;
export type _PermissionError = typeof PermissionError;
export type _partner = typeof partner;
export type _requestNotificationAgreement = typeof requestNotificationAgreement;
export type _requestPermission = typeof requestPermission;
export type _requestReview = typeof requestReview;
export type _requestTossPayPaysBilling = typeof requestTossPayPaysBilling;
export type _SafeAreaInsets = typeof SafeAreaInsets;
export type _setClipboardText = typeof setClipboardText;
export type _SetClipboardTextPermissionError = typeof SetClipboardTextPermissionError;
export type _setDeviceOrientation = typeof setDeviceOrientation;
export type _setIosSwipeGestureEnabled = typeof setIosSwipeGestureEnabled;
export type _setScreenAwakeMode = typeof setScreenAwakeMode;
export type _setSecureScreen = typeof setSecureScreen;
export type _share = typeof share;
export type _showFullScreenAd = typeof showFullScreenAd;
export type _startUpdateLocation = typeof startUpdateLocation;
export type _StartUpdateLocationPermissionError = typeof StartUpdateLocationPermissionError;
export type _Storage = typeof Storage;
export type _tdsEvent = typeof tdsEvent;
export type _TossAds = typeof TossAds;

// Type-only imports — used in the _SdkTypes alias below
import type {
  // web-bridge named types
  AddAccessoryButtonOptions,
  // @apps-in-toss/types (re-exported via web-bridge)
  AdMobFullScreenEvent,
  AdMobHandlerParams,
  AdMobLoadResult,
  AdNetworkResponseInfo,
  AdUserEarnedReward,
  AppsInTossEvent,
  AppsInTossGlobals,
  AppsInTossSignTossCertParams,
  CompletedOrRefundedOrdersResult,
  ConsumableProductListItem,
  ContactEntity,
  ContactResult,
  ContactsViralOption,
  CreateSubscriptionPurchaseOrderOptions,
  FetchAlbumPhotos,
  FetchAlbumPhotosOptions,
  FetchContacts,
  FetchContactsOptions,
  GetAnonymousKeyResponse,
  GetClipboardText,
  GetCurrentLocation,
  GetCurrentLocationOptions,
  GraniteEvent,
  HapticFeedbackType,
  IapCreateOneTimePurchaseOrderOptions,
  IapProductListItem,
  IapSubscriptionInfoResponse,
  IapSubscriptionInfoResult,
  ImageResponse,
  InterstitialAd,
  IsAdMobLoadedOptions,
  LoadAdMobEvent,
  LoadAdMobOptions,
  LoadAdMobParams,
  LoadFullScreenAdEvent,
  LoadFullScreenAdOptions,
  LoadFullScreenAdParams,
  Location,
  LocationCoords,
  NonConsumableProductListItem,
  NotificationAgreementResult,
  OpenCamera,
  OpenCameraOptions,
  PermissionAccess,
  PermissionDialogFunction,
  PermissionFunctionName,
  PermissionFunctionWithDialog,
  PermissionName,
  PermissionStatus,
  RequestNotificationAgreementOptions,
  ResponseInfo,
  RewardedAd,
  SetClipboardText,
  SetClipboardTextOptions,
  ShowAdMobEvent,
  ShowAdMobOptions,
  ShowAdMobParams,
  ShowFullScreenAdEvent,
  ShowFullScreenAdOptions,
  ShowFullScreenAdParams,
  StartUpdateLocation,
  StartUpdateLocationEventParams,
  StartUpdateLocationOptions,
  SubscriptionProductListItem,
  TdsEvent,
  TossAdEventLogParams,
  TossAdsAttachBannerOptions,
  TossAdsAttachBannerResult,
  TossAdsAttachOptions,
  TossAdsBannerSlotCallbacks,
  TossAdsBannerSlotErrorPayload,
  TossAdsBannerSlotEventPayload,
  TossAdsInitializeOptions,
} from '@apps-in-toss/web-framework';

// Exported type alias satisfies noUnusedLocals for all type imports above.
// PermissionFunctionWithDialog<never> satisfies the generic type constraint.
export type _SdkTypes = [
  AddAccessoryButtonOptions,
  AppsInTossEvent,
  AppsInTossGlobals,
  AppsInTossSignTossCertParams,
  CompletedOrRefundedOrdersResult,
  ConsumableProductListItem,
  ContactsViralOption,
  CreateSubscriptionPurchaseOrderOptions,
  GetAnonymousKeyResponse,
  GraniteEvent,
  HapticFeedbackType,
  IapCreateOneTimePurchaseOrderOptions,
  IapProductListItem,
  IapSubscriptionInfoResponse,
  IapSubscriptionInfoResult,
  NonConsumableProductListItem,
  NotificationAgreementResult,
  RequestNotificationAgreementOptions,
  SubscriptionProductListItem,
  TdsEvent,
  TossAdsAttachBannerOptions,
  TossAdsAttachBannerResult,
  TossAdsAttachOptions,
  TossAdsBannerSlotCallbacks,
  TossAdsBannerSlotErrorPayload,
  TossAdsBannerSlotEventPayload,
  TossAdsInitializeOptions,
  AdMobFullScreenEvent,
  AdMobHandlerParams,
  AdMobLoadResult,
  AdNetworkResponseInfo,
  AdUserEarnedReward,
  ContactEntity,
  ContactResult,
  FetchAlbumPhotos,
  FetchAlbumPhotosOptions,
  FetchContacts,
  FetchContactsOptions,
  GetClipboardText,
  GetCurrentLocation,
  GetCurrentLocationOptions,
  ImageResponse,
  InterstitialAd,
  IsAdMobLoadedOptions,
  LoadAdMobEvent,
  LoadAdMobOptions,
  LoadAdMobParams,
  LoadFullScreenAdEvent,
  LoadFullScreenAdOptions,
  LoadFullScreenAdParams,
  Location,
  LocationCoords,
  OpenCamera,
  OpenCameraOptions,
  PermissionAccess,
  PermissionDialogFunction,
  PermissionFunctionName,
  PermissionFunctionWithDialog<never>,
  PermissionName,
  PermissionStatus,
  ResponseInfo,
  RewardedAd,
  SetClipboardText,
  SetClipboardTextOptions,
  ShowAdMobEvent,
  ShowAdMobOptions,
  ShowAdMobParams,
  ShowFullScreenAdEvent,
  ShowFullScreenAdOptions,
  ShowFullScreenAdParams,
  StartUpdateLocation,
  StartUpdateLocationEventParams,
  StartUpdateLocationOptions,
  TossAdEventLogParams,
];
