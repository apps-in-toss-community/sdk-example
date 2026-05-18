import { getOperationalEnvironment, SafeAreaInsets } from '@apps-in-toss/web-framework';
import { useEffect, useState } from 'react';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeAreaInsetsState {
  insets: Insets;
  /** True when running inside the actual Toss app (SDK reports 'toss'). */
  isTossEnv: boolean;
}

const ZERO: Readonly<Insets> = Object.freeze({ top: 0, bottom: 0, left: 0, right: 0 });

function detectTossEnv(): boolean {
  try {
    return getOperationalEnvironment() === 'toss';
  } catch {
    return false;
  }
}

function safeGet(): Insets {
  try {
    return SafeAreaInsets.get();
  } catch {
    return ZERO;
  }
}

/**
 * Returns SDK safe-area insets plus an `isTossEnv` flag so Layout can decide
 * whether to trust SDK values exclusively (mini-app) or fall back to CSS
 * `env(safe-area-inset-*)` (regular web browser).
 *
 * Per the framework guide, `env()` is unreliable in the Toss WebView, so we
 * never combine the two sources in-app — that double-counted padding before.
 */
export function useSafeAreaInsets(): SafeAreaInsetsState {
  const [insets, setInsets] = useState<Insets>(safeGet);
  const [isTossEnv, setIsTossEnv] = useState(detectTossEnv);

  useEffect(() => {
    setIsTossEnv(detectTossEnv());
    setInsets(safeGet());

    let cleanup: (() => void) | undefined;
    try {
      cleanup = SafeAreaInsets.subscribe({ onEvent: setInsets });
    } catch {
      // subscribe unavailable — static snapshot from safeGet() stands
    }
    return () => cleanup?.();
  }, []);

  return { insets, isTossEnv };
}
