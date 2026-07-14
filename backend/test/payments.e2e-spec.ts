import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import axios from 'axios';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

/**
 * These tests exercise the real Wompi sandbox (no mocks) end to end,
 * through our own /v1/transactions/:id/payments endpoint - the same path
 * production traffic takes. Card numbers are Wompi's documented sandbox
 * fixtures: 4242... always resolves APPROVED, 4111... always resolves
 * DECLINED. See https://docs.wompi.co/en/docs/colombia/datos-de-prueba-en-sandbox/
 */
describe('Payments (e2e, live Wompi sandbox)', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let productId: string;
  const skuPrueba = 'PRUEBA-E2E-PAGOS';

  async function tokenizeCard(cardNumber: string, attempt = 1): Promise<string> {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    try {
      const response = await axios.post<{ data: { id: string } }>(
        `${process.env.WOMPI_SANDBOX_URL}/tokens/cards`,
        {
          number: cardNumber,
          cvc: '123',
          exp_month: '12',
          exp_year: '29',
          card_holder: 'Cliente De Prueba E2E',
        },
        { headers: { Authorization: `Bearer ${publicKey}` } },
      );
      return response.data.data.id;
    } catch (error) {
      // The Wompi sandbox is an external dependency; retry once on transient
      // network blips instead of failing the whole suite on a single hiccup.
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return tokenizeCard(cardNumber, attempt + 1);
      }
      throw error;
    }
  }

  async function createTransaction(email: string, quantity = 1): Promise<{ id: string }> {
    const response = await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        customer: { email, fullName: 'Cliente De Prueba E2E' },
        items: [{ productId, quantity }],
      })
      .expect(201);
    return response.body as { id: string };
  }

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
        name: 'Producto de prueba para pagos',
        description: 'Producto creado para la suite e2e de pagos contra Wompi sandbox',
        priceInCents: 5000000,
        currency: 'COP',
        stock: 100,
      },
    });
    productId = producto.id;
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { productId } });
    await prisma.payment.deleteMany({
      where: { transaction: { items: { some: { productId } } } },
    });
    await prisma.transactionItem.deleteMany({ where: { productId } });
    await prisma.transaction
      .deleteMany({ where: { customer: { email: { contains: 'e2e-pagos' } } } })
      .catch(() => undefined);
    await prisma.customer.deleteMany({ where: { email: { contains: 'e2e-pagos' } } });
    await prisma.product.delete({ where: { id: productId } });
    await app.close();
  });

  it('approves a payment with the APPROVED test card and decreases stock', async () => {
    const transaction = await createTransaction('approved@e2e-pagos.example.com');
    const cardToken = await tokenizeCard('4242424242424242');

    const response = await request(app.getHttpServer())
      .post(`/v1/transactions/${transaction.id}/payments`)
      .send({ cardToken })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'APPROVED',
      cardBrand: 'VISA',
      lastFour: '4242',
    });

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(99);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { transactionId: transaction.id },
    });
    expect(movement).toMatchObject({ type: 'DECREASED', quantity: 1 });
  });

  it('declines a payment with the DECLINED test card and leaves stock untouched', async () => {
    const transaction = await createTransaction('declined@e2e-pagos.example.com');
    const cardToken = await tokenizeCard('4111111111111111');

    const response = await request(app.getHttpServer())
      .post(`/v1/transactions/${transaction.id}/payments`)
      .send({ cardToken })
      .expect(201);

    expect(response.body).toMatchObject({ status: 'DECLINED', cardBrand: 'VISA' });

    const movement = await prisma.inventoryMovement.findFirst({
      where: { transactionId: transaction.id },
    });
    expect(movement).toBeNull();
  });

  it('rejects paying the same transaction twice with 409', async () => {
    const transaction = await createTransaction('idempotencia@e2e-pagos.example.com');
    const cardToken = await tokenizeCard('4242424242424242');

    await request(app.getHttpServer())
      .post(`/v1/transactions/${transaction.id}/payments`)
      .send({ cardToken })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/transactions/${transaction.id}/payments`)
      .send({ cardToken })
      .expect(409);
  });

  it('returns 404 when the transaction does not exist', () => {
    return request(app.getHttpServer())
      .post('/v1/transactions/00000000-0000-4000-8000-000000000000/payments')
      .send({ cardToken: 'tok_test_does_not_matter' })
      .expect(404);
  });

  it('returns 400 for a malformed payment request', async () => {
    const transaction = await createTransaction('validacion@e2e-pagos.example.com');

    return request(app.getHttpServer())
      .post(`/v1/transactions/${transaction.id}/payments`)
      .send({ cardToken: 'short' })
      .expect(400);
  });
});
