import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../domain/payment/payment-gateway.port';
import { WompiService } from './wompi.service';

@Module({
  imports: [HttpModule],
  providers: [{ provide: PAYMENT_GATEWAY, useClass: WompiService }],
  exports: [PAYMENT_GATEWAY],
})
export class WompiModule {}
