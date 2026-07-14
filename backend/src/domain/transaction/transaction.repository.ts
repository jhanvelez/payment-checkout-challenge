import type { TransactionItemProps } from './transaction-item';
import type { Transaction, TransactionStatus } from './transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface CreateTransactionData {
  reference: string;
  status: TransactionStatus;
  amountInCents: number;
  currency: string;
  customerId: string;
  items: TransactionItemProps[];
}

export interface TransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
  updateStatus(
    id: string,
    status: TransactionStatus,
    wompiTransactionId: string | null,
  ): Promise<Transaction>;
}
