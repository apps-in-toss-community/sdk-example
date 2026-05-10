/**
 * OG manifest — single source of truth for static OG images and per-route HTML.
 *
 * Used by:
 *  - scripts/build-og-images.tsx → emits public/og/<slug>.png
 *  - scripts/build-route-html.ts → emits dist/<slug>/index.html with route-specific
 *    og:* / twitter:* meta pointing at the matching PNG.
 *
 * The slugs here mirror the route paths from src/App.tsx (without the leading
 * slash; "home" stands in for "/"). Adding a new domain page means adding an
 * entry here; the OG/HTML pipeline picks it up on the next build.
 */

export interface OgEntry {
  /** URL slug, also the PNG filename. "home" ↔ route "/", others ↔ "/<slug>". */
  slug: string;
  /** Route path used by build-route-html.ts ("/" or "/<slug>"). */
  route: string;
  /** Small label above the title (e.g. "SDK Reference"). */
  eyebrow: string;
  /** Big title rendered in the OG image and used as og:title / <title>. */
  title: string;
  /** Tagline rendered in the OG image and used as og:description. */
  subtitle: string;
  /** Footer line in the OG image (e.g. "sdk-example.aitc.dev"). */
  footer: string;
}

const SITE = 'sdk-example.aitc.dev';

export const HOME_ENTRY: OgEntry = {
  slug: 'home',
  route: '/',
  eyebrow: 'SDK Reference',
  title: 'sdk-example',
  subtitle: '@apps-in-toss/web-framework SDK를 인터랙티브하게 실행·확인.',
  footer: SITE,
};

export const GROUP_ENTRIES: OgEntry[] = [
  {
    slug: 'auth',
    route: '/auth',
    eyebrow: 'SDK · Auth',
    title: 'Auth',
    subtitle: 'appLogin, getUserKeyForGame, OIDC bridge 데모.',
    footer: `${SITE}/auth`,
  },
  {
    slug: 'navigation',
    route: '/navigation',
    eyebrow: 'SDK · Navigation',
    title: 'Navigation',
    subtitle: 'closeView, openURL, share, requestReview.',
    footer: `${SITE}/navigation`,
  },
  {
    slug: 'environment',
    route: '/environment',
    eyebrow: 'SDK · Environment',
    title: 'Environment',
    subtitle: 'platformOS, networkStatus, locale, SafeAreaInsets.',
    footer: `${SITE}/environment`,
  },
  {
    slug: 'permissions',
    route: '/permissions',
    eyebrow: 'SDK · Permissions',
    title: 'Permissions',
    subtitle: 'getPermission, openPermissionDialog, requestPermission.',
    footer: `${SITE}/permissions`,
  },
  {
    slug: 'storage',
    route: '/storage',
    eyebrow: 'SDK · Storage',
    title: 'Storage',
    subtitle: '미니앱 영구 저장소 — setItem, getItem, removeItem.',
    footer: `${SITE}/storage`,
  },
  {
    slug: 'location',
    route: '/location',
    eyebrow: 'SDK · Location',
    title: 'Location',
    subtitle: 'getCurrentLocation, startUpdateLocation.',
    footer: `${SITE}/location`,
  },
  {
    slug: 'camera',
    route: '/camera',
    eyebrow: 'SDK · Camera',
    title: 'Camera & Photos',
    subtitle: 'openCamera, fetchAlbumPhotos.',
    footer: `${SITE}/camera`,
  },
  {
    slug: 'contacts',
    route: '/contacts',
    eyebrow: 'SDK · Contacts',
    title: 'Contacts',
    subtitle: 'fetchContacts.',
    footer: `${SITE}/contacts`,
  },
  {
    slug: 'clipboard',
    route: '/clipboard',
    eyebrow: 'SDK · Clipboard',
    title: 'Clipboard',
    subtitle: 'getClipboardText, setClipboardText.',
    footer: `${SITE}/clipboard`,
  },
  {
    slug: 'haptic',
    route: '/haptic',
    eyebrow: 'SDK · Haptic',
    title: 'Haptic',
    subtitle: 'generateHapticFeedback, saveBase64Data.',
    footer: `${SITE}/haptic`,
  },
  {
    slug: 'iap',
    route: '/iap',
    eyebrow: 'SDK · IAP',
    title: 'IAP',
    subtitle: '상품 조회 → 구매 → 주문 관리 워크플로우.',
    footer: `${SITE}/iap`,
  },
  {
    slug: 'ads',
    route: '/ads',
    eyebrow: 'SDK · Ads',
    title: 'Ads',
    subtitle: 'GoogleAdMob, TossAds, FullScreenAd.',
    footer: `${SITE}/ads`,
  },
  {
    slug: 'game',
    route: '/game',
    eyebrow: 'SDK · Game',
    title: 'Game',
    subtitle: '게임센터, 프로모션 리워드, contactsViral.',
    footer: `${SITE}/game`,
  },
  {
    slug: 'analytics',
    route: '/analytics',
    eyebrow: 'SDK · Analytics',
    title: 'Analytics',
    subtitle: 'screen, impression, click, eventLog.',
    footer: `${SITE}/analytics`,
  },
  {
    slug: 'partner',
    route: '/partner',
    eyebrow: 'SDK · Partner',
    title: 'Partner',
    subtitle: 'addAccessoryButton, removeAccessoryButton.',
    footer: `${SITE}/partner`,
  },
  {
    slug: 'events',
    route: '/events',
    eyebrow: 'SDK · Events',
    title: 'Events',
    subtitle: 'graniteEvent, tdsEvent, visibility 구독.',
    footer: `${SITE}/events`,
  },
];

export const ALL_ENTRIES: OgEntry[] = [HOME_ENTRY, ...GROUP_ENTRIES];
