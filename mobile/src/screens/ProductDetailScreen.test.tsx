import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductDetailScreen } from './ProductDetailScreen';
import { cartReducer } from '../features/cart/cartSlice';
import { productsReducer } from '../features/products/productsSlice';
import { fetchProductById } from '../services/productsApi';
import type { ProductDto } from '../types/api';

jest.mock('../services/productsApi');
const mockedFetchProductById = fetchProductById as jest.MockedFunction<typeof fetchProductById>;

function buildProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'producto-1',
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos',
    description: 'Producto de prueba',
    priceInCents: 10000,
    currency: 'COP',
    stock: 5,
    imageUrl: null,
    ...overrides,
  };
}

function buildStore(preloadedProducts: ProductDto[] = []) {
  return configureStore({
    reducer: { products: productsReducer, cart: cartReducer },
    preloadedState: {
      products: { items: preloadedProducts, status: 'idle' as const, error: null },
    },
  });
}

async function renderDetail(productId: string, store: ReturnType<typeof buildStore>) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const route = { key: 'ProductDetail', name: 'ProductDetail' as const, params: { productId } };
  const utils = await render(
    <Provider store={store}>
      {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
      <ProductDetailScreen navigation={navigation} route={route} />
    </Provider>,
  );
  return { ...utils, navigation, store };
}

describe('ProductDetailScreen', () => {
  beforeEach(() => {
    mockedFetchProductById.mockReset();
  });

  it('renders immediately from the already-loaded products cache, without calling the API', async () => {
    const store = buildStore([buildProduct()]);

    await renderDetail('producto-1', store);

    expect(await screen.findByText('Audífonos inalámbricos')).toBeTruthy();
    expect(mockedFetchProductById).not.toHaveBeenCalled();
  });

  it('fetches the product when it is not already cached', async () => {
    mockedFetchProductById.mockResolvedValue(buildProduct({ name: 'Producto remoto' }));
    const store = buildStore([]);

    await renderDetail('producto-1', store);

    expect(await screen.findByText('Producto remoto')).toBeTruthy();
    expect(mockedFetchProductById).toHaveBeenCalledWith('producto-1');
  });

  it('adds the selected quantity to the cart and goes back', async () => {
    const store = buildStore([buildProduct()]);
    const { navigation } = await renderDetail('producto-1', store);

    await screen.findByText('Audífonos inalámbricos');
    await fireEvent.press(screen.getByLabelText('Aumentar cantidad'));
    await fireEvent.press(screen.getByTestId('add-to-cart-button'));

    await waitFor(() =>
      expect(store.getState().cart.items).toEqual([
        expect.objectContaining({ productId: 'producto-1', quantity: 2 }),
      ]),
    );
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('shows an out-of-stock notice and hides the add-to-cart button', async () => {
    const store = buildStore([buildProduct({ stock: 0 })]);

    await renderDetail('producto-1', store);

    expect(await screen.findByText('Producto agotado')).toBeTruthy();
    expect(screen.queryByTestId('add-to-cart-button')).toBeNull();
  });

  it('shows an error state with retry when the fetch fails', async () => {
    mockedFetchProductById.mockRejectedValue(new Error('producto no disponible'));
    const store = buildStore([]);

    await renderDetail('producto-1', store);

    expect(await screen.findByText('producto no disponible')).toBeTruthy();

    mockedFetchProductById.mockResolvedValue(buildProduct());
    await fireEvent.press(screen.getByText('Reintentar'));

    expect(await screen.findByText('Audífonos inalámbricos')).toBeTruthy();
  });
});
