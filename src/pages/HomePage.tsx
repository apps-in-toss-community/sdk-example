import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n';

const domains = [
  // SCAFFOLD_DOMAIN_ENTRIES_BEGIN
  {
    path: '/auth',
    name: 'Auth',
    description: 'appLogin, getAnonymousKey 등',
    apis: [
      'appLogin',
      'getIsTossLoginIntegratedService',
      'getUserKeyForGame',
      'getAnonymousKey',
      'appsInTossSignTossCert',
    ],
  },
  {
    path: '/navigation',
    name: 'Navigation',
    description: 'closeView, openURL, share 등',
    apis: [
      'closeView',
      'openURL',
      'openPDFViewer',
      'share',
      'getTossShareLink',
      'setIosSwipeGestureEnabled',
      'setDeviceOrientation',
      'setScreenAwakeMode',
      'setSecureScreen',
      'requestReview',
    ],
  },
  {
    path: '/environment',
    name: 'Environment',
    description: 'getPlatformOS, getNetworkStatus 등',
    apis: [
      'getPlatformOS',
      'getOperationalEnvironment',
      'getNetworkStatus',
      'getTossAppVersion',
      'isMinVersionSupported',
      'getSchemeUri',
      'getLocale',
      'getDeviceId',
      'getGroupId',
      'getServerTime',
      'env.getDeploymentId',
      'getAppsInTossGlobals',
      'SafeAreaInsets',
      'getSafeAreaInsets',
    ],
  },
  {
    path: '/permissions',
    name: 'Permissions',
    description: 'getPermission, openPermissionDialog 등',
    apis: ['getPermission', 'openPermissionDialog', 'requestPermission'],
  },
  {
    path: '/storage',
    name: 'Storage',
    description: 'setItem, getItem, removeItem, saveBase64Data 등',
    apis: ['setItem', 'getItem', 'removeItem', 'clearItems', 'saveBase64Data'],
  },
  {
    path: '/location',
    name: 'Location',
    description: 'getCurrentLocation, startUpdateLocation',
    apis: ['getCurrentLocation', 'startUpdateLocation'],
  },
  {
    path: '/camera',
    name: 'Camera & Photos',
    description: 'openCamera, fetchAlbumPhotos, fetchAlbumItems',
    apis: ['openCamera', 'fetchAlbumPhotos', 'fetchAlbumItems'],
  },
  { path: '/contacts', name: 'Contacts', description: 'fetchContacts', apis: ['fetchContacts'] },
  {
    path: '/clipboard',
    name: 'Clipboard',
    description: 'getClipboardText, setClipboardText',
    apis: ['getClipboardText', 'setClipboardText'],
  },
  {
    path: '/haptic',
    name: 'Haptic',
    description: 'generateHapticFeedback',
    apis: ['generateHapticFeedback'],
  },
  {
    path: '/iap',
    name: 'IAP',
    description: '상품 조회, 구매, 주문 관리',
    apis: [
      'getProductItemList',
      'createOneTimePurchaseOrder',
      'createSubscriptionPurchaseOrder',
      'getPendingOrders',
      'getCompletedOrRefundedOrders',
      'getSubscriptionInfo',
      'completeProductGrant',
      'checkoutPayment',
    ],
  },
  {
    path: '/ads',
    name: 'Ads',
    description: 'GoogleAdMob, TossAds, FullScreenAd',
    apis: [
      'loadAppsInTossAdMob',
      'showAppsInTossAdMob',
      'isAppsInTossAdMobLoaded',
      'initialize',
      'attach',
      'attachBanner',
      'destroy',
      'destroyAll',
      'loadFullScreenAd',
      'showFullScreenAd',
    ],
  },
  {
    path: '/game',
    name: 'Game',
    description: '게임센터, 프로모션, contactsViral',
    apis: [
      'grantPromotionReward',
      'grantPromotionRewardForGame',
      'submitGameCenterLeaderBoardScore',
      'getGameCenterGameProfile',
      'openGameCenterLeaderboard',
      'contactsViral',
    ],
  },
  {
    path: '/analytics',
    name: 'Analytics',
    description: 'screen, impression, click, eventLog',
    apis: ['screen', 'impression', 'click', 'eventLog'],
  },
  {
    path: '/partner',
    name: 'Partner',
    description: 'addAccessoryButton, removeAccessoryButton',
    apis: ['addAccessoryButton', 'removeAccessoryButton'],
  },
  {
    path: '/events',
    name: 'Events',
    description: 'graniteEvent, tdsEvent, appsInTossEvent',
    apis: [
      'graniteEvent.addEventListener',
      'tdsEvent.addEventListener',
      'appsInTossEvent.addEventListener',
    ],
  },
  {
    path: '/payment',
    name: 'Payment',
    description: '토스페이 정기결제창 — wrappedToken으로 사용자 인증 (실제 결제는 서버)',
    apis: ['requestTossPayPaysBilling'],
  },
  {
    path: '/notification',
    name: 'Notification',
    description: '푸시 알림 동의 — newAgreement/alreadyAgreed/agreementRejected 3-way 결과',
    apis: ['requestNotificationAgreement'],
  },
  // SCAFFOLD_DOMAIN_ENTRIES_END
];

interface ApiHit {
  api: string;
  domainName: string;
  path: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const query = search.trim().toLowerCase();

  // 대분류 카드 필터링은 빈 검색어 또는 dropdown 닫혔을 때만 의미. 검색어가
  // 있을 땐 dropdown 이 소분류 진입 UI 를 대신한다.
  const filteredDomains = domains.filter(
    (d) =>
      !query || d.name.toLowerCase().includes(query) || d.description.toLowerCase().includes(query),
  );

  // 검색어가 있을 때 후보 API 들을 평탄화. 매칭은 (대분류 이름 | 설명 | API 이름)
  // 중 어디든 걸리면 hit. 대분류 매칭이면 그 대분류의 모든 API 를 listing 하는게
  // 아니라 — 대분류 카드가 별도 표시되니 — API 이름 매칭만 dropdown 에 노출.
  const apiHits = useMemo<ApiHit[]>(() => {
    if (!query) return [];
    const hits: ApiHit[] = [];
    for (const d of domains) {
      for (const api of d.apis) {
        if (api.toLowerCase().includes(query)) {
          hits.push({ api, domainName: d.name, path: d.path });
        }
      }
    }
    return hits.slice(0, 30);
  }, [query]);

  function goToApi(hit: ApiHit) {
    setOpen(false);
    setSearch('');
    navigate(`${hit.path}#api-${hit.api}`);
  }

  const showDropdown = open && query.length > 0 && apiHits.length > 0;

  return (
    <div className="px-4 pb-8">
      <div
        className="sticky z-10 bg-white pt-4 pb-3 border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800"
        style={{ top: 'var(--safe-top, 0px)' }}
      >
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t('homePage.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('homePage.subtitle')}</p>
        <div className="relative mt-3 flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // dropdown 항목 클릭이 blur 보다 먼저 처리되도록 약간 지연
              setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && apiHits.length > 0) {
                e.preventDefault();
                const first = apiHits[0];
                if (first) goToApi(first);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder={t('homePage.searchPlaceholder')}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setOpen(false);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t('homePage.searchReset')}
            </button>
          )}
          {showDropdown && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {apiHits.map((hit) => (
                <li key={`${hit.path}-${hit.api}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // blur 보다 먼저 동작해야 navigate 가 살아남는다
                      e.preventDefault();
                      goToApi(hit);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="font-mono text-gray-900 dark:text-gray-100">{hit.api}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {hit.domainName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filteredDomains.map((d) => (
          <Link
            key={d.path}
            to={d.path}
            className="block rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.name}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('homePage.apiCount', { count: d.apis.length })}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{d.description}</p>
          </Link>
        ))}
        {filteredDomains.length === 0 && apiHits.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            {t('homePage.noResults')}
          </p>
        )}
      </div>
    </div>
  );
}
