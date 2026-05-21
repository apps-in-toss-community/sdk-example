import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DebugDiagnosticPanel } from './DebugDiagnosticPanel';

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
});
