import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import Login from './Login';
import { api } from '../lib/api';

// Mock axios
vi.mock('../lib/api', () => {
  const mockApi = {
    post: vi.fn(),
  };
  return {
    api: mockApi,
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should update email and password inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should submit form and navigate on successful login', async () => {
    const user = userEvent.setup();
    const mockToken = 'test-token-123';

    (api.post as any).mockResolvedValue({
      data: { token: mockToken },
    });

    renderWithProviders(<Login />, { initialToken: null });

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/studio');
    });

    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid email or password';

    (api.post as any).mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display generic error message when error response has no message', async () => {
    const user = userEvent.setup();

    (api.post as any).mockRejectedValue({
      response: {},
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should clear error message on new submission', async () => {
    const user = userEvent.setup();

    (api.post as any)
      .mockRejectedValueOnce({
        response: { data: { message: 'Error 1' } },
      })
      .mockResolvedValueOnce({
        data: { token: 'test-token' },
      });

    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // First submission - should fail
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error 1')).toBeInTheDocument();
    });

    // Second submission - should succeed and clear error
    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'correctpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Error 1')).not.toBeInTheDocument();
    });
  });

  it('should require email and password fields', () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

