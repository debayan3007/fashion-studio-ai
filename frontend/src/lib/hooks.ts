import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api, type Generation, type CreateGenerationRequest, type LoginRequest, type SignupRequest, type AuthResponse } from './api';

// Query keys
export const generationKeys = {
  all: ['generations'] as const,
  lists: () => [...generationKeys.all, 'list'] as const,
};

// Hook to create a new generation
export function useGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGenerationRequest): Promise<Generation> => {
      const formData = new FormData();
      formData.append('prompt', data.prompt);
      formData.append('style', data.style);
      if (data.image) {
        formData.append('file', data.image);
      }

      const response = await api.post<Generation>('/generations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch generations list after creating a new one
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() });
    },
  });
}

// Hook to fetch all generations for the current user
export function useGenerations() {
  return useQuery({
    queryKey: generationKeys.lists(),
    queryFn: async (): Promise<Generation[]> => {
      const response = await api.get<Generation[]>('/generations');
      return response.data;
    },
  });
}

// Hook to login
export function useLogin() {
  const { setToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update token in context (which also updates localStorage)
      setToken(data.token);
    },
  });
}

// Hook to signup
export function useSignup() {
  const { setToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data: SignupRequest): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update token in context (which also updates localStorage)
      setToken(data.token);
    },
  });
}
