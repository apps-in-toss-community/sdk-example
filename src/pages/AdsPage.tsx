import {
  GoogleAdMob,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
} from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';
import { ApiCard } from '../components/ApiCard';
import { createHistoryEntry, type HistoryEntry, HistoryLog } from '../components/HistoryLog';
import { PageHeader } from '../components/PageHeader';
import { ResultView } from '../components/ResultView';
import { WorkflowStepper } from '../components/WorkflowStepper';

export function AdsPage() {
  // --- GoogleAdMob state ---
  const [activeStep, setActiveStep] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [eventLog, setEventLog] = useState<HistoryEntry[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadResult, setLoadResult] = useState<unknown>(undefined);
  const [loadError, setLoadError] = useState('');

  const addLog = useCallback((status: 'success' | 'error', data?: unknown, error?: string) => {
    setEventLog((prev) => [createHistoryEntry({ status, data, error }), ...prev].slice(0, 20));
  }, []);

  const handleLoad = useCallback(() => {
    setLoadStatus('loading');
    GoogleAdMob.loadAppsInTossAdMob({
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
  }, [addLog]);

  const handleShow = useCallback(() => {
    GoogleAdMob.showAppsInTossAdMob({
      onEvent: (e) => addLog('success', e),
      onError: (e) => addLog('error', undefined, String(e)),
    });
  }, [addLog]);

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
          <button
            type="button"
            onClick={handleLoad}
            disabled={loadStatus === 'loading'}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            GoogleAdMob.loadAppsInTossAdMob
          </button>
          <ResultView status={loadStatus} data={loadResult} error={loadError} />
        </div>
      ),
    },
    {
      id: 'show',
      title: '광고 표시',
      description: '로드된 광고를 화면에 표시합니다',
      content: (
        <div className="space-y-3 py-2">
          <button
            type="button"
            onClick={handleShow}
            disabled={!adLoaded}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            GoogleAdMob.showAppsInTossAdMob
          </button>
          <HistoryLog entries={eventLog} />
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
    setFsEventLog((prev) => [createHistoryEntry({ status, data, error }), ...prev].slice(0, 20));
  }, []);

  // NOTE: `status` in ResultView reflects only the *latest* event received from
  // loadFullScreenAd / showFullScreenAd. The full event history is available in
  // the shared HistoryLog below both cards.
  const handleFsLoad = useCallback(() => {
    setFsLoadStatus('loading');
    loadFullScreenAd({
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
  }, [addFsLog]);

  // NOTE: same as handleFsLoad — `status` reflects only the latest event.
  const handleFsShow = useCallback(() => {
    setFsShowStatus('loading');
    showFullScreenAd({
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
  }, [addFsLog]);

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
              aria-label="GoogleAdMob 워크플로우 초기화"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              초기화
            </button>
          </div>
          <WorkflowStepper steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />
        </div>

        {/* FullScreen Ad — dedicated event-log cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
            FullScreen Ad
          </h2>
          <div className="space-y-3">
            {/* loadFullScreenAd */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">
                loadFullScreenAd
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                전면 광고 로드 — 여러 이벤트를 수신합니다
              </p>
              <button
                type="button"
                onClick={handleFsLoad}
                disabled={fsLoadStatus === 'loading'}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                실행
              </button>
              <ResultView status={fsLoadStatus} data={fsLoadResult} error={fsLoadError} />
            </div>
            {/* showFullScreenAd */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">
                showFullScreenAd
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                전면 광고 표시 — 여러 이벤트를 수신합니다
              </p>
              <button
                type="button"
                onClick={handleFsShow}
                disabled={fsShowStatus === 'loading'}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                실행
              </button>
              <ResultView status={fsShowStatus} data={fsShowResult} error={fsShowError} />
            </div>
            {/* Shared event log for FullScreen Ad */}
            <HistoryLog entries={fsEventLog} />
          </div>
        </div>

        {/* TossAds */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">TossAds</h2>
          <div className="space-y-3">
            <ApiCard
              name="TossAds.initialize"
              description="TossAds 초기화"
              params={[]}
              execute={async () => {
                TossAds.initialize({});
              }}
            />
            <ApiCard
              name="TossAds.destroyAll"
              description="모든 TossAds 슬롯 제거"
              params={[]}
              execute={async () => {
                TossAds.destroyAll();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
