import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// globals:false skips RTL's auto-cleanup, so register it explicitly.
afterEach(() => {
  cleanup();
});
