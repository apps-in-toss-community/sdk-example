import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DebugAttachOverlay } from './DebugAttachOverlay';

const gate = {
  relayUrl: 'wss://example.trycloudflare.com',
  deploymentId: 'test-deployment',
} as const;

describe('DebugAttachOverlay', () => {
  it('renders the floating button collapsed by default', () => {
    render(<DebugAttachOverlay gate={gate} />);
    expect(screen.getByTestId('debug-attach-fab')).toBeInTheDocument();
    expect(screen.queryByTestId('debug-attach-panel')).not.toBeInTheDocument();
  });

  it('opens the attach panel and prefills the gate relay + deployment id', () => {
    render(<DebugAttachOverlay gate={gate} />);
    fireEvent.click(screen.getByTestId('debug-attach-fab'));

    const panel = screen.getByTestId('debug-attach-panel');
    expect(panel).toBeInTheDocument();
    expect(screen.getByTestId('debug-attach-deployment-id')).toHaveTextContent('test-deployment');
    expect(screen.getByDisplayValue('wss://example.trycloudflare.com')).toBeInTheDocument();
  });

  it('moves to the attached status after pressing Attach', () => {
    render(<DebugAttachOverlay gate={gate} initialToken="secret" />);
    fireEvent.click(screen.getByTestId('debug-attach-fab'));
    fireEvent.click(screen.getByRole('button', { name: 'Attach' }));

    expect(screen.getByTestId('debug-attach-status')).toHaveAttribute('data-status', 'attached');
  });

  it('starts in the attached state when main.tsx already auto-attached', () => {
    render(<DebugAttachOverlay gate={gate} autoAttached />);
    fireEvent.click(screen.getByTestId('debug-attach-fab'));

    expect(screen.getByTestId('debug-attach-status')).toHaveAttribute('data-status', 'attached');
  });

  it('calls maybeAttach with the (possibly edited) relay url on re-attach', () => {
    const maybeAttach = vi.fn();
    render(<DebugAttachOverlay gate={gate} maybeAttach={maybeAttach} autoAttached />);
    fireEvent.click(screen.getByTestId('debug-attach-fab'));

    fireEvent.change(screen.getByDisplayValue('wss://example.trycloudflare.com'), {
      target: { value: 'wss://edited.trycloudflare.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Attach' }));

    expect(maybeAttach).toHaveBeenCalledWith({
      attach: true,
      relayUrl: 'wss://edited.trycloudflare.com',
      deploymentId: 'test-deployment',
    });
  });
});
