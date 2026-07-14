import type {
  Transaction as PrismaTransaction,
  TransactionItem as PrismaTransactionItem,
} from '@prisma/client';
import { Transaction } from '../../../../domain/transaction/transaction.entity';

type PrismaTransactionWithItems = PrismaTransaction & { items: PrismaTransactionItem[] };

export class TransactionMapper {
  static toDomain(record: PrismaTransactionWithItems): Transaction {
    return new Transaction({
      id: record.id,
      reference: record.reference,
      status: record.status,
      amountInCents: record.amountInCents,
      currency: record.currency,
      customerId: record.customerId,
      wompiTransactionId: record.wompiTransactionId,
      items: record.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
