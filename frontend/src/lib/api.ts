import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:4000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Types
export interface Generation {
  id: string;
  prompt: string;
  style: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

export interface CreateGenerationRequest {
  prompt: string;
  style: string;
  image?: File;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}
