import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import { api, type Generation, type CreateGenerationRequest, type LoginRequest, type SignupRequest, type AuthResponse } from './api';

// Query keys
export const generationKeys = {
  all: ['generations'] as const,
  lists: () => [...generationKeys.all, 'list'] as const,
};

const MAX_GENERATE_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hook to create a new generation
export function useGenerate() {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);

  const mutation = useMutation({
    mutationFn: async (data: CreateGenerationRequest): Promise<Generation> => {
      const formData = new FormData();
      formData.append('prompt', data.prompt);
      formData.append('style', data.style);
      if (data.image) {
        formData.append('file', data.image);
      }

      for (let attemptNumber = 1; attemptNumber <= MAX_GENERATE_RETRIES; attemptNumber++) {
        try {
          setAttempt(attemptNumber);
          const response = await api.post<Generation>('/generations', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          return response.data;
        } catch (error) {
          const axiosError = error as AxiosError;
          const isRateLimited = axiosError.response?.status === 429;

          if (!isRateLimited || attemptNumber === MAX_GENERATE_RETRIES) {
            throw error;
          }

          await delay(RETRY_DELAY_MS * attemptNumber);
        }
      }

      throw new Error('Failed to create generation after retries');
    },
    onSuccess: () => {
      // Invalidate and refetch generations list after creating a new one
      queryClient.invalidateQueries({ queryKey: generationKeys.lists() });
    },
    onSettled: () => {
      setAttempt(0);
    },
  });

  return {
    ...mutation,
    attempt,
    isRetrying: mutation.isPending && attempt > 1,
  };
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
