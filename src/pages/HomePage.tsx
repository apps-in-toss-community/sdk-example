import { useState } from 'react';
import { Link } from 'react-router-dom';

const domains = [
  { path: '/auth', name: 'Auth', description: 'appLogin, getUserKeyForGame 등', apis: ['appLogin', 'getIsTossLoginIntegratedService', 'getUserKeyForGame', 'appsInTossSignTossCert'] },
  { path: '/navigation', name: 'Navigation', description: 'closeView, openURL, share 등', apis: ['closeView', 'openURL', 'share', 'getTossShareLink', 'setIosSwipeGestureEnabled', 'setDeviceOrientation', 'setScreenAwakeMode', 'setSecureScreen', 'requestReview'] },
  { path: '/environment', name: 'Environment', description: 'getPlatformOS, getNetworkStatus 등', apis: ['getPlatformOS', 'getOperationalEnvironment', 'getNetworkStatus', 'getTossAppVersion', 'isMinVersionSupported', 'getSchemeUri', 'getLocale', 'getDeviceId', 'getGroupId', 'getServerTime', 'env.getDeploymentId', 'getAppsInTossGlobals', 'SafeAreaInsets', 'getSafeAreaInsets'] },
  { path: '/permissions', name: 'Permissions', description: 'getPermission, openPermissionDialog 등', apis: ['getPermission', 'openPermissionDialog', 'requestPermission'] },
  { path: '/storage', name: 'Storage', description: 'setItem, getItem, removeItem 등', apis: ['setItem', 'getItem', 'removeItem', 'clearItems'] },
  { path: '/location', name: 'Location', description: 'getCurrentLocation, startUpdateLocation', apis: ['getCurrentLocation', 'startUpdateLocation'] },
  { path: '/camera', name: 'Camera & Photos', description: 'openCamera, fetchAlbumPhotos', apis: ['openCamera', 'fetchAlbumPhotos'] },
  { path: '/contacts', name: 'Contacts', description: 'fetchContacts', apis: ['fetchContacts'] },
  { path: '/clipboard', name: 'Clipboard', description: 'getClipboardText, setClipboardText', apis: ['getClipboardText', 'setClipboardText'] },
  { path: '/haptic', name: 'Haptic', description: 'generateHapticFeedback, saveBase64Data', apis: ['generateHapticFeedback', 'saveBase64Data'] },
  { path: '/iap', name: 'IAP', description: '상품 조회, 구매, 주문 관리', apis: ['getProductItemList', 'createOneTimePurchaseOrder', 'createSubscriptionPurchaseOrder', 'getPendingOrders', 'getCompletedOrRefundedOrders', 'getSubscriptionInfo', 'checkoutPayment'] },
  { path: '/ads', name: 'Ads', description: 'GoogleAdMob, TossAds, FullScreenAd', apis: ['loadAppsInTossAdMob', 'showAppsInTossAdMob', 'isAppsInTossAdMobLoaded', 'initialize', 'attach', 'attachBanner', 'destroy', 'destroyAll', 'loadFullScreenAd', 'showFullScreenAd'] },
  { path: '/game', name: 'Game', description: '게임센터, 프로모션, contactsViral', apis: ['grantPromotionReward', 'grantPromotionRewardForGame', 'submitGameCenterLeaderBoardScore', 'getGameCenterGameProfile', 'openGameCenterLeaderboard', 'contactsViral'] },
  { path: '/analytics', name: 'Analytics', description: 'screen, impression, click, eventLog', apis: ['screen', 'impression', 'click', 'eventLog'] },
  { path: '/partner', name: 'Partner', description: 'addAccessoryButton, removeAccessoryButton', apis: ['addAccessoryButton', 'removeAccessoryButton'] },
  { path: '/events', name: 'Events', description: 'graniteEvent, tdsEvent, onVisibilityChangedByTransparentServiceWeb', apis: ['graniteEvent.addEventListener', 'tdsEvent.addEventListener', 'onVisibilityChangedByTransparentServiceWeb'] },
];

export function HomePage() {
  const [search, setSearch] = useState('');
  const query = search.toLowerCase();

  const filtered = domains.filter(
    (d) =>
      d.name.toLowerCase().includes(query) ||
      d.description.toLowerCase().includes(query) ||
      d.apis.some((api) => api.toLowerCase().includes(query))
  );

  return (
    <div className="px-4 pb-8">
      <div className="sticky top-0 z-10 bg-white pt-4 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">SDK Example</h1>
        <p className="mt-1 text-sm text-gray-500">@apps-in-toss/web-framework</p>
        <div className="mt-3 flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="API 이름으로 검색..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {filtered.map((d) => (
          <Link
            key={d.path}
            to={d.path}
            className="block rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">{d.name}</h2>
              <span className="text-xs text-gray-400">{d.apis.length} APIs</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{d.description}</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">검색 결과가 없습니다</p>
        )}
      </div>
    </div>
  );
}
