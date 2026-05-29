import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachStatusIcon } from './AttachStatusIcon';

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, search },
  });
}

describe('AttachStatusIcon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset __sdkCall before each test
    delete (window as Window).__sdkCall;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as Window).__sdkCall;
    setSearch('');
  });

  it('renders nothing when URL has no debug/relay params', () => {
    setSearch('');
    const { container } = render(<AttachStatusIcon />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a connecting dot (yellow pulse) when ?debug=1 and bridge absent', () => {
    setSearch('?debug=1');
    render(<AttachStatusIcon />);
    const dot = screen.getByRole('status');
    expect(dot).toBeInTheDocument();
    expect(dot.querySelector('span')).toHaveClass('bg-yellow-400');
    expect(dot.querySelector('span')).toHaveClass('animate-pulse');
  });

  it('renders a connecting dot when ?relay= is present', () => {
    setSearch('?relay=wss%3A%2F%2Fexample.trycloudflare.com');
    render(<AttachStatusIcon />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('transitions to connected (green) when __sdkCall appears', async () => {
    setSearch('?debug=1');
    render(<AttachStatusIcon />);

    // Simulate bridge installation
    (window as Window).__sdkCall = vi.fn();

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const dot = screen.getByRole('status');
    expect(dot.querySelector('span')).toHaveClass('bg-green-500');
  });

  it('transitions to failed (red) after timeout when bridge never appears', async () => {
    setSearch('?debug=1');
    render(<AttachStatusIcon />);

    await act(async () => {
      vi.advanceTimersByTime(16_000);
    });

    const dot = screen.getByRole('status');
    expect(dot.querySelector('span')).toHaveClass('bg-red-500');
  });

  it('starts connected immediately when __sdkCall is already present', () => {
    setSearch('?debug=1');
    (window as Window).__sdkCall = vi.fn();
    render(<AttachStatusIcon />);
    const dot = screen.getByRole('status');
    expect(dot.querySelector('span')).toHaveClass('bg-green-500');
  });
});
