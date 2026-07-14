import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

interface TransactionResponseBody {
  reference: string;
  status: string;
  amountInCents: number;
  currency: string;
  items: Array<{ productId: string; quantity: number; unitPriceInCents: number }>;
}

describe('Transactions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let productoId: string;
  const skuPrueba = 'PRUEBA-E2E-TRANSACCIONES';
  const emailCliente = 'e2e.transacciones@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    const producto = await prisma.product.create({
      data: {
        sku: skuPrueba,
        name: 'Producto de prueba para transacciones',
        description: 'Producto creado para la suite e2e de transacciones',
        priceInCents: 5000000,
        currency: 'COP',
        stock: 3,
      },
    });
    productoId = producto.id;
  });

  afterAll(async () => {
    await prisma.transactionItem.deleteMany({ where: { productId: productoId } });
    await prisma.transaction
      .deleteMany({ where: { customer: { email: emailCliente } } })
      .catch(() => undefined);
    await prisma.customer.deleteMany({ where: { email: emailCliente } });
    await prisma.product.delete({ where: { id: productoId } });
    await app.close();
  });

  it('creates a PENDING transaction with the amount computed from the product price', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        customer: { email: emailCliente, fullName: 'Cliente de Prueba E2E' },
        items: [{ productId: productoId, quantity: 2 }],
      })
      .expect(201);

    const body = response.body as TransactionResponseBody;
    expect(body).toMatchObject({
      status: 'PENDING',
      amountInCents: 10000000,
      currency: 'COP',
      items: [{ productId: productoId, quantity: 2, unitPriceInCents: 5000000 }],
    });
    expect(body.reference).toMatch(/^TX-/);
  });

  it('reuses the customer when the same email orders again', async () => {
    const first = await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        customer: { email: emailCliente, fullName: 'Cliente de Prueba E2E' },
        items: [{ productId: productoId, quantity: 1 }],
      })
      .expect(201);

    const customerCount = await prisma.customer.count({ where: { email: emailCliente } });
    const body = first.body as TransactionResponseBody;

    expect(customerCount).toBe(1);
    expect(body.status).toBe('PENDING');
  });

  it('returns 400 when the cart quantity exceeds available stock', () => {
    return request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        customer: { email: emailCliente, fullName: 'Cliente de Prueba E2E' },
        items: [{ productId: productoId, quantity: 999 }],
      })
      .expect(400);
  });

  it('returns 400 for a malformed request body', () => {
    return request(app.getHttpServer())
      .post('/v1/transactions')
      .send({ customer: { email: 'not-an-email' }, items: [] })
      .expect(400);
  });
});
