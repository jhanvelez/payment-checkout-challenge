import { Injectable } from '@nestjs/common';
import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../../domain/product/product.errors';
import type { Product } from '../../../../domain/product/product.entity';
import type { ProductRepository } from '../../../../domain/product/product.repository';
import { PrismaService } from '../prisma.service';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    const records = await this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
    return records.map((record) => ProductMapper.toDomain(record));
  }

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async decreaseStock(
    productId: string,
    quantity: number,
    transactionId: string,
  ): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      if (result.count === 0) {
        const existing = await tx.product.findUnique({ where: { id: productId } });
        if (!existing) {
          throw new ProductNotFoundError(productId);
        }
        throw new InsufficientStockError(productId, quantity, existing.stock);
      }

      await tx.inventoryMovement.create({
        data: { productId, transactionId, quantity, type: 'DECREASED' },
      });

      const updated = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      return ProductMapper.toDomain(updated);
    });
  }
}
