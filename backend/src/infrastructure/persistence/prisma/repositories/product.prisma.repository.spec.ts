import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../../domain/product/product.errors';
import { ProductPrismaRepository } from './product.prisma.repository';

function buildRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'product-1',
    sku: 'SKU-1',
    name: 'Test product',
    description: 'A product used for testing',
    priceInCents: 10000,
    currency: 'COP',
    stock: 5,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProductPrismaRepository', () => {
  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let repository: ProductPrismaRepository;

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    repository = new ProductPrismaRepository(prisma as never);
  });

  describe('findAll', () => {
    it('maps every record to a domain Product', async () => {
      prisma.product.findMany.mockResolvedValue([
        buildRecord({ id: 'p1' }),
        buildRecord({ id: 'p2' }),
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
    });
  });

  describe('findById', () => {
    it('returns null when the record does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repository.findById('missing');

      expect(result).toBeNull();
    });

    it('maps the record to a domain Product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(buildRecord());

      const result = await repository.findById('product-1');

      expect(result?.id).toBe('product-1');
    });
  });

  describe('decreaseStock', () => {
    it('decrements stock and returns the updated product on success', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(buildRecord({ stock: 3 }));

      const result = await repository.decreaseStock('product-1', 2);

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'product-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(result.stock).toBe(3);
    });

    it('throws InsufficientStockError when stock is too low', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findUnique.mockResolvedValue(buildRecord({ stock: 1 }));

      await expect(repository.decreaseStock('product-1', 5)).rejects.toThrow(
        InsufficientStockError,
      );
    });

    it('throws ProductNotFoundError when the product does not exist', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(repository.decreaseStock('missing', 1)).rejects.toThrow(ProductNotFoundError);
    });
  });
});
