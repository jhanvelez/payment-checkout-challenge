import { ApiProperty } from '@nestjs/swagger';
import type { ProcessPaymentResult } from '../../../../application/checkout/use-cases/process-payment.use-case';

export class PaymentResultResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })
  transactionId: string;

  @ApiProperty({ example: 'TX-M1F9Z2-A1B2C3' })
  reference: string;

  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'DECLINED', 'ERROR'] })
  status: string;

  @ApiProperty({ example: 18790000 })
  amountInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ example: 'VISA', nullable: true })
  cardBrand: string | null;

  @ApiProperty({ example: '4242', nullable: true })
  lastFour: string | null;

  static fromDomain(result: ProcessPaymentResult): PaymentResultResponseDto {
    const dto = new PaymentResultResponseDto();
    dto.transactionId = result.transaction.id;
    dto.reference = result.transaction.reference;
    dto.status = result.transaction.status;
    dto.amountInCents = result.transaction.amountInCents;
    dto.currency = result.transaction.currency;
    dto.cardBrand = result.payment.cardBrand;
    dto.lastFour = result.payment.lastFour;
    return dto;
  }
}
