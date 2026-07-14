import axios, { type AxiosError } from 'axios';
import { API_BASE_URL } from './env';
import type { ApiErrorBody } from '../types/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function extractApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const body = axiosError.response?.data;
  if (!body) {
    return axiosError.message || 'No pudimos conectar con el servidor. Intenta de nuevo.';
  }
  return Array.isArray(body.message) ? body.message.join(', ') : body.message;
}
