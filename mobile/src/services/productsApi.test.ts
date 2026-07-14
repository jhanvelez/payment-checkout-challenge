import { apiClient } from './apiClient';
import { fetchProductById, fetchProducts } from './productsApi';
import type { ProductDto } from '../types/api';

jest.mock('./apiClient');
const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function buildProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'producto-1',
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos',
    description: 'Producto de prueba',
    priceInCents: 18790000,
    currency: 'COP',
    stock: 34,
    imageUrl: null,
    ...overrides,
  };
}

describe('productsApi', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('fetches the product list from /products', async () => {
    const products = [buildProduct(), buildProduct({ id: 'producto-2' })];
    mockedGet.mockResolvedValue({ data: products });

    const result = await fetchProducts();

    expect(mockedGet).toHaveBeenCalledWith('/products');
    expect(result).toEqual(products);
  });

  it('fetches a single product by id from /products/:id', async () => {
    const product = buildProduct();
    mockedGet.mockResolvedValue({ data: product });

    const result = await fetchProductById('producto-1');

    expect(mockedGet).toHaveBeenCalledWith('/products/producto-1');
    expect(result).toEqual(product);
  });
});
