import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
