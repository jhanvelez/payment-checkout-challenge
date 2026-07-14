import { PaymentPrismaRepository } from './payment.prisma.repository';

function construirRegistro(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pago-1',
    transactionId: 'transaccion-1',
    wompiTransactionId: 'wompi-tx-1',
    status: 'APPROVED',
    paymentMethodType: 'CARD',
    cardBrand: 'VISA',
    lastFour: '4242',
    rawResponse: { id: 'wompi-tx-1' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PaymentPrismaRepository', () => {
  let prisma: { payment: { create: jest.Mock; findUnique: jest.Mock } };
  let repository: PaymentPrismaRepository;

  beforeEach(() => {
    prisma = { payment: { create: jest.fn(), findUnique: jest.fn() } };
    repository = new PaymentPrismaRepository(prisma as never);
  });

  describe('create', () => {
    it('persists and maps the payment', async () => {
      prisma.payment.create.mockResolvedValue(construirRegistro());

      const result = await repository.create({
        transactionId: 'transaccion-1',
        wompiTransactionId: 'wompi-tx-1',
        status: 'APPROVED',
        paymentMethodType: 'CARD',
        cardBrand: 'VISA',
        lastFour: '4242',
        rawResponse: { id: 'wompi-tx-1' },
      });

      expect(result.status).toBe('APPROVED');
      expect(result.cardBrand).toBe('VISA');
    });
  });

  describe('findByTransactionId', () => {
    it('returns null when there is no payment for the transaction', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await repository.findByTransactionId('id-inexistente');

      expect(result).toBeNull();
    });

    it('maps the record when found', async () => {
      prisma.payment.findUnique.mockResolvedValue(construirRegistro());

      const result = await repository.findByTransactionId('transaccion-1');

      expect(result?.lastFour).toBe('4242');
    });
  });
});
