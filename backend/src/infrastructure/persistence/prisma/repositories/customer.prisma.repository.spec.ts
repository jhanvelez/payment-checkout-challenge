import { CustomerPrismaRepository } from './customer.prisma.repository';

function construirRegistro(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cliente-1',
    email: 'camila.rodriguez@example.com',
    fullName: 'Camila Rodríguez',
    phone: '+57 301 5551234',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('CustomerPrismaRepository', () => {
  let prisma: {
    customer: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
  };
  let repository: CustomerPrismaRepository;

  beforeEach(() => {
    prisma = {
      customer: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    };
    repository = new CustomerPrismaRepository(prisma as never);
  });

  describe('findById', () => {
    it('returns null when no customer matches the id', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const result = await repository.findById('id-inexistente');

      expect(result).toBeNull();
    });

    it('maps the record to a domain Customer when found', async () => {
      prisma.customer.findUnique.mockResolvedValue(construirRegistro());

      const result = await repository.findById('cliente-1');

      expect(result?.id).toBe('cliente-1');
    });
  });

  describe('findByEmail', () => {
    it('returns null when no customer matches the email', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('sin-registro@example.com');

      expect(result).toBeNull();
    });

    it('maps the most recent matching record to a domain Customer', async () => {
      prisma.customer.findFirst.mockResolvedValue(construirRegistro());

      const result = await repository.findByEmail('camila.rodriguez@example.com');

      expect(result?.email).toBe('camila.rodriguez@example.com');
    });
  });

  describe('create', () => {
    it('persists and maps the new customer', async () => {
      prisma.customer.create.mockResolvedValue(construirRegistro());

      const result = await repository.create({
        email: 'camila.rodriguez@example.com',
        fullName: 'Camila Rodríguez',
        phone: '+57 301 5551234',
      });

      expect(result.fullName).toBe('Camila Rodríguez');
    });
  });
});
