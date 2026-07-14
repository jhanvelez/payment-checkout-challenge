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

  async decreaseStock(id: string, quantity: number): Promise<Product> {
    const result = await this.prisma.product.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });

    if (result.count === 0) {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new ProductNotFoundError(id);
      }
      throw new InsufficientStockError(id, quantity, existing.stock);
    }

    const updated = await this.prisma.product.findUniqueOrThrow({ where: { id } });
    return ProductMapper.toDomain(updated);
  }
}
