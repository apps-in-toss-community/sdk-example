/**
 * SDK export coverage typecheck
 *
 * 빌드에 포함되지 않는다. tsc --noEmit으로만 실행.
 * @apps-in-toss/web-framework의 모든 public export가 여기 나열되어 있다.
 * SDK가 업데이트되어 새 export가 추가됐는데 여기 없으면 tsc --noEmit이 실패한다.
 */

// Value imports — `void` prevents "unused local" errors
import {
  Storage,
  Accuracy,
  getCurrentLocation,
  startUpdateLocation,
  openCamera,
  fetchAlbumPhotos,
  fetchContacts,
  getClipboardText,
  setClipboardText,
  SafeAreaInsets,
  getSafeAreaInsets,
  isMinVersionSupported,
  getServerTime,
  requestReview,
  getAppsInTossGlobals,
  graniteEvent,
  appsInTossEvent,
  tdsEvent,
  env,
  GoogleAdMob,
  TossAds,
  loadFullScreenAd,
  showFullScreenAd,
  IAP,
  partner,
  Analytics,
} from '@apps-in-toss/web-framework';

void Storage;
void Accuracy;
void getCurrentLocation;
void startUpdateLocation;
void openCamera;
void fetchAlbumPhotos;
void fetchContacts;
void getClipboardText;
void setClipboardText;
void SafeAreaInsets;
void getSafeAreaInsets;
void isMinVersionSupported;
void getServerTime;
void requestReview;
void getAppsInTossGlobals;
void graniteEvent;
void appsInTossEvent;
void tdsEvent;
void env;
void GoogleAdMob;
void TossAds;
void loadFullScreenAd;
void showFullScreenAd;
void IAP;
void partner;
void Analytics;

// Type-only imports — used in the _SdkTypes alias below
import type {
  // web-bridge named types
  AddAccessoryButtonOptions,
  AppsInTossEvent,
  AppsInTossGlobals,
  CompletedOrRefundedOrdersResult,
  ConsumableProductListItem,
  CreateSubscriptionPurchaseOrderOptions,
  GraniteEvent,
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
  // @apps-in-toss/types (re-exported via web-bridge)
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
  TossAdEventLogParams,
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
