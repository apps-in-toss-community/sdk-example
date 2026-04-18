import { getOperationalEnvironment } from '@apps-in-toss/web-framework';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { APP_IN_TOSS_URL } from '../constants';

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
    try {
      setIsTossEnv(getOperationalEnvironment() === 'toss');
    } catch {
      setIsTossEnv(false);
    }
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
        aria-label="데모 안내"
      >
        <span>
          <span className="inline-block mr-1.5 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
            DEMO
          </span>
          <span className="opacity-90">@ait-co/devtools mock으로 동작하는 웹 데모</span>
        </span>
        <span className="text-white/60 text-[10px]">{open ? '접기' : '자세히'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 text-xs">
          <p className="text-white/80 leading-relaxed">
            이 앱은 실제 SDK 동작을 모사하는 mock 레이어 위에서 동작합니다. 네이티브 API의 실제
            동작은 앱인토스에서 확인하세요.
          </p>
          {APP_IN_TOSS_URL ? (
            <div className="mt-3 flex items-start gap-3">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="앱인토스 링크 QR"
                  className="w-24 h-24 rounded-md bg-white p-1.5 shrink-0"
                />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-white/70">모바일에서 QR 스캔 또는 링크로 이동:</p>
                <a
                  href={APP_IN_TOSS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-md bg-white text-gray-900 px-3 py-1.5 font-medium hover:bg-gray-100 break-all"
                >
                  앱인토스에서 열기 →
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-white/10 px-3 py-2 text-white/70">
              앱인토스 배포 URL은 배포 후 여기에 표시됩니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
