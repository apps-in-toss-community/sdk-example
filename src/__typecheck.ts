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
  appsInTossEvent,
  env,
  fetchAlbumPhotos,
  fetchContacts,
  GoogleAdMob,
  getAppsInTossGlobals,
  getClipboardText,
  getCurrentLocation,
  getSafeAreaInsets,
  getServerTime,
  graniteEvent,
  IAP,
  isMinVersionSupported,
  loadFullScreenAd,
  openCamera,
  partner,
  requestReview,
  SafeAreaInsets,
  Storage,
  setClipboardText,
  showFullScreenAd,
  startUpdateLocation,
  TossAds,
  tdsEvent,
} from '@apps-in-toss/web-framework';

export type _Storage = typeof Storage;
export type _Accuracy = typeof Accuracy;
export type _getCurrentLocation = typeof getCurrentLocation;
export type _startUpdateLocation = typeof startUpdateLocation;
export type _openCamera = typeof openCamera;
export type _fetchAlbumPhotos = typeof fetchAlbumPhotos;
export type _fetchContacts = typeof fetchContacts;
export type _getClipboardText = typeof getClipboardText;
export type _setClipboardText = typeof setClipboardText;
export type _SafeAreaInsets = typeof SafeAreaInsets;
export type _getSafeAreaInsets = typeof getSafeAreaInsets;
export type _isMinVersionSupported = typeof isMinVersionSupported;
export type _getServerTime = typeof getServerTime;
export type _requestReview = typeof requestReview;
export type _getAppsInTossGlobals = typeof getAppsInTossGlobals;
export type _graniteEvent = typeof graniteEvent;
export type _appsInTossEvent = typeof appsInTossEvent;
export type _tdsEvent = typeof tdsEvent;
export type _env = typeof env;
export type _GoogleAdMob = typeof GoogleAdMob;
export type _TossAds = typeof TossAds;
export type _loadFullScreenAd = typeof loadFullScreenAd;
export type _showFullScreenAd = typeof showFullScreenAd;
export type _IAP = typeof IAP;
export type _partner = typeof partner;
export type _Analytics = typeof Analytics;

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
  CompletedOrRefundedOrdersResult,
  ConsumableProductListItem,
  ContactEntity,
  ContactResult,
  CreateSubscriptionPurchaseOrderOptions,
  FetchAlbumPhotos,
  FetchAlbumPhotosOptions,
  FetchContacts,
  FetchContactsOptions,
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
  OpenCamera,
  OpenCameraOptions,
  PermissionAccess,
  PermissionDialogFunction,
  PermissionFunctionName,
  PermissionFunctionWithDialog,
  PermissionName,
  PermissionStatus,
  RequestPermissionFunction,
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
  CompletedOrRefundedOrdersResult,
  ConsumableProductListItem,
  CreateSubscriptionPurchaseOrderOptions,
  GraniteEvent,
  HapticFeedbackType,
  IapCreateOneTimePurchaseOrderOptions,
  IapProductListItem,
  IapSubscriptionInfoResponse,
  IapSubscriptionInfoResult,
  NonConsumableProductListItem,
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
  RequestPermissionFunction,
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
