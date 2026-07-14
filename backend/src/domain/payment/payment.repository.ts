import type { CardBrand, Payment, PaymentStatus } from './payment.entity';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface CreatePaymentData {
  transactionId: string;
  wompiTransactionId: string | null;
  status: PaymentStatus;
  paymentMethodType: string | null;
  cardBrand: CardBrand | null;
  lastFour: string | null;
  rawResponse: unknown;
}

export interface PaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
}
