/**
 * Interactive / side-effectful SDK API checks — these need a human at the device.
 *
 * Unlike `read-only.phone.test.ts`, the calls here open UI (login, permission
 * dialogs, camera, share sheet), mutate device state, or — for the financial
 * ones — move money. They still call the REAL SDK on the attached Toss WebView,
 * but they CANNOT run cleanly in an unattended `run_tests` sweep:
 *
 *   - UI-opening + reversible (login, permission, share, camera, pickers): the
 *     call is real and runs, but it blocks on the user tapping the dialog. With
 *     no human at the phone it simply times out — harmless, nothing persists.
 *
 *   - Irreversible / financial (checkoutPayment, requestTossPayPaysBilling, IAP
 *     purchase, ad reward): kept `it.skip` by DEFAULT. The real call body is
 *     written out so a human can un-skip and drive it by hand on a test
 *     account, but an automated sweep must never fire a real payment. Do NOT
 *     remove the `.skip` on these without a human explicitly driving the device.
 *
 * Reversible device-state setters (awake mode, orientation, haptics) DO run
 * unattended safely and restore state, so they are plain `it`.
 *
 * Same runtime contract as the read-only file: runs only on-device via the
 * `run_tests` MCP tool, never under `pnpm test` (jsdom). `describe`/`it`/`expect`
 * are injected globals (see `globals.d.ts`).
 */

import {
  appLogin,
  checkoutPayment,
  generateHapticFeedback,
  getClipboardText,
  openURL,
  requestPermission,
  requestReview,
  requestTossPayPaysBilling,
  setClipboardText,
  setDeviceOrientation,
  setScreenAwakeMode,
  share,
} from '@apps-in-toss/web-framework';

describe('device-state setters (reversible — safe unattended)', () => {
  it('setScreenAwakeMode toggles on then restores off', async () => {
    await setScreenAwakeMode({ enabled: true });
    await setScreenAwakeMode({ enabled: false });
    // Resolving without throwing is the contract; no return value to assert.
    expect(true).toBeTruthy();
  });

  it('setDeviceOrientation accepts portrait then landscape', async () => {
    await setDeviceOrientation({ type: 'landscape' });
    await setDeviceOrientation({ type: 'portrait' });
    expect(true).toBeTruthy();
  });

  it('generateHapticFeedback fires a tick', async () => {
    await generateHapticFeedback({ type: 'tickWeak' });
    expect(true).toBeTruthy();
  });
});

describe('UI-opening (reversible — needs a human; times out unattended)', () => {
  it('appLogin returns an authorization code', async () => {
    // Opens the Toss login consent sheet. Requires the user to approve.
    const result = await appLogin();
    expect(result === null || result === undefined).toBeFalsy();
    expect(typeof result).toBe('object');
  });

  it('requestPermission(clipboard/read) resolves to a status', async () => {
    // Opens the permission dialog if not yet determined.
    const status = await requestPermission({ name: 'clipboard', access: 'read' });
    const known = status === 'allowed' || status === 'denied' || status === 'notDetermined';
    expect(known).toBeTruthy();
  });

  it('clipboard set then get round-trips a string', async () => {
    // setClipboardText may prompt for write permission on first use.
    const token = 'aitc-phone-test';
    await setClipboardText(token);
    const read = await getClipboardText();
    expect(typeof read).toBe('string');
    expect(read).toContain(token);
  });

  it('share opens the share sheet', async () => {
    await share({ message: 'aitc sdk-example phone test' });
    expect(true).toBeTruthy();
  });

  it('openURL opens an external URL', async () => {
    await openURL('https://aitc.dev');
    expect(true).toBeTruthy();
  });

  it('requestReview opens the in-app review prompt', async () => {
    await requestReview();
    expect(true).toBeTruthy();
  });
});

describe('financial / irreversible (skipped by default — un-skip only by hand)', () => {
  // DANGER: these move money. They stay `it.skip` so no automated `run_tests`
  // sweep can fire them. A maintainer driving the device by hand, on a test
  // account, may temporarily un-skip a single case — never commit it un-skipped.

  it.skip('checkoutPayment completes a real payment', async () => {
    await checkoutPayment({
      // Fill with a real test-account payment payload before un-skipping.
    } as Parameters<typeof checkoutPayment>[0]);
    expect(true).toBeTruthy();
  });

  it.skip('requestTossPayPaysBilling starts a real billing flow', async () => {
    await requestTossPayPaysBilling({
      // Fill with a real test-account billing payload before un-skipping.
    } as Parameters<typeof requestTossPayPaysBilling>[0]);
    expect(true).toBeTruthy();
  });
});
