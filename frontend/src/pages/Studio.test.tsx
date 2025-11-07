import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import Studio from './Studio';
import { useGenerate, useGenerations } from '../lib/hooks';
import type { Generation } from '../lib/api';

// Mock the hooks
vi.mock('../lib/hooks', () => ({
  useGenerate: vi.fn(),
  useGenerations: vi.fn(),
}));

// No need to mock useNavigate - Studio doesn't use it

const mockGenerations: Generation[] = [
  {
    id: '1',
    prompt: 'A beautiful summer dress',
    style: 'casual',
    imageUrl: '/static/test1.png',
    status: 'succeeded',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    prompt: 'Elegant evening gown',
    style: 'formal',
    imageUrl: '/static/test2.png',
    status: 'succeeded',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('Studio', () => {
  const mockMutate = vi.fn();
  const mockedUseGenerate = vi.mocked(useGenerate);
  const mockedUseGenerations = vi.mocked(useGenerations);
  const mockGenerateMutation = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
    attempt: 0,
    isRetrying: false,
    isOutOfRetries: false,
    cancel: vi.fn(),
  } as unknown as ReturnType<typeof useGenerate>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockReset();
    mockedUseGenerate.mockReturnValue(mockGenerateMutation);
    mockedUseGenerations.mockReturnValue({
      data: mockGenerations,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGenerations>);
  });

  it('should render studio page with header and logout button', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByRole('heading', { name: /fashion ai studio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should render generation form', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByRole('heading', { name: /create new generation/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the fashion/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/modern, vintage, casual/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('should render file input', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should update prompt and style inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const promptInput = screen.getByPlaceholderText(/describe the fashion/i) as HTMLTextAreaElement;
    const styleInput = screen.getByPlaceholderText(/modern, vintage, casual/i) as HTMLInputElement;

    await user.type(promptInput, 'A beautiful dress');
    await user.type(styleInput, 'modern');

    expect(promptInput).toHaveValue('A beautiful dress');
    expect(styleInput).toHaveValue('modern');
  });

  it('should call generate mutation when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const promptInput = screen.getByPlaceholderText(/describe the fashion/i) as HTMLTextAreaElement;
    const styleInput = screen.getByPlaceholderText(/modern, vintage, casual/i) as HTMLInputElement;
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await user.type(promptInput, 'A beautiful dress');
    await user.type(styleInput, 'modern');
    await user.click(generateButton);

    expect(mockMutate).toHaveBeenCalledWith({
      prompt: 'A beautiful dress',
      style: 'modern',
      image: undefined,
    });
  });

  it('should not call generate mutation when prompt or style is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const generateButton = screen.getByRole('button', { name: /generate/i });
    expect(generateButton).toBeDisabled();

    await user.click(generateButton);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should disable generate button when prompt is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const promptInput = screen.getByPlaceholderText(/describe the fashion/i) as HTMLTextAreaElement;
    const styleInput = screen.getByPlaceholderText(/modern, vintage, casual/i) as HTMLInputElement;
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await user.type(styleInput, 'modern');
    expect(generateButton).toBeDisabled();

    await user.type(promptInput, 'A beautiful dress');
    expect(generateButton).not.toBeDisabled();
  });

  it('should include file in mutation when file is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const promptInput = screen.getByPlaceholderText(/describe the fashion/i) as HTMLTextAreaElement;
    const styleInput = screen.getByPlaceholderText(/modern, vintage, casual/i) as HTMLInputElement;
    const generateButton = screen.getByRole('button', { name: /generate/i });

    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await user.type(promptInput, 'A beautiful dress');
    await user.type(styleInput, 'modern');
    await user.click(generateButton);

    expect(mockMutate).toHaveBeenCalledWith({
      prompt: 'A beautiful dress',
      style: 'modern',
      image: file,
    });
  });

  it('should display selected file name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    expect(screen.getByText(/selected: test\.png/i)).toBeInTheDocument();
  });

  it('should display generations list', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByRole('heading', { name: /recent generations/i })).toBeInTheDocument();
    expect(screen.getByText('A beautiful summer dress')).toBeInTheDocument();
    expect(screen.getByText('Elegant evening gown')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockedUseGenerations.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useGenerations>);

    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display empty state when no generations', () => {
    mockedUseGenerations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGenerations>);

    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByText(/no generations yet/i)).toBeInTheDocument();
  });

  it('should restore prompt and style when restore button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const restoreButtons = screen.getAllByRole('button', { name: /restore/i });
    await user.click(restoreButtons[0]);

    const promptInput = screen.getByPlaceholderText(/describe the fashion/i) as HTMLTextAreaElement;
    const styleInput = screen.getByPlaceholderText(/modern, vintage, casual/i) as HTMLInputElement;

    expect(promptInput).toHaveValue('A beautiful summer dress');
    expect(styleInput).toHaveValue('casual');
  });

  it('should display pending state on generate button', () => {
    mockedUseGenerate.mockReturnValue({
      ...mockGenerateMutation,
      isPending: true,
    } as unknown as ReturnType<typeof useGenerate>);

    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const generateButton = screen.getByRole('button', { name: /generating/i });
    expect(generateButton).toBeDisabled();
  });

  it('should display error message when generation fails', () => {
    mockedUseGenerate.mockReturnValue({
      ...mockGenerateMutation,
      isError: true,
      error: new Error('Generation failed'),
    } as unknown as ReturnType<typeof useGenerate>);

    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
  });

  it('should call logout and clear token on logout button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    expect(localStorage.getItem('token')).toBe('test-token');

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('should display generation status badges', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const statusBadges = screen.getAllByText(/succeeded/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('should display generation images', () => {
    renderWithProviders(<Studio />, { initialToken: 'test-token' });

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(mockGenerations.length);
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('/static/test1.png'));
  });
});

