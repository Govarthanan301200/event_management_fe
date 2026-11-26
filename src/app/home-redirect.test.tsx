import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeRedirect } from './home-redirect';

/** jsdom has no matchMedia: answer the phone query (max-width: 639px) as given. */
function stubPhone(phone: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: phone && query.includes('639px'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

function renderHome() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <HomeRedirect /> },
      { path: '/dashboard', element: <p>Dashboard page</p> },
      { path: '/today', element: <p>Today page</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('home (decisions 2026-11-26)', () => {
  it('opens the Dashboard at 640px and up', async () => {
    stubPhone(false);
    renderHome();
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('opens Today on a phone', async () => {
    stubPhone(true);
    renderHome();
    expect(await screen.findByText('Today page')).toBeInTheDocument();
  });
});
