/**
 * SDK bridge — exposes the entire `@apps-in-toss/web-framework` export
 * namespace on `window.__sdk` so an AI agent can drive any SDK API directly
 * over a CDP relay (`Runtime.evaluate`) during debugging.
 *
 * Why this exists: the SDK routes calls through the Granite/ReactNative
 * bridge (`window.ReactNativeWebView.postMessage` with a proprietary
 * envelope). That envelope can't be hand-synthesized from CDP, and the SDK
 * functions are module-internal (tree-shaken, not on any global). Without
 * this bridge, exercising an API like `setDeviceOrientation` on the real
 * device requires a human to tap it in the UI. With it, the agent can call
 * `window.__sdk.setDeviceOrientation({ type: 'landscape' })` over the relay.
 *
 * Install gating (see `main.tsx`): this module is imported only when an agent
 * is actually attaching — `import.meta.env.DEV` (env 1, plain `pnpm dev`) or a
 * `?debug=1` / `?relay=` URL param (env 3/4, on-device debug deep-link). A
 * normal production load matches neither, so the bridge chunk stays dormant
 * and `window.__sdk` is never installed.
 *
 * In a `pnpm dev` browser session the SDK import resolves to the devtools mock
 * (the unplugin alias is a Vite-dev-only rewrite), so `window.__sdk.*` calls
 * the mock. On-device (`ait build` does NOT apply the mock alias), the same
 * import resolves to the real SDK — `window.__sdk.*` are genuine bridge calls.
 */
export async function installSdkBridge(): Promise<void> {
  // Dynamic import keeps `main.tsx` free of a top-level SDK dependency outside
  // the debug-guarded block (same discipline as the existing `getSchemeUri`
  // import there). A namespace import captures every export with no manual
  // enumeration, so new SDK APIs are exposed automatically.
  const sdk = await import('@apps-in-toss/web-framework');

  // `Object.assign` onto a fresh object (not the live module namespace, which
  // is frozen/read-only) so callers get a plain, enumerable surface.
  const bridge: Record<string, unknown> = {};
  for (const key of Object.keys(sdk)) {
    bridge[key] = (sdk as Record<string, unknown>)[key];
  }

  window.__sdk = bridge;

  // A tiny call helper so the agent can `window.__sdkCall('setDeviceOrientation', { type:'landscape' })`
  // and get a JSON-safe `{ ok, value | error }` back even for throwing/async APIs.
  window.__sdkCall = async (name: string, ...args: unknown[]) => {
    const fn = bridge[name];
    if (typeof fn !== 'function') {
      return { ok: false, error: `__sdk.${name} is not a function` };
    }
    try {
      const value = await (fn as (...a: unknown[]) => unknown)(...args);
      return { ok: true, value };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
}
