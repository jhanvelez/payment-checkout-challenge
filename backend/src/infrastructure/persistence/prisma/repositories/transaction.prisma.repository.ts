import { Injectable } from '@nestjs/common';
import type {
  CreateTransactionData,
  TransactionRepository,
} from '../../../../domain/transaction/transaction.repository';
import type { Transaction } from '../../../../domain/transaction/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { PrismaService } from '../prisma.service';

const WITH_ITEMS = { items: true } as const;

@Injectable()
export class TransactionPrismaRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    const record = await this.prisma.transaction.create({
      data: {
        reference: data.reference,
        status: data.status,
        amountInCents: data.amountInCents,
        currency: data.currency,
        customerId: data.customerId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceInCents: item.unitPriceInCents,
          })),
        },
      },
      include: WITH_ITEMS,
    });
    return TransactionMapper.toDomain(record);
  }

  async findById(id: string): Promise<Transaction | null> {
    const record = await this.prisma.transaction.findUnique({
      where: { id },
      include: WITH_ITEMS,
    });
    return record ? TransactionMapper.toDomain(record) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const record = await this.prisma.transaction.findUnique({
      where: { reference },
      include: WITH_ITEMS,
    });
    return record ? TransactionMapper.toDomain(record) : null;
  }
}
