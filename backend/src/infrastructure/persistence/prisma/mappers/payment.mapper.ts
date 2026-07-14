import type { Payment as PrismaPayment } from '@prisma/client';
import { Payment } from '../../../../domain/payment/payment.entity';

export class PaymentMapper {
  static toDomain(record: PrismaPayment): Payment {
    return new Payment({
      id: record.id,
      transactionId: record.transactionId,
      wompiTransactionId: record.wompiTransactionId,
      status: record.status,
      paymentMethodType: record.paymentMethodType,
      cardBrand: record.cardBrand,
      lastFour: record.lastFour,
      rawResponse: record.rawResponse,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
