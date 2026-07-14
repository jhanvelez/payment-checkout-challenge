import type { Product as PrismaProduct } from '@prisma/client';
import { Product } from '../../../../domain/product/product.entity';

export class ProductMapper {
  static toDomain(record: PrismaProduct): Product {
    return new Product({
      id: record.id,
      sku: record.sku,
      name: record.name,
      description: record.description,
      priceInCents: record.priceInCents,
      currency: record.currency,
      stock: record.stock,
      imageUrl: record.imageUrl,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
