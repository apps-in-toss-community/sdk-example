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

// Ambient declaration for the `@ait-co/devtools/in-app` debug-gate entry.
//
// The published `@ait-co/devtools@0.1.22` does not yet ship the `/in-app`
// subpath (it landed on devtools `main` post-publish — the gate is Phase 1 of
// the in-app Debugging MCP). sdk-example consumes it only behind the
// `__DEBUG_BUILD__` guard via a dynamic import, so the module is never
// resolved at runtime in non-dogfood builds. This declaration mirrors the
// gate-only public surface so `pnpm typecheck` passes against the installed
// version; drop it once a devtools release exposes `/in-app` types.
declare module '@ait-co/devtools/in-app' {
  /** Shape returned when the 3-layer gate allows attachment. */
  export interface GateResultAttach {
    readonly attach: true;
    /** The validated `wss:` relay URL from the `relay` query param. */
    readonly relayUrl: string;
    /** The deployment ID extracted from the `_deploymentId` query param. */
    readonly deploymentId: string;
  }

  /** Shape returned when the gate blocks attachment, with a reason code. */
  export interface GateResultBlocked {
    readonly attach: false;
    readonly reason: 'build' | 'entry' | 'opt-in' | 'invalid-relay';
  }

  export type GateResult = GateResultAttach | GateResultBlocked;

  /** Evaluates the 3-layer debug activation gate against the current page URL. */
  export function checkDebugGate(): GateResult;
}
