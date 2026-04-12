import { useState, useCallback } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | undefined;
  error: string;
  run: () => void;
}

/**
 * Wraps an async callback with a standard status/data/error state machine.
 * Eliminates boilerplate in pages that call a single async operation and
 * need to reflect loading/success/error states.
 */
export function useAsyncCallback<T>(
  fn: () => Promise<T>,
): AsyncState<T> {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await fn();
      setStatus('success');
      setData(result);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [fn]);

  return { status, data, error, run };
}
