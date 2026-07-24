import {
  GoogleAdMob,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
} from '@apps-in-toss/web-framework';
import { useCallback, useRef, useState } from 'react';
import { ApiCard } from '../components/ApiCard';
import { CodeSnippet } from '../components/CodeSnippet';
import { DocsLink } from '../components/DocsLink';
import {
  appendHistory,
  createHistoryEntry,
  type HistoryEntry,
  HistoryLog,
} from '../components/HistoryLog';
import { PageHeader } from '../components/PageHeader';
import { ParamInput } from '../components/ParamInput';
import { ResultView } from '../components/ResultView';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { AD_REAL_PLACEMENT_GROUPS } from '../constants';
import { type StringKey, t } from '../i18n';
import { docsLink } from '../lib/docs';
import isAppsInTossAdMobLoadedSnippet from '../snippets/ads/isAppsInTossAdMobLoaded.ts?raw';
import loadAppsInTossAdMobSnippet from '../snippets/ads/loadAppsInTossAdMob.ts?raw';
import loadFullScreenAdSnippet from '../snippets/ads/loadFullScreenAd.ts?raw';
import showAppsInTossAdMobSnippet from '../snippets/ads/showAppsInTossAdMob.ts?raw';
import showFullScreenAdSnippet from '../snippets/ads/showFullScreenAd.ts?raw';
import tossAdsAttachSnippet from '../snippets/ads/tossAdsAttach.ts?raw';
import tossAdsAttachBannerSnippet from '../snippets/ads/tossAdsAttachBanner.ts?raw';
import tossAdsDestroySnippet from '../snippets/ads/tossAdsDestroy.ts?raw';
import tossAdsDestroyAllSnippet from '../snippets/ads/tossAdsDestroyAll.ts?raw';
import tossAdsInitializeSnippet from '../snippets/ads/tossAdsInitialize.ts?raw';

// Official development test ad IDs (developers-apps-in-toss.toss.im/ads/develop.html,
// 규명 2026-07-24). Toss's dev guide requires these while developing — testing
// with a production adGroupId is treated as a policy violation. Our own
// adGroupId is still pending business/settlement approval, so these are the
// only IDs that resolve on-device today. They only serve a *real* ad on-device
// (env3, cold-loaded via the intoss-private deep-link, #353) — here in the
// browser/mock dev environment (this page, `pnpm dev`), load/show always
// simulate the event regardless of which adGroupId is set.
const AD_TEST_ID_PRESETS = [
  { labelKey: 'pages.ads.testIdPresets.interstitial', value: 'ait-ad-test-interstitial-id' },
  { labelKey: 'pages.ads.testIdPresets.rewarded', value: 'ait-ad-test-rewarded-id' },
  { labelKey: 'pages.ads.testIdPresets.banner', value: 'ait-ad-test-banner-id' },
  { labelKey: 'pages.ads.testIdPresets.nativeImage', value: 'ait-ad-test-native-image-id' },
] as const satisfies { labelKey: StringKey; value: string }[];

// Real placement group (adGroupId) presets — issued for this example app
// (miniAppId 31146, aitc-sdk-example) only via `aitcc app ads placement-groups
// create` (2026-07-24, #355; see src/constants.ts for per-type console status).
// Unlike the test IDs above, these resolve to a real ad once the workspace's
// business/settlement review clears — until then they behave the same as any
// other adGroupId here in the browser/mock dev environment (simulated events).
// Anyone copying this boilerplate for their own mini-app MUST replace these
// with adGroupIds issued to their own console workspace — these ids only
// resolve for 31146.
const AD_REAL_FULLSCREEN_PRESETS = [
  {
    labelKey: 'pages.ads.realPlacementPresets.interstitial',
    value: AD_REAL_PLACEMENT_GROUPS.interstitial,
  },
  {
    labelKey: 'pages.ads.realPlacementPresets.rewarded',
    value: AD_REAL_PLACEMENT_GROUPS.rewarded,
  },
] as const satisfies { labelKey: StringKey; value: string }[];

const AD_REAL_BANNER_PRESETS = [
  {
    labelKey: 'pages.ads.realPlacementPresets.bannerList',
    value: AD_REAL_PLACEMENT_GROUPS.bannerList,
  },
  {
    labelKey: 'pages.ads.realPlacementPresets.bannerFeed',
    value: AD_REAL_PLACEMENT_GROUPS.bannerFeed,
  },
] as const satisfies { labelKey: StringKey; value: string }[];

export function AdsPage() {
  // --- GoogleAdMob state ---
  const [activeStep, setActiveStep] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [eventLog, setEventLog] = useState<HistoryEntry[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadResult, setLoadResult] = useState<unknown>(undefined);
  const [loadError, setLoadError] = useState('');
  // 광고 지면(placement group) ID — 실기기에서 콘솔이 발급한 실제 ID로 바꿔
  // 넣을 수 있게 입력 필드로 노출한다(#351). load/show 양쪽 호출에 그대로 전달.
  const [adGroupId, setAdGroupId] = useState('demo-ad-group');

  const addLog = useCallback((status: 'success' | 'error', data?: unknown, error?: string) => {
    setEventLog((prev) => appendHistory(prev, createHistoryEntry({ status, data, error })));
  }, []);

  const handleLoad = useCallback(() => {
    setLoadStatus('loading');
    GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (e) => {
        setLoadStatus('success');
        setLoadResult(e);
        setAdLoaded(true);
        addLog('success', e);
        setActiveStep(1);
      },
      onError: (e) => {
        setLoadStatus('error');
        setLoadError(String(e));
        addLog('error', undefined, String(e));
      },
    });
  }, [addLog, adGroupId]);

  const handleShow = useCallback(() => {
    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (e) => addLog('success', e),
      onError: (e) => addLog('error', undefined, String(e)),
    });
  }, [addLog, adGroupId]);

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setAdLoaded(false);
    setEventLog([]);
    setLoadStatus('idle');
    setLoadResult(undefined);
    setLoadError('');
  }, []);

  const steps = [
    {
      id: 'load',
      title: '광고 로드',
      description: '광고를 미리 로드합니다',
      content: (
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
              GoogleAdMob.loadAppsInTossAdMob
            </span>
            <DocsLink namespace="ads" method="loadAppsInTossAdMob" />
          </div>
          <button
            type="button"
            onClick={handleLoad}
            disabled={loadStatus === 'loading'}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {t('apiCard.execute')}
          </button>
          <ResultView status={loadStatus} data={loadResult} error={loadError} />
          <CodeSnippet
            code={loadAppsInTossAdMobSnippet}
            label="GoogleAdMob.loadAppsInTossAdMob source snippet"
          />
        </div>
      ),
    },
    {
      id: 'show',
      title: '광고 표시',
      description: '로드된 광고를 화면에 표시합니다',
      content: (
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
              GoogleAdMob.showAppsInTossAdMob
            </span>
            <DocsLink namespace="ads" method="showAppsInTossAdMob" />
          </div>
          <button
            type="button"
            onClick={handleShow}
            disabled={!adLoaded}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {t('apiCard.execute')}
          </button>
          <HistoryLog entries={eventLog} onClear={() => setEventLog([])} />
          <CodeSnippet
            code={showAppsInTossAdMobSnippet}
            label="GoogleAdMob.showAppsInTossAdMob source snippet"
          />
        </div>
      ),
    },
  ];

  // --- FullScreen Ad state ---
  const [fsEventLog, setFsEventLog] = useState<HistoryEntry[]>([]);
  const [fsLoadStatus, setFsLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [fsLoadResult, setFsLoadResult] = useState<unknown>(undefined);
  const [fsLoadError, setFsLoadError] = useState('');
  const [fsShowStatus, setFsShowStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [fsShowResult, setFsShowResult] = useState<unknown>(undefined);
  const [fsShowError, setFsShowError] = useState('');

  const addFsLog = useCallback((status: 'success' | 'error', data?: unknown, error?: string) => {
    setFsEventLog((prev) => appendHistory(prev, createHistoryEntry({ status, data, error })));
  }, []);

  // NOTE: `status` in ResultView reflects only the *latest* event received from
  // loadFullScreenAd / showFullScreenAd. The full event history is available in
  // the shared HistoryLog below both cards.
  //
  // adGroupId is reused from the GoogleAdMob section's shared input above (#355)
  // — interstitial/rewarded real placements (and the test ID presets) resolve
  // through both GoogleAdMob.loadAppsInTossAdMob/showAppsInTossAdMob *and*
  // loadFullScreenAd/showFullScreenAd, so one field drives both call sites.
  const handleFsLoad = useCallback(() => {
    setFsLoadStatus('loading');
    loadFullScreenAd({
      options: { adGroupId },
      onEvent: (e) => {
        setFsLoadStatus('success');
        setFsLoadResult(e);
        addFsLog('success', e);
      },
      onError: (e) => {
        setFsLoadStatus('error');
        setFsLoadError(String(e));
        addFsLog('error', undefined, String(e));
      },
    });
  }, [addFsLog, adGroupId]);

  // NOTE: same as handleFsLoad — `status` reflects only the latest event.
  const handleFsShow = useCallback(() => {
    setFsShowStatus('loading');
    showFullScreenAd({
      options: { adGroupId },
      onEvent: (e) => {
        setFsShowStatus('success');
        setFsShowResult(e);
        addFsLog('success', e);
      },
      onError: (e) => {
        setFsShowStatus('error');
        setFsShowError(String(e));
        addFsLog('error', undefined, String(e));
      },
    });
  }, [addFsLog, adGroupId]);

  // --- TossAds attach / attachBanner slot targets ---
  // We need DOM elements as `attach` / `attachBanner` targets. Refs keep them
  // stable across renders; the attached placeholders accumulate visually below
  // each card so the user can see the mock render the slot.
  const attachSlotRef = useRef<HTMLDivElement>(null);
  const attachBannerSlotRef = useRef<HTMLDivElement>(null);
  // Most recent attachBanner result, so `destroy` can tear down the banner.
  const lastAttachBannerRef = useRef<{ destroy: () => void } | null>(null);
  // adGroupId driving the TossAds.attachBanner card below (#355 real placement
  // presets). ApiCard owns its params as internal state, so we key-remount the
  // card on this value to re-seed its defaultValue when a preset is clicked.
  const [bannerAdGroupId, setBannerAdGroupId] = useState('demo-ad-group');

  return (
    <div>
      <PageHeader title="Ads" />
      <div className="p-4 space-y-6">
        {/* GoogleAdMob — stepper workflow */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">GoogleAdMob</h2>
            <button
              type="button"
              onClick={handleReset}
              aria-label={t('pages.ads.resetAriaLabel')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t('pages.ads.reset')}
            </button>
          </div>
          <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <ParamInput
              label="adGroupId"
              value={adGroupId}
              onChange={setAdGroupId}
              placeholder="demo-ad-group"
            />
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t('pages.ads.adGroupIdHint')}
            </p>

            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              {t('pages.ads.testIdPresets.heading')}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {AD_TEST_ID_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAdGroupId(preset.value)}
                  aria-pressed={adGroupId === preset.value}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    adGroupId === preset.value
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
              {t('pages.ads.testIdPresets.notice')}
            </p>

            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              {t('pages.ads.realPlacementPresets.heading')}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {AD_REAL_FULLSCREEN_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAdGroupId(preset.value)}
                  aria-pressed={adGroupId === preset.value}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    adGroupId === preset.value
                      ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                      : 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
              {t('pages.ads.realPlacementPresets.notice')}
            </p>
          </div>
          <WorkflowStepper steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />

          {/* isAppsInTossAdMobLoaded — standalone query, not part of the stepper */}
          <div className="mt-3">
            <ApiCard
              name="GoogleAdMob.isAppsInTossAdMobLoaded"
              description={t('pages.ads.isAppsInTossAdMobLoaded.description')}
              params={[
                {
                  name: 'adGroupId',
                  label: 'adGroupId',
                  type: 'text',
                  placeholder: 'adGroupId',
                  defaultValue: 'demo-ad-group',
                },
              ]}
              execute={async ({ adGroupId }) => {
                return GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId });
              }}
              snippet={isAppsInTossAdMobLoadedSnippet}
              docsUrl={docsLink('ads', 'isAppsInTossAdMobLoaded')}
            />
          </div>
        </div>

        {/* FullScreen Ad — dedicated event-log cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300">
            FullScreen Ad
          </h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {t('pages.ads.fullScreenAdGroupId.hint', { adGroupId })}
          </p>
          <div className="space-y-3">
            {/* loadFullScreenAd */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">
                  loadFullScreenAd
                </h3>
                <DocsLink namespace="ads" method="loadFullScreenAd" />
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t('pages.ads.loadFullScreenAd.description')}
              </p>
              <button
                type="button"
                onClick={handleFsLoad}
                disabled={fsLoadStatus === 'loading'}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {t('apiCard.execute')}
              </button>
              <ResultView status={fsLoadStatus} data={fsLoadResult} error={fsLoadError} />
              <CodeSnippet code={loadFullScreenAdSnippet} label="loadFullScreenAd source snippet" />
            </div>
            {/* showFullScreenAd */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">
                  showFullScreenAd
                </h3>
                <DocsLink namespace="ads" method="showFullScreenAd" />
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t('pages.ads.showFullScreenAd.description')}
              </p>
              <button
                type="button"
                onClick={handleFsShow}
                disabled={fsShowStatus === 'loading'}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {t('apiCard.execute')}
              </button>
              <ResultView status={fsShowStatus} data={fsShowResult} error={fsShowError} />
              <CodeSnippet code={showFullScreenAdSnippet} label="showFullScreenAd source snippet" />
            </div>
            {/* Shared event log for FullScreen Ad */}
            <HistoryLog entries={fsEventLog} onClear={() => setFsEventLog([])} />
          </div>
        </div>

        {/* TossAds */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">TossAds</h2>
          <div className="space-y-3">
            <ApiCard
              name="TossAds.initialize"
              description={t('pages.ads.tossAdsInitialize.description')}
              params={[]}
              execute={async () => {
                TossAds.initialize({});
              }}
              snippet={tossAdsInitializeSnippet}
              docsUrl={docsLink('ads', 'initialize')}
            />
            <ApiCard
              name="TossAds.attach"
              description={t('pages.ads.tossAdsAttach.description')}
              params={[
                {
                  name: 'adGroupId',
                  label: 'adGroupId',
                  type: 'text',
                  defaultValue: 'demo-ad-group',
                },
              ]}
              execute={async ({ adGroupId }) => {
                if (!attachSlotRef.current) throw new Error('slot not mounted');
                TossAds.attach(adGroupId, attachSlotRef.current);
              }}
              snippet={tossAdsAttachSnippet}
              docsUrl={docsLink('ads', 'attach')}
            />
            <div
              ref={attachSlotRef}
              className="rounded-lg border border-dashed border-gray-300 p-1 dark:border-gray-700"
            />
            {/* Real placement presets for TossAds.attachBanner (#355) — key-remounts
                the card below so its internal adGroupId param picks up the preset. */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('pages.ads.realPlacementPresets.heading')}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {AD_REAL_BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBannerAdGroupId(preset.value)}
                    aria-pressed={bannerAdGroupId === preset.value}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      bannerAdGroupId === preset.value
                        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40'
                    }`}
                  >
                    {t(preset.labelKey)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                {t('pages.ads.realPlacementPresets.notice')}
              </p>
            </div>
            <ApiCard
              key={bannerAdGroupId}
              name="TossAds.attachBanner"
              description={t('pages.ads.tossAdsAttachBanner.description')}
              params={[
                {
                  name: 'adGroupId',
                  label: 'adGroupId',
                  type: 'text',
                  defaultValue: bannerAdGroupId,
                },
              ]}
              execute={async ({ adGroupId }) => {
                if (!attachBannerSlotRef.current) throw new Error('slot not mounted');
                const result = TossAds.attachBanner(adGroupId, attachBannerSlotRef.current);
                lastAttachBannerRef.current = result;
                return { attached: true, adGroupId };
              }}
              snippet={tossAdsAttachBannerSnippet}
              docsUrl={docsLink('ads', 'attachBanner')}
            />
            <div
              ref={attachBannerSlotRef}
              className="rounded-lg border border-dashed border-gray-300 p-1 dark:border-gray-700"
            />
            <ApiCard
              name="TossAds.destroy"
              description={t('pages.ads.tossAdsDestroy.description')}
              params={[
                {
                  name: 'slotId',
                  label: 'slotId',
                  type: 'text',
                  defaultValue: 'demo-slot',
                },
              ]}
              execute={async ({ slotId }) => {
                TossAds.destroy(slotId);
                // If we still hold a banner handle, tear that down too —
                // attachBanner returns its own destroy(), independent of
                // TossAds.destroy(slotId). Matches real SDK ergonomics.
                lastAttachBannerRef.current?.destroy();
                lastAttachBannerRef.current = null;
              }}
              snippet={tossAdsDestroySnippet}
              docsUrl={docsLink('ads', 'destroy')}
            />
            <ApiCard
              name="TossAds.destroyAll"
              description={t('pages.ads.tossAdsDestroyAll.description')}
              params={[]}
              execute={async () => {
                TossAds.destroyAll();
                lastAttachBannerRef.current = null;
              }}
              snippet={tossAdsDestroyAllSnippet}
              docsUrl={docsLink('ads', 'destroyAll')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
