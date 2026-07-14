import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Payment } from '../../../../domain/payment/payment.entity';
import type {
  CreatePaymentData,
  PaymentRepository,
} from '../../../../domain/payment/payment.repository';
import { PaymentMapper } from '../mappers/payment.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PaymentPrismaRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    const record = await this.prisma.payment.create({
      data: {
        transactionId: data.transactionId,
        wompiTransactionId: data.wompiTransactionId,
        status: data.status,
        paymentMethodType: data.paymentMethodType,
        cardBrand: data.cardBrand,
        lastFour: data.lastFour,
        rawResponse: data.rawResponse as Prisma.InputJsonValue,
      },
    });
    return PaymentMapper.toDomain(record);
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const record = await this.prisma.payment.findUnique({ where: { transactionId } });
    return record ? PaymentMapper.toDomain(record) : null;
  }
}
