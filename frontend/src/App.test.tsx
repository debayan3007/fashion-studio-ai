import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test/test-utils';
import App from './App';

// Mock the page components to simplify routing tests
vi.mock('./pages/Login', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/Signup', () => ({
  default: () => <div>Signup Page</div>,
}));

vi.mock('./pages/Studio', () => ({
  default: () => <div>Studio Page</div>,
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render login page at /login', () => {
    renderWithProviders(<App />, {
      initialToken: null,
      initialEntries: ['/login'],
      useMemoryRouter: true,
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render signup page at /signup', () => {
    renderWithProviders(<App />, {
      initialToken: null,
      initialEntries: ['/signup'],
      useMemoryRouter: true,
    });

    expect(screen.getByText('Signup Page')).toBeInTheDocument();
  });

  it('should render studio page at /studio when authenticated', () => {
    renderWithProviders(<App />, {
      initialToken: 'test-token',
      initialEntries: ['/studio'],
      useMemoryRouter: true,
    });

    expect(screen.getByText('Studio Page')).toBeInTheDocument();
  });
});

