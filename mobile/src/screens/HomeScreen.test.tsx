import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { HomeScreen } from './HomeScreen';
import { cartReducer, addItem } from '../features/cart/cartSlice';
import { productsReducer } from '../features/products/productsSlice';
import { fetchProducts } from '../services/productsApi';
import type { ProductDto } from '../types/api';

jest.mock('../services/productsApi');
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
  return configureStore({ reducer: { products: productsReducer, cart: cartReducer } });
}

async function renderHome(store = buildStore()) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const route = { key: 'Home', name: 'Home' as const, params: undefined };
  const utils = await render(
    <Provider store={store}>
      {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
      <HomeScreen navigation={navigation} route={route} />
    </Provider>,
  );
  return { ...utils, navigation, store };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockedFetchProducts.mockReset();
  });

  it('shows the product catalog once it loads', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct(), buildProduct({ id: 'producto-2', name: 'Teclado mecánico' })]);

    await renderHome();

    await waitFor(() => expect(screen.getByText('Audífonos inalámbricos')).toBeTruthy());
    expect(screen.getByText('Teclado mecánico')).toBeTruthy();
  });

  it('navigates to the product detail screen on tap', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct()]);
    const { navigation } = await renderHome();

    await waitFor(() => expect(screen.getByTestId('product-card-producto-1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('product-card-producto-1'));

    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetail', { productId: 'producto-1' });
  });

  it('shows an error state with retry when loading fails', async () => {
    mockedFetchProducts.mockRejectedValue(new Error('sin conexión'));

    await renderHome();

    await waitFor(() => expect(screen.getByText('sin conexión')).toBeTruthy());

    mockedFetchProducts.mockResolvedValue([buildProduct()]);
    await fireEvent.press(screen.getByText('Reintentar'));

    await waitFor(() => expect(screen.getByText('Audífonos inalámbricos')).toBeTruthy());
  });

  it('shows the cart bar only when the cart has items, and it opens checkout', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct()]);
    const store = buildStore();
    const { navigation } = await renderHome(store);

    await waitFor(() => expect(screen.getByTestId('product-card-producto-1')).toBeTruthy());
    expect(screen.queryByTestId('cart-bar')).toBeNull();

    await act(() => {
      store.dispatch(addItem({ product: buildProduct(), quantity: 1 }));
    });

    await waitFor(() => expect(screen.getByTestId('cart-bar')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('cart-bar'));
    expect(navigation.navigate).toHaveBeenCalledWith('Checkout');
  });
});
