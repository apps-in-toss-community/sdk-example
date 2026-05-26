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

// Build-time channel flag injected by Vite `define` (see vite.config.ts).
// `true` only in a `RELEASE_CHANNEL=dogfood` build; `false` everywhere else.
// Guarding the in-app debug import with `if (__DEBUG_BUILD__)` lets the
// bundler dead-code-eliminate the whole debug path from release bundles.
declare const __DEBUG_BUILD__: boolean;

interface Window {
  // SDK bridge (see src/debug/sdkBridge.ts). Installed in two scenarios:
  //   1. `RELEASE_CHANNEL=dogfood` builds — real SDK calls over on-device CDP relay.
  //   2. `pnpm dev` (plain browser) — mock SDK via the devtools unplugin alias,
  //      so the devtools MCP `call_sdk` tool can drive env-1 local debugging.
  // DCE'd from release/production bundles via `__DEBUG_BUILD__` and
  // `import.meta.env.DEV` guards respectively.
  __sdk?: Record<string, unknown>;
  __sdkCall?: (
    name: string,
    ...args: unknown[]
  ) => Promise<{ ok: boolean; value?: unknown; error?: string }>;
}
