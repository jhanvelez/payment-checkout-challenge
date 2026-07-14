import { NotFoundException } from '@nestjs/common';
import { Product } from '../../../domain/product/product.entity';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import type { GetProductByIdUseCase } from '../../../application/product/use-cases/get-product-by-id.use-case';
import type { ListProductsUseCase } from '../../../application/product/use-cases/list-products.use-case';
import { ProductsController } from './products.controller';

function construirProducto(): Product {
  return new Product({
    id: 'producto-1',
    sku: 'WEBCAM-FHD-2',
    name: 'Cámara web Full HD',
    description: 'Producto de ejemplo usado en las pruebas automatizadas',
    priceInCents: 11990000,
    currency: 'COP',
    stock: 26,
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
      listProductsUseCase.execute.mockResolvedValue([construirProducto()]);

      const result = await controller.list();

      expect(result).toEqual([
        expect.objectContaining({
          id: 'producto-1',
          sku: 'WEBCAM-FHD-2',
          name: 'Cámara web Full HD',
        }),
      ]);
    });
  });

  describe('getById', () => {
    it('returns the product response DTO when found', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(construirProducto());

      const result = await controller.getById('producto-1');

      expect(result.id).toBe('producto-1');
    });

    it('translates ProductNotFoundError into a NotFoundException', async () => {
      getProductByIdUseCase.execute.mockRejectedValue(new ProductNotFoundError('id-inexistente'));

      await expect(controller.getById('id-inexistente')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
