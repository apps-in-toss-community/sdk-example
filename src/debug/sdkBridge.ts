/**
 * Dogfood-only SDK bridge — exposes the entire `@apps-in-toss/web-framework`
 * export namespace on `window.__sdk` so an AI agent can drive any SDK API
 * directly over a CDP relay (`Runtime.evaluate`) during on-device debugging.
 *
 * Why this exists: the SDK routes calls through the Granite/ReactNative
 * bridge (`window.ReactNativeWebView.postMessage` with a proprietary
 * envelope). That envelope can't be hand-synthesized from CDP, and the SDK
 * functions are module-internal (tree-shaken, not on any global). Without
 * this bridge, exercising an API like `setDeviceOrientation` on the real
 * device requires a human to tap it in the UI. With it, the agent can call
 * `window.__sdk.setDeviceOrientation({ type: 'landscape' })` over the relay.
 *
 * Build isolation: this module is only imported from the `__DEBUG_BUILD__`
 * guarded block in `main.tsx`, so a release bundle dead-code-eliminates it —
 * `window.__sdk` never exists outside a `RELEASE_CHANNEL=dogfood` build.
 *
 * On-device the namespace is the REAL SDK (the dogfood `.ait` bundle is built
 * by `ait build`, which does NOT apply the devtools mock alias — that alias is
 * a Vite-dev-only rewrite). So `window.__sdk.*` are the genuine bridge calls,
 * not mocks. In a `pnpm dev` browser build the same import resolves to the
 * mock, which is harmless (and `__DEBUG_BUILD__` is false in dev anyway, so
 * this never runs there).
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
