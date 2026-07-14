import { Product } from '../../../domain/product/product.entity';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { ListProductsUseCase } from './list-products.use-case';

function construirProducto(overrides: Partial<Record<string, unknown>> = {}): Product {
  return new Product({
    id: 'producto-1',
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos con cancelación de ruido',
    description: 'Producto de ejemplo usado en las pruebas automatizadas',
    priceInCents: 18790000,
    currency: 'COP',
    stock: 34,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('ListProductsUseCase', () => {
  let repository: jest.Mocked<ProductRepository>;
  let useCase: ListProductsUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };
    useCase = new ListProductsUseCase(repository);
  });

  it('returns all products from the repository', async () => {
    const productos = [
      construirProducto({ id: 'producto-1', sku: 'AUD-ANC-100' }),
      construirProducto({ id: 'producto-2', sku: 'TEC-MEC-87' }),
    ];
    repository.findAll.mockResolvedValue(productos);

    const result = await useCase.execute();

    expect(result).toBe(productos);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when there are no products', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
