import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with no token when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBeNull();
  });

  it('should initialize with token from localStorage', () => {
    const testToken = 'test-token-123';
    localStorage.setItem('token', testToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe(testToken);
  });

  it('should set token and save to localStorage', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const newToken = 'new-token-456';

    act(() => {
      result.current.setToken(newToken);
    });

    expect(result.current.token).toBe(newToken);
    expect(localStorage.getItem('token')).toBe(newToken);
  });

  it('should remove token and clear localStorage on logout', () => {
    const testToken = 'test-token-123';
    localStorage.setItem('token', testToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe(testToken);

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should remove token when setToken is called with null', () => {
    const testToken = 'test-token-123';
    localStorage.setItem('token', testToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.setToken(null);
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    consoleSpy.mockRestore();
  });
});

