import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders the heading and every domain card', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'SDK Example' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Auth' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Storage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'IAP' })).toBeInTheDocument();
  });

  it('filters domain cards by API name', async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.getByRole('heading', { name: 'Auth' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Storage' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/검색/), 'appLogin');

    expect(screen.getByRole('heading', { name: 'Auth' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Storage' })).not.toBeInTheDocument();
  });

  it('shows the empty-state message when nothing matches and resets via the clear button', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(screen.getByPlaceholderText(/검색/), '__no_such_api__');
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '초기화' }));
    expect(screen.queryByText('검색 결과가 없습니다')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Auth' })).toBeInTheDocument();
  });
});
