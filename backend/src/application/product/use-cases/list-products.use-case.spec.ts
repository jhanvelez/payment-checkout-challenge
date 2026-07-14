import { Product } from '../../../domain/product/product.entity';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { ListProductsUseCase } from './list-products.use-case';

function buildProduct(overrides: Partial<Record<string, unknown>> = {}): Product {
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
    const products = [buildProduct({ id: 'p1' }), buildProduct({ id: 'p2' })];
    repository.findAll.mockResolvedValue(products);

    const result = await useCase.execute();

    expect(result).toBe(products);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when there are no products', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
