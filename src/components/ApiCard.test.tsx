import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiCard } from './ApiCard';

describe('ApiCard', () => {
  it('renders the API name and description', () => {
    render(
      <ApiCard
        name="Storage.setItem"
        description="값 저장"
        params={[]}
        execute={async () => undefined}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Storage.setItem' })).toBeInTheDocument();
    expect(screen.getByText('값 저장')).toBeInTheDocument();
  });

  it('runs execute with parsed params on click and shows the result', async () => {
    const user = userEvent.setup();
    const execute = vi.fn(async ({ amount }: { amount: number }) => ({ doubled: amount * 2 }));

    render(
      <ApiCard
        name="math.double"
        params={[
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            defaultValue: '21',
            parse: (v: string) => Number(v),
          },
        ]}
        execute={execute}
      />,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ amount: 21 });
    expect(await screen.findByText('Success')).toBeInTheDocument();
    expect(screen.getByText(/"doubled": 42/)).toBeInTheDocument();
  });

  it('shows the docs link when docsUrl is provided', () => {
    render(
      <ApiCard
        name="getPlatformOS"
        params={[]}
        execute={async () => undefined}
        docsUrl="https://docs.aitc.dev/environment/getPlatformOS"
      />,
    );
    const link = screen.getByRole('link', { name: /Docs/i });
    expect(link).toHaveAttribute('href', 'https://docs.aitc.dev/environment/getPlatformOS');
  });
});
