interface PolyfillNoticeProps {
  /**
   * Short description listing which standard Web APIs this page demonstrates
   * alongside the SDK calls. Rendered as inline code-ish text.
   */
  webApis: string;
}

/**
 * Banner shown on pages where `@ait-co/polyfill` exposes a standard Web API
 * equivalent of the SDK calls below. The polyfill installs globally from
 * `main.tsx`, so these APIs work on this page too — both entry points are
 * listed side-by-side so the reader can pick the one that fits their codebase.
 */
export function PolyfillNotice({ webApis }: PolyfillNoticeProps) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
      <p className="font-medium">@ait-co/polyfill 활성화됨</p>
      <p className="mt-0.5">
        이 페이지의 SDK 호출과 동등한 표준 Web API(<code className="font-mono">{webApis}</code>)도
        함께 제공됩니다. 두 경로는 동등한 기능을 목표로 하며, 앱인토스 환경에서는 polyfill이 SDK로
        라우팅하고 브라우저에서는 네이티브 API로 fall-through합니다. (SDK와 Web API의 매핑은 일부
        필드(accuracy 등급, share 메시지 구조 등)에서 손실 변환이 있을 수 있습니다.)
      </p>
    </div>
  );
}
