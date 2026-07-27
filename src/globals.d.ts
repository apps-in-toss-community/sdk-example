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

// Consumer-build constant injected by vite.config.ts `define` (#210, specifier
// updated #361). Gates the on-device debug surface in main.tsx; false in
// release builds so the `@ait-co/debug-console/auto` graph DCEs to 0 bytes.
declare const __DEBUG_BUILD__: boolean;
