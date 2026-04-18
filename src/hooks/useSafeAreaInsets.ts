import { useEffect, useState } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const ZERO: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

function safeGet(): Insets {
  try {
    return SafeAreaInsets.get();
  } catch {
    return ZERO;
  }
}

/**
 * Subscribes to SDK safe-area insets. Non-Toss environments (web demo) fall
 * back to zeros — the shell still applies CSS `env(safe-area-inset-*)` via
 * `max(<sdk>px, env())` so notched browsers like iOS Safari still work.
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
