import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import Signup from './Signup';
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

const mockedApiPost = vi.mocked(api.post);

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render signup form', () => {
    renderWithProviders(<Signup />);

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('should update email and password inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should submit form and navigate on successful signup', async () => {
    const user = userEvent.setup();
    const mockToken = 'test-token-456';

    mockedApiPost.mockResolvedValue({
      data: { token: mockToken },
    });

    renderWithProviders(<Signup />, { initialToken: null });

    await user.type(screen.getByPlaceholderText(/email/i), 'newuser@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'newuser@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/studio');
    });

    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('should display error message on signup failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'User already exists';

    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    renderWithProviders(<Signup />);

    await user.type(screen.getByPlaceholderText(/email/i), 'existing@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display generic error message when error response has no message', async () => {
    const user = userEvent.setup();

    mockedApiPost.mockRejectedValue({
      response: {},
    });

    renderWithProviders(<Signup />);

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
  });

  it('should clear error message on new submission', async () => {
    const user = userEvent.setup();

    mockedApiPost
      .mockRejectedValueOnce({
        response: { data: { message: 'Error 1' } },
      })
      .mockResolvedValueOnce({
        data: { token: 'test-token' },
      });

    renderWithProviders(<Signup />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // First submission - should fail
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');
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
    renderWithProviders(<Signup />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

