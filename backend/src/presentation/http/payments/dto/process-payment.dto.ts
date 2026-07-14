import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    example: 'tok_stagtest_5113_6Bfa2A6c8237ba7FB169fc7ba26D9789',
    description: 'Card token obtained by tokenizing the card directly with Wompi from the client',
  })
  @IsString()
  @MinLength(10)
  cardToken: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 36, required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(36)
  installments?: number;
}
