import { Product } from '../../../domain/product/product.entity';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';

function construirProducto(): Product {
  return new Product({
    id: 'producto-1',
    sku: 'RELOJ-SPORT-2',
    name: 'Reloj inteligente deportivo',
    description: 'Producto de ejemplo usado en las pruebas automatizadas',
    priceInCents: 45900000,
    currency: 'COP',
    stock: 9,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetProductByIdUseCase', () => {
  let repository: jest.Mocked<ProductRepository>;
  let useCase: GetProductByIdUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };
    useCase = new GetProductByIdUseCase(repository);
  });

  it('returns the product when it exists', async () => {
    const producto = construirProducto();
    repository.findById.mockResolvedValue(producto);

    const result = await useCase.execute('producto-1');

    expect(result).toBe(producto);
    expect(repository.findById).toHaveBeenCalledWith('producto-1');
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(ProductNotFoundError);
  });
});
