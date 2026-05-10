import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PolyfillToggleCard } from './PolyfillToggleCard';

describe('PolyfillToggleCard', () => {
  it('renders the SDK config by default and shows both toggle tabs', () => {
    render(
      <PolyfillToggleCard
        title="Clipboard write"
        sdk={{
          name: 'setClipboardText',
          params: [],
          execute: async () => undefined,
        }}
        polyfill={{
          name: 'navigator.clipboard.writeText',
          params: [],
          execute: async () => undefined,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Clipboard write' })).toBeInTheDocument();
    expect(screen.getByText('setClipboardText')).toBeInTheDocument();
    expect(screen.queryByText('navigator.clipboard.writeText')).not.toBeInTheDocument();

    const sdkTab = screen.getByRole('tab', { name: 'SDK' });
    const polyTab = screen.getByRole('tab', { name: 'Polyfill' });
    expect(sdkTab).toHaveAttribute('aria-selected', 'true');
    expect(polyTab).toHaveAttribute('aria-selected', 'false');
  });

  it('runs the active mode and switches execute target on toggle', async () => {
    const user = userEvent.setup();
    const sdkExec = vi.fn(async () => 'sdk-result');
    const polyExec = vi.fn(async () => 'poly-result');

    render(
      <PolyfillToggleCard
        title="Clipboard write"
        sdk={{
          name: 'setClipboardText',
          params: [],
          execute: sdkExec,
        }}
        polyfill={{
          name: 'navigator.clipboard.writeText',
          params: [],
          execute: polyExec,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));
    expect(sdkExec).toHaveBeenCalledTimes(1);
    expect(polyExec).not.toHaveBeenCalled();
    expect((await screen.findAllByText(/sdk-result/)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Polyfill' }));
    expect(screen.getByText('navigator.clipboard.writeText')).toBeInTheDocument();
    expect(screen.queryAllByText(/sdk-result/)).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '실행' }));
    expect(polyExec).toHaveBeenCalledTimes(1);
    expect(sdkExec).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText(/poly-result/)).length).toBeGreaterThan(0);
  });

  it('preserves per-mode results when toggling back', async () => {
    const user = userEvent.setup();

    render(
      <PolyfillToggleCard
        title="Demo"
        sdk={{ name: 'sdk.run', params: [], execute: async () => 'sdk-out' }}
        polyfill={{ name: 'poly.run', params: [], execute: async () => 'poly-out' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));
    expect((await screen.findAllByText(/sdk-out/)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Polyfill' }));
    await user.click(screen.getByRole('button', { name: '실행' }));
    expect((await screen.findAllByText(/poly-out/)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'SDK' }));
    expect((await screen.findAllByText(/sdk-out/)).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/poly-out/)).toHaveLength(0);
  });
});
