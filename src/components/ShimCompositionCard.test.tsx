import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShimCompositionCard } from './ShimCompositionCard';

vi.mock('@ait-co/polyfill/detect', () => ({
  isTossEnvironment: async () => false,
}));

vi.mock('@apps-in-toss/web-framework', () => ({
  getAppsInTossGlobals: () => {
    throw new Error('not in toss');
  },
}));

describe('ShimCompositionCard', () => {
  it('renders the diagnostic header and round-trip button', () => {
    render(<ShimCompositionCard />);

    expect(screen.getByRole('heading', { name: /Shim composition/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /writeText round-trip 실행/ })).toBeInTheDocument();
  });

  it('falls back to unknown mode when neither SDK nor polyfill marker is present', () => {
    render(<ShimCompositionCard />);
    const badge = screen.getByTestId('shim-composition-mode');
    expect(badge).toHaveTextContent('unknown');
  });
});
