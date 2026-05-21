import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildDiagnosticLog, DebugDiagnosticPanel } from './DebugDiagnosticPanel';

const setClipboardText = vi.hoisted(() => vi.fn<(text: string) => Promise<void>>());
vi.mock('@apps-in-toss/web-framework', () => ({ setClipboardText }));

describe('DebugDiagnosticPanel', () => {
  it('renders the floating button collapsed by default', () => {
    render(<DebugDiagnosticPanel locationSearch="" gate={{ attach: false, reason: 'opt-in' }} />);
    expect(screen.getByTestId('debug-diagnostic-fab')).toBeInTheDocument();
    expect(screen.queryByTestId('debug-diagnostic-panel')).not.toBeInTheDocument();
  });

  it('shows the raw location.search and parsed params when opened', () => {
    render(
      <DebugDiagnosticPanel
        locationSearch="?_deploymentId=abc&debug=1&relay=wss%3A%2F%2Fr.example"
        gate={{ attach: true }}
      />,
    );
    fireEvent.click(screen.getByTestId('debug-diagnostic-fab'));

    expect(screen.getByTestId('debug-diagnostic-location-search')).toHaveTextContent(
      '?_deploymentId=abc&debug=1&relay=wss%3A%2F%2Fr.example',
    );
    const params = screen.getByTestId('debug-diagnostic-params');
    expect(params).toHaveTextContent('_deploymentId=abc');
    expect(params).toHaveTextContent('debug=1');
    expect(params).toHaveTextContent('relay=wss://r.example');
  });

  it('reports the gate reason when the gate is blocked', () => {
    render(
      <DebugDiagnosticPanel
        locationSearch="?_deploymentId=abc"
        gate={{ attach: false, reason: 'opt-in' }}
      />,
    );
    fireEvent.click(screen.getByTestId('debug-diagnostic-fab'));

    expect(screen.getByTestId('debug-diagnostic-gate')).toHaveTextContent('attach=false');
    expect(screen.getByTestId('debug-diagnostic-gate')).toHaveTextContent('reason=opt-in');
  });

  it('copies the diagnostic log via the SDK clipboard API', async () => {
    setClipboardText.mockResolvedValueOnce(undefined);
    render(
      <DebugDiagnosticPanel
        locationSearch="?_deploymentId=abc"
        gate={{ attach: false, reason: 'opt-in' }}
      />,
    );
    fireEvent.click(screen.getByTestId('debug-diagnostic-fab'));
    fireEvent.click(screen.getByTestId('debug-diagnostic-copy'));

    await waitFor(() => {
      expect(setClipboardText).toHaveBeenCalledOnce();
    });
    const copied = setClipboardText.mock.calls[0]?.[0] ?? '';
    expect(copied).toContain('location.search: ?_deploymentId=abc');
    expect(copied).toContain('gate: attach=false reason=opt-in');
  });

  it('shows a failure label when the SDK clipboard call rejects', async () => {
    setClipboardText.mockRejectedValueOnce(new Error('denied'));
    render(<DebugDiagnosticPanel locationSearch="" gate={{ attach: false, reason: 'opt-in' }} />);
    fireEvent.click(screen.getByTestId('debug-diagnostic-fab'));
    fireEvent.click(screen.getByTestId('debug-diagnostic-copy'));

    await waitFor(() => {
      expect(screen.getByTestId('debug-diagnostic-copy')).toHaveTextContent('복사 실패');
    });
  });
});

describe('buildDiagnosticLog', () => {
  it('renders each query param on its own line plus the gate verdict', () => {
    const log = buildDiagnosticLog('?_deploymentId=abc&debug=1', {
      attach: false,
      reason: 'invalid-relay',
    });
    expect(log).toContain('location.search: ?_deploymentId=abc&debug=1');
    expect(log).toContain('  _deploymentId=abc');
    expect(log).toContain('  debug=1');
    expect(log).toContain('gate: attach=false reason=invalid-relay');
    expect(log).toContain('userAgent:');
  });

  it('marks an empty search and a passing gate', () => {
    const log = buildDiagnosticLog('', { attach: true });
    expect(log).toContain('location.search: (empty)');
    expect(log).toContain('  (none)');
    expect(log).toContain('gate: attach=true');
  });
});
