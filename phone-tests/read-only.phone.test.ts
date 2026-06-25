/**
 * Read-only SDK API checks — safe to run unattended on a real device.
 *
 * Every test here calls a REAL SDK function on the attached Toss WebView (via the
 * `run_tests` MCP tool over the CDP relay) and asserts on its shape/contract.
 * None of these open UI, mutate device state, or cost money — so an unattended
 * `run_tests` sweep can run the whole file without a human at the phone.
 *
 * Side-effectful / interactive / irreversible APIs (login, camera, payment,
 * permission dialogs, ads) live in `interactive.phone.test.ts`, where the
 * irreversible ones are skipped by default.
 *
 * These files do NOT run under `pnpm test` (jsdom) — there is no device and no
 * `window.__sdk` bridge there. They run only on-device via `run_tests`.
 * `describe`/`it`/`expect` are injected as globals by the runtime (see
 * `globals.d.ts`); the SDK imports resolve to the on-device bridge.
 */

import {
  getAppsInTossGlobals,
  getDeviceId,
  getGroupId,
  getLocale,
  getNetworkStatus,
  getOperationalEnvironment,
  getPermission,
  getPlatformOS,
  getSafeAreaInsets,
  getSchemeUri,
  getServerTime,
  getTossAppVersion,
  isMinVersionSupported,
} from '@apps-in-toss/web-framework';

describe('environment / platform (sync, read-only)', () => {
  it('getPlatformOS returns ios or android', () => {
    const os = getPlatformOS();
    expect(os === 'ios' || os === 'android').toBeTruthy();
  });

  it('getOperationalEnvironment returns toss or sandbox', () => {
    const env = getOperationalEnvironment();
    expect(env === 'toss' || env === 'sandbox').toBeTruthy();
  });

  it('getTossAppVersion returns a non-empty version string', () => {
    const version = getTossAppVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('getLocale returns a non-empty locale string', () => {
    const locale = getLocale();
    expect(typeof locale).toBe('string');
    expect(locale.length).toBeGreaterThan(0);
  });

  it('getSchemeUri returns a string', () => {
    expect(typeof getSchemeUri()).toBe('string');
  });
});

describe('identity (sync, read-only)', () => {
  it('getDeviceId returns a non-empty string', () => {
    const id = getDeviceId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('getGroupId returns a string', () => {
    expect(typeof getGroupId()).toBe('string');
  });
});

describe('layout / globals (sync, read-only)', () => {
  it('getSafeAreaInsets returns a non-negative number', () => {
    const inset = getSafeAreaInsets();
    expect(typeof inset).toBe('number');
    expect(inset).toBeGreaterThan(-1);
  });

  it('getAppsInTossGlobals returns a globals object', () => {
    const globals = getAppsInTossGlobals();
    expect(globals === null || globals === undefined).toBeFalsy();
    expect(typeof globals).toBe('object');
  });

  it('isMinVersionSupported evaluates a min-version gate', () => {
    // A version this old is supported on any current Toss app build.
    const supported = isMinVersionSupported({ ios: '1.0.0', android: '1.0.0' });
    expect(typeof supported).toBe('boolean');
    expect(supported).toBeTruthy();
  });
});

describe('async queries (read-only)', () => {
  it('getServerTime resolves to a number or undefined', async () => {
    const time = await getServerTime();
    expect(time === undefined || typeof time === 'number').toBeTruthy();
    if (typeof time === 'number') {
      // Sanity: server time is a plausible epoch-ms value (after 2020).
      expect(time).toBeGreaterThan(1_577_836_800_000);
    }
  });

  it('getNetworkStatus resolves to a status object', async () => {
    const status = await getNetworkStatus();
    expect(status === null || status === undefined).toBeFalsy();
    expect(typeof status).toBe('object');
  });

  it('getPermission(clipboard/read) resolves to a known status', async () => {
    // Query-only: reads current permission state, never prompts the user.
    const status = await getPermission({ name: 'clipboard', access: 'read' });
    const known = status === 'allowed' || status === 'denied' || status === 'notDetermined';
    expect(known).toBeTruthy();
  });
});
