import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessPaymentUseCase } from '../../../application/checkout/use-cases/process-payment.use-case';
import {
  PAYMENT_POLLING_POLICY,
  type PaymentPollingPolicy,
} from '../../../application/checkout/payment-polling-policy';
import { PAYMENT_REPOSITORY } from '../../../domain/payment/payment.repository';
import { WompiModule } from '../../../infrastructure/wompi/wompi.module';
import { PaymentPrismaRepository } from '../../../infrastructure/persistence/prisma/repositories/payment.prisma.repository';
import { ProductsModule } from '../products/products.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TransactionsModule, ProductsModule, WompiModule],
  controllers: [PaymentsController],
  providers: [
    ProcessPaymentUseCase,
    { provide: PAYMENT_REPOSITORY, useClass: PaymentPrismaRepository },
    {
      provide: PAYMENT_POLLING_POLICY,
      useFactory: (configService: ConfigService): PaymentPollingPolicy => ({
        intervalMs: configService.get<number>('wompi.pollIntervalMs') ?? 1500,
        maxAttempts: configService.get<number>('wompi.pollMaxAttempts') ?? 10,
      }),
      inject: [ConfigService],
    },
  ],
})
export class PaymentsModule {}
