import { SafeAreaInsets } from '@apps-in-toss/web-framework';
import { useEffect, useState } from 'react';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Frozen so a consumer accidentally mutating `insets.top` can't corrupt the
// shared fallback used across every non-Toss render.
const ZERO: Readonly<Insets> = Object.freeze({ top: 0, bottom: 0, left: 0, right: 0 });

function safeGet(): Insets {
  try {
    return SafeAreaInsets.get();
  } catch {
    return ZERO;
  }
}

/**
 * Subscribes to SDK safe-area insets. Non-Toss environments (web demo) fall
 * back to zeros — Layout then applies CSS `env(safe-area-inset-*)` when the
 * SDK value is zero, so notched browsers like iOS Safari still work.
 */
export function useSafeAreaInsets(): Insets {
  const [insets, setInsets] = useState<Insets>(safeGet);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = SafeAreaInsets.subscribe({ onEvent: setInsets });
    } catch {
      // subscribe unavailable — static snapshot from safeGet() stands
    }
    return () => cleanup?.();
  }, []);

  return insets;
}
