import { ApiProperty } from '@nestjs/swagger';
import type { Product } from '../../../../domain/product/product.entity';

export class ProductResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })
  id: string;

  @ApiProperty({ example: 'SKU-HEADPHONES-001' })
  sku: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  name: string;

  @ApiProperty({ example: 'Over-ear headphones with active noise cancellation.' })
  description: string;

  @ApiProperty({ example: 25000000, description: 'Price in cents' })
  priceInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ example: 42 })
  stock: number;

  @ApiProperty({ example: 'https://example.com/headphones.png', nullable: true })
  imageUrl: string | null;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.sku = product.sku;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceInCents = product.priceInCents;
    dto.currency = product.currency;
    dto.stock = product.stock;
    dto.imageUrl = product.imageUrl;
    return dto;
  }
}
