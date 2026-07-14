import { configureStore } from '@reduxjs/toolkit';
import { loadProducts, productsReducer } from './productsSlice';
import { fetchProducts } from '../../services/productsApi';
import type { ProductDto } from '../../types/api';

jest.mock('../../services/productsApi');

const mockedFetchProducts = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

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

function buildStore() {
  return configureStore({ reducer: { products: productsReducer } });
}

describe('productsSlice', () => {
  it('starts idle with no items', () => {
    const store = buildStore();
    expect(store.getState().products).toEqual({ items: [], status: 'idle', error: null });
  });

  it('loadProducts populates items on success', async () => {
    const products = [buildProduct(), buildProduct({ id: 'producto-2' })];
    mockedFetchProducts.mockResolvedValue(products);
    const store = buildStore();

    await store.dispatch(loadProducts());

    const state = store.getState().products;
    expect(state.status).toBe('succeeded');
    expect(state.items).toEqual(products);
    expect(state.error).toBeNull();
  });

  it('loadProducts sets loading while in flight', () => {
    mockedFetchProducts.mockReturnValue(new Promise(() => undefined));
    const store = buildStore();

    void store.dispatch(loadProducts());

    expect(store.getState().products.status).toBe('loading');
  });

  it('loadProducts records the error message on failure', async () => {
    mockedFetchProducts.mockRejectedValue(new Error('network down'));
    const store = buildStore();

    await store.dispatch(loadProducts());

    const state = store.getState().products;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('network down');
    expect(state.items).toEqual([]);
  });
});
