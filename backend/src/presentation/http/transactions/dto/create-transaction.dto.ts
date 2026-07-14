import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTransactionCustomerDto {
  @ApiProperty({ example: 'maria.perez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @MinLength(3)
  fullName: string;

  @ApiProperty({ example: '+57 300 1234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateTransactionItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTransactionDto {
  @ApiProperty({ type: CreateTransactionCustomerDto })
  @ValidateNested()
  @Type(() => CreateTransactionCustomerDto)
  customer: CreateTransactionCustomerDto;

  @ApiProperty({ type: [CreateTransactionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];
}
