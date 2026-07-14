import { TransactionPrismaRepository } from './transaction.prisma.repository';

function construirRegistro(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'transaccion-1',
    reference: 'TX-EXAMPLE-001',
    status: 'PENDING',
    amountInCents: 37580000,
    currency: 'COP',
    customerId: 'cliente-1',
    wompiTransactionId: null,
    items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 18790000 }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface CreateArgs {
  data: { reference: string; items: { create: unknown[] } };
}

describe('TransactionPrismaRepository', () => {
  let prisma: {
    transaction: {
      create: jest.Mock<Promise<ReturnType<typeof construirRegistro>>, [CreateArgs]>;
      findUnique: jest.Mock<Promise<ReturnType<typeof construirRegistro> | null>, [unknown]>;
      update: jest.Mock<Promise<ReturnType<typeof construirRegistro>>, [unknown]>;
    };
  };
  let repository: TransactionPrismaRepository;

  beforeEach(() => {
    prisma = {
      transaction: {
        create: jest.fn<Promise<ReturnType<typeof construirRegistro>>, [CreateArgs]>(),
        findUnique: jest.fn<Promise<ReturnType<typeof construirRegistro> | null>, [unknown]>(),
        update: jest.fn<Promise<ReturnType<typeof construirRegistro>>, [unknown]>(),
      },
    };
    repository = new TransactionPrismaRepository(prisma as never);
  });

  describe('create', () => {
    it('creates the transaction with nested items and maps the result', async () => {
      prisma.transaction.create.mockResolvedValue(construirRegistro());

      const result = await repository.create({
        reference: 'TX-EXAMPLE-001',
        status: 'PENDING',
        amountInCents: 37580000,
        currency: 'COP',
        customerId: 'cliente-1',
        items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 18790000 }],
      });

      const [callArgs] = prisma.transaction.create.mock.calls[0];
      expect(callArgs.data.reference).toBe('TX-EXAMPLE-001');
      expect(callArgs.data.items.create).toEqual([
        { productId: 'producto-1', quantity: 2, unitPriceInCents: 18790000 },
      ]);
      expect(result.reference).toBe('TX-EXAMPLE-001');
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns null when the transaction does not exist', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('maps the record when found by reference', async () => {
      prisma.transaction.findUnique.mockResolvedValue(construirRegistro());

      const result = await repository.findByReference('TX-EXAMPLE-001');

      expect(result?.status).toBe('PENDING');
    });
  });

  describe('updateStatus', () => {
    it('updates the status and gateway id and maps the result', async () => {
      prisma.transaction.update.mockResolvedValue(
        construirRegistro({ status: 'APPROVED', wompiTransactionId: 'wompi-tx-1' }),
      );

      const result = await repository.updateStatus('transaccion-1', 'APPROVED', 'wompi-tx-1');

      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'transaccion-1' },
          data: { status: 'APPROVED', wompiTransactionId: 'wompi-tx-1' },
        }),
      );
      expect(result.status).toBe('APPROVED');
    });
  });
});
