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
