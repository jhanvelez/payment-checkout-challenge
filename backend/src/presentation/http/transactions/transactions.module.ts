import { Module } from '@nestjs/common';
import { CreateTransactionUseCase } from '../../../application/checkout/use-cases/create-transaction.use-case';
import { CUSTOMER_REPOSITORY } from '../../../domain/customer/customer.repository';
import { TRANSACTION_REPOSITORY } from '../../../domain/transaction/transaction.repository';
import { CustomerPrismaRepository } from '../../../infrastructure/persistence/prisma/repositories/customer.prisma.repository';
import { TransactionPrismaRepository } from '../../../infrastructure/persistence/prisma/repositories/transaction.prisma.repository';
import { ProductsModule } from '../products/products.module';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [ProductsModule],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerPrismaRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionPrismaRepository },
  ],
  exports: [TRANSACTION_REPOSITORY, CUSTOMER_REPOSITORY],
})
export class TransactionsModule {}
