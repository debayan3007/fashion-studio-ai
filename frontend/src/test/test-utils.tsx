import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialToken?: string | null;
  initialEntries?: string[];
  useMemoryRouter?: boolean;
}

// Create a wrapper component that sets token synchronously
function TestAuthProvider({ children, initialToken }: { children: React.ReactNode; initialToken?: string | null }) {
  const [token, setTokenState] = React.useState<string | null>(initialToken || null);

  React.useEffect(() => {
    // Also check localStorage on mount
    const saved = localStorage.getItem('token');
    if (saved) setTokenState(saved);
  }, []);

  // Set token in localStorage if provided
  React.useEffect(() => {
    if (initialToken) {
      localStorage.setItem('token', initialToken);
    }
  }, [initialToken]);

  const setToken = React.useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(t);
  }, []);

  const logout = React.useCallback(() => setToken(null), [setToken]);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
  initialToken = null,
  initialEntries = ['/'],
  useMemoryRouter = false,
}: AllTheProvidersProps) {
  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = useMemoryRouter ? { initialEntries } : {};

  return (
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>
        <TestAuthProvider initialToken={initialToken}>{children}</TestAuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialToken?: string | null;
  initialEntries?: string[];
  useMemoryRouter?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { queryClient, initialToken, initialEntries, useMemoryRouter, ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders
      queryClient={queryClient}
      initialToken={initialToken}
      initialEntries={initialEntries}
      useMemoryRouter={useMemoryRouter}
    >
      {children}
    </AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

