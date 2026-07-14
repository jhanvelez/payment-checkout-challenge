import { apiClient } from './apiClient';
import type { PaymentResultDto, TransactionDto } from '../types/api';

export interface CreateTransactionPayload {
  customer: { email: string; fullName: string; phone?: string };
  items: Array<{ productId: string; quantity: number }>;
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<TransactionDto> {
  const response = await apiClient.post<TransactionDto>('/transactions', payload);
  return response.data;
}

export interface SubmitPaymentPayload {
  transactionId: string;
  cardToken: string;
  installments?: number;
}

export async function submitPayment(payload: SubmitPaymentPayload): Promise<PaymentResultDto> {
  const response = await apiClient.post<PaymentResultDto>(
    `/transactions/${payload.transactionId}/payments`,
    { cardToken: payload.cardToken, installments: payload.installments ?? 1 },
  );
  return response.data;
}
