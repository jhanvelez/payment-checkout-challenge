import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './infrastructure/config/configuration';
import { envValidationSchema } from './infrastructure/config/env.validation';
import { pinoLoggerConfig } from './infrastructure/logger/logger.config';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { AllExceptionsFilter } from './presentation/filters/http-exception.filter';
import { ProductsModule } from './presentation/http/products/products.module';
import { TransactionsModule } from './presentation/http/transactions/transactions.module';
import { PaymentsModule } from './presentation/http/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    LoggerModule.forRoot(pinoLoggerConfig(process.env.NODE_ENV === 'production')),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),
    PrismaModule,
    ProductsModule,
    TransactionsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
