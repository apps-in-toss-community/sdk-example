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

/** Writes --ait-safe-{top,bottom,left,right} onto :root for global access. */
function applyRootVars(i: Insets): void {
  const root = document.documentElement;
  root.style.setProperty('--ait-safe-top', `${i.top}px`);
  root.style.setProperty('--ait-safe-bottom', `${i.bottom}px`);
  root.style.setProperty('--ait-safe-left', `${i.left}px`);
  root.style.setProperty('--ait-safe-right', `${i.right}px`);
}

/**
 * Returns SDK safe-area insets plus an `isTossEnv` flag so Layout can decide
 * whether to trust SDK values exclusively (mini-app) or fall back to CSS
 * `env(safe-area-inset-*)` (regular web browser).
 *
 * Also writes --ait-safe-{top,bottom,left,right} on :root so any descendant
 * can reference them without prop-drilling. The Toss WebView does not surface
 * env(safe-area-inset-*), so we never depend on that CSS function here.
 */
export function useSafeAreaInsets(): SafeAreaInsetsState {
  const [insets, setInsets] = useState<Insets>(safeGet);
  const [isTossEnv, setIsTossEnv] = useState(detectTossEnv);

  useEffect(() => {
    setIsTossEnv(detectTossEnv());

    const current = safeGet();
    setInsets(current);
    applyRootVars(current);

    let cleanup: (() => void) | undefined;
    try {
      cleanup = SafeAreaInsets.subscribe({
        onEvent: (updated) => {
          setInsets(updated);
          applyRootVars(updated);
        },
      });
    } catch {
      // subscribe unavailable — static snapshot from safeGet() stands
    }
    return () => cleanup?.();
  }, []);

  return { insets, isTossEnv };
}
