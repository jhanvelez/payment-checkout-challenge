import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../../domain/product/product.errors';
import { ProductPrismaRepository } from './product.prisma.repository';

function construirRegistro(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'producto-1',
    sku: 'PARL-BT-360',
    name: 'Parlante portátil 360°',
    description: 'Producto de ejemplo usado en las pruebas automatizadas',
    priceInCents: 14990000,
    currency: 'COP',
    stock: 47,
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
        construirRegistro({ id: 'producto-1' }),
        construirRegistro({ id: 'producto-2', sku: 'HUB-USBC-7EN1' }),
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('producto-1');
    });
  });

  describe('findById', () => {
    it('returns null when the record does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repository.findById('id-inexistente');

      expect(result).toBeNull();
    });

    it('maps the record to a domain Product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(construirRegistro());

      const result = await repository.findById('producto-1');

      expect(result?.id).toBe('producto-1');
    });
  });

  describe('decreaseStock', () => {
    it('decrements stock and returns the updated product on success', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(construirRegistro({ stock: 45 }));

      const result = await repository.decreaseStock('producto-1', 2);

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'producto-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(result.stock).toBe(45);
    });

    it('throws InsufficientStockError when stock is too low', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findUnique.mockResolvedValue(construirRegistro({ stock: 1 }));

      await expect(repository.decreaseStock('producto-1', 5)).rejects.toThrow(
        InsufficientStockError,
      );
    });

    it('throws ProductNotFoundError when the product does not exist', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(repository.decreaseStock('id-inexistente', 1)).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });
});
