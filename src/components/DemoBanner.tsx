import { getOperationalEnvironment } from '@apps-in-toss/web-framework';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { APP_IN_TOSS_URL } from '../constants';
import { t } from '../i18n';

/**
 * Demo-mode banner shown only in a regular web browser (not inside the Toss app).
 *
 * Announces that the current environment uses `@ait-co/devtools` mock and provides
 * a link + QR to open the app in 앱인토스 for actual native API behavior.
 *
 * Hidden when `getOperationalEnvironment()` reports 'toss' (real Toss app environment).
 */
export function DemoBanner() {
  const [isTossEnv, setIsTossEnv] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 상류 SDK 타입은 동기(string)지만 실기기 런타임은 Promise를 반환한다(devtools#795/#796,
    // env3 실측). await는 동기 반환·Promise 반환 양쪽에서 동작하는 version-agnostic 경로다 —
    // await 없이 비교하면 Promise === 'toss'가 항상 false라 실기기에서 배너가 숨지 않는다.
    let cancelled = false;
    void (async () => {
      try {
        const isToss = (await getOperationalEnvironment()) === 'toss';
        if (!cancelled) setIsTossEnv(isToss);
      } catch {
        if (!cancelled) setIsTossEnv(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!APP_IN_TOSS_URL) return;
    QRCode.toDataURL(APP_IN_TOSS_URL, { width: 200, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  if (isTossEnv) return null;

  return (
    <div className="bg-gray-900 text-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs"
        aria-expanded={open}
        aria-label={t('demoBanner.ariaLabel')}
      >
        <span>
          <span className="inline-block mr-1.5 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
            {t('demoBanner.badge')}
          </span>
          <span className="opacity-90">{t('demoBanner.summary')}</span>
        </span>
        <span className="text-white/60 text-[10px]">
          {open ? t('demoBanner.collapse') : t('demoBanner.expand')}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 text-xs">
          <p className="text-white/80 leading-relaxed">{t('demoBanner.description')}</p>
          {APP_IN_TOSS_URL ? (
            <div className="mt-3 flex items-start gap-3">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={t('demoBanner.qrAlt')}
                  className="w-24 h-24 rounded-md bg-white p-1.5 shrink-0"
                />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-white/70">{t('demoBanner.mobileHint')}</p>
                <a
                  href={APP_IN_TOSS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-md bg-white text-gray-900 px-3 py-1.5 font-medium hover:bg-gray-100 break-all"
                >
                  {t('demoBanner.openInAppsInToss')}
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-white/10 px-3 py-2 text-white/70">
              {t('demoBanner.pendingDeployUrl')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
