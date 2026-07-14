import { NotFoundException } from '@nestjs/common';
import { Product } from '../../../domain/product/product.entity';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import type { GetProductByIdUseCase } from '../../../application/product/use-cases/get-product-by-id.use-case';
import type { ListProductsUseCase } from '../../../application/product/use-cases/list-products.use-case';
import { ProductsController } from './products.controller';

function buildProduct(): Product {
  return new Product({
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
  });
}

describe('ProductsController', () => {
  let listProductsUseCase: jest.Mocked<ListProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;
  let controller: ProductsController;

  beforeEach(() => {
    listProductsUseCase = { execute: jest.fn() } as unknown as jest.Mocked<ListProductsUseCase>;
    getProductByIdUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetProductByIdUseCase>;
    controller = new ProductsController(listProductsUseCase, getProductByIdUseCase);
  });

  describe('list', () => {
    it('returns products mapped to response DTOs', async () => {
      listProductsUseCase.execute.mockResolvedValue([buildProduct()]);

      const result = await controller.list();

      expect(result).toEqual([
        expect.objectContaining({ id: 'product-1', sku: 'SKU-1', name: 'Test product' }),
      ]);
    });
  });

  describe('getById', () => {
    it('returns the product response DTO when found', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(buildProduct());

      const result = await controller.getById('product-1');

      expect(result.id).toBe('product-1');
    });

    it('translates ProductNotFoundError into a NotFoundException', async () => {
      getProductByIdUseCase.execute.mockRejectedValue(new ProductNotFoundError('missing-id'));

      await expect(controller.getById('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
