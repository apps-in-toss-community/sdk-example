type NetworkInformationType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

type NetworkInformationEffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

interface NetworkInformationSnapshot {
  type?: NetworkInformationType;
  effectiveType?: NetworkInformationEffectiveType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface Navigator {
  connection?: NetworkInformationSnapshot;
}

// apps-in-toss.config.ts (3.0 이전: granite.config.ts) 의 webView 타입을 build-time 상수로 박아 client
// 코드가 자기 WebView frame 을 알 수 있게 한다. partner 에선 토스 native
// chrome 이 viewport 밖이라 SafeAreaInsets.top 을 padding 으로 적용하면
// 중복 공간이 생기고, game/external 은 chrome 이 viewport 안 overlay 라
// 그대로 적용해야 한다.
declare const __WEB_VIEW_TYPE__: 'partner' | 'external' | 'game';

interface Window {
  // SDK bridge (see src/debug/sdkBridge.ts). Installed in two scenarios:
  //   1. `pnpm dev` (plain browser) — mock SDK via the devtools unplugin alias,
  //      so the devtools MCP `call_sdk` tool can drive env-1 local debugging.
  //   2. On-device (`.ait` bundle) — real SDK calls over on-device CDP relay
  //      when the bundle is loaded via a ?debug=1&relay=<wss> deep-link.
  // Install is gated in main.tsx on `import.meta.env.DEV` OR a ?debug=1/?relay=
  // URL param, so a normal production load never installs the bridge.
  __sdk?: Record<string, unknown>;
  __sdkCall?: (
    name: string,
    ...args: unknown[]
  ) => Promise<{ ok: boolean; value?: unknown; error?: string }>;
}
