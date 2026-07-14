import { Product } from '../../../domain/product/product.entity';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';

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
    const product = buildProduct();
    repository.findById.mockResolvedValue(product);

    const result = await useCase.execute('product-1');

    expect(result).toBe(product);
    expect(repository.findById).toHaveBeenCalledWith('product-1');
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(ProductNotFoundError);
  });
});
