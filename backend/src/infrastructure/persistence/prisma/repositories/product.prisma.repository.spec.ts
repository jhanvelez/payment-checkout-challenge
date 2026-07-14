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
  let tx: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
    inventoryMovement: { create: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock } & typeof tx;
  let repository: ProductPrismaRepository;

  beforeEach(() => {
    tx = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
      inventoryMovement: { create: jest.fn() },
    };
    prisma = {
      ...tx,
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    repository = new ProductPrismaRepository(prisma as never);
  });

  describe('findAll', () => {
    it('maps every record to a domain Product', async () => {
      tx.product.findMany.mockResolvedValue([
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
      tx.product.findUnique.mockResolvedValue(null);

      const result = await repository.findById('id-inexistente');

      expect(result).toBeNull();
    });

    it('maps the record to a domain Product when found', async () => {
      tx.product.findUnique.mockResolvedValue(construirRegistro());

      const result = await repository.findById('producto-1');

      expect(result?.id).toBe('producto-1');
    });
  });

  describe('decreaseStock', () => {
    it('decrements stock, records the inventory movement and returns the updated product', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 1 });
      tx.product.findUniqueOrThrow.mockResolvedValue(construirRegistro({ stock: 45 }));

      const result = await repository.decreaseStock('producto-1', 2, 'transaccion-1');

      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'producto-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
        data: {
          productId: 'producto-1',
          transactionId: 'transaccion-1',
          quantity: 2,
          type: 'DECREASED',
        },
      });
      expect(result.stock).toBe(45);
    });

    it('throws InsufficientStockError when stock is too low, without recording a movement', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 0 });
      tx.product.findUnique.mockResolvedValue(construirRegistro({ stock: 1 }));

      await expect(repository.decreaseStock('producto-1', 5, 'transaccion-1')).rejects.toThrow(
        InsufficientStockError,
      );
      expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it('throws ProductNotFoundError when the product does not exist', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 0 });
      tx.product.findUnique.mockResolvedValue(null);

      await expect(repository.decreaseStock('id-inexistente', 1, 'transaccion-1')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });
});
