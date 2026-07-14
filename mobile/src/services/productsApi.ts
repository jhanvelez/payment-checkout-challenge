import { apiClient } from './apiClient';
import type { ProductDto } from '../types/api';

export async function fetchProducts(): Promise<ProductDto[]> {
  const response = await apiClient.get<ProductDto[]>('/products');
  return response.data;
}

export async function fetchProductById(id: string): Promise<ProductDto> {
  const response = await apiClient.get<ProductDto>(`/products/${id}`);
  return response.data;
}
