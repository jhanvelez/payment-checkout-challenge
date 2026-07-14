import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const seededSku = 'SKU-E2E-TEST-PRODUCT';
  let seededProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    const created = await prisma.product.create({
      data: {
        sku: seededSku,
        name: 'E2E Test Product',
        description: 'Product created for the products e2e suite',
        priceInCents: 1000000,
        currency: 'COP',
        stock: 10,
      },
    });
    seededProductId = created.id;
  });

  afterAll(async () => {
    await prisma.product.delete({ where: { id: seededProductId } }).catch(() => undefined);
    await app.close();
  });

  it('GET /products returns the seeded product', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((res: { body: Array<{ sku: string }> }) => {
        expect(res.body.some((product) => product.sku === seededSku)).toBe(true);
      });
  });

  it('GET /products/:id returns the product when it exists', async () => {
    const response = await request(app.getHttpServer())
      .get(`/products/${seededProductId}`)
      .expect(200);

    expect(response.body).toMatchObject({ id: seededProductId, sku: seededSku });
  });

  it('GET /products/:id returns 404 for a well-formed but unknown id', () => {
    return request(app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('GET /products/:id returns 400 for a malformed id', () => {
    return request(app.getHttpServer()).get('/products/not-a-uuid').expect(400);
  });
});
