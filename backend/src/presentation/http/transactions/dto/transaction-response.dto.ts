import { ApiProperty } from '@nestjs/swagger';
import type { Transaction } from '../../../../domain/transaction/transaction.entity';

export class TransactionItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })
  productId: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 18790000 })
  unitPriceInCents: number;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })
  id: string;

  @ApiProperty({ example: 'TX-M1F9Z2-A1B2C3' })
  reference: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'DECLINED', 'ERROR'] })
  status: string;

  @ApiProperty({ example: 18790000 })
  amountInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ type: [TransactionItemResponseDto] })
  items: TransactionItemResponseDto[];

  @ApiProperty({ type: String, format: 'date-time', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  static fromDomain(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.status = transaction.status;
    dto.amountInCents = transaction.amountInCents;
    dto.currency = transaction.currency;
    dto.items = transaction.items;
    dto.createdAt = transaction.createdAt;
    return dto;
  }
}
