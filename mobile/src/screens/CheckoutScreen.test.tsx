import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CheckoutScreen } from './CheckoutScreen';
import { cartReducer } from '../features/cart/cartSlice';
import { checkoutReducer } from '../features/checkout/checkoutSlice';
import { createTransaction } from '../services/transactionsApi';
import type { CartItem } from '../features/cart/cartSlice';
import type { TransactionDto } from '../types/api';

jest.mock('../services/transactionsApi');
const mockedCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'producto-1',
    name: 'Audífonos inalámbricos',
    imageUrl: null,
    unitPriceInCents: 18790000,
    currency: 'COP',
    quantity: 1,
    availableStock: 34,
    ...overrides,
  };
}

function buildTransaction(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: 'tx-1',
    reference: 'TX-ABC123',
    status: 'PENDING',
    amountInCents: 18790000,
    currency: 'COP',
    items: [{ productId: 'producto-1', quantity: 1, unitPriceInCents: 18790000 }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildStore(cartItems: CartItem[] = [buildCartItem()]) {
  return configureStore({
    reducer: { cart: cartReducer, checkout: checkoutReducer },
    preloadedState: { cart: { items: cartItems } },
  });
}

async function renderCheckout(store = buildStore()) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), reset: jest.fn() };
  const route = { key: 'Checkout', name: 'Checkout' as const, params: undefined };
  const utils = await render(
    <Provider store={store}>
      {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
      <CheckoutScreen navigation={navigation} route={route} />
    </Provider>,
  );
  return { ...utils, navigation, store };
}

async function fillValidForm() {
  await fireEvent.changeText(screen.getByTestId('checkout-fullName'), 'María Pérez');
  await fireEvent.changeText(screen.getByTestId('checkout-email'), 'maria@example.com');
  await fireEvent.changeText(screen.getByTestId('checkout-cardNumber'), '4242424242424242');
  await fireEvent.changeText(screen.getByTestId('checkout-cardHolder'), 'MARIA PEREZ');
  await fireEvent.changeText(screen.getByTestId('checkout-expMonth'), '12');
  await fireEvent.changeText(screen.getByTestId('checkout-expYear'), '30');
  await fireEvent.changeText(screen.getByTestId('checkout-cvc'), '123');
}

describe('CheckoutScreen', () => {
  beforeEach(() => {
    mockedCreateTransaction.mockReset();
  });

  it('shows an empty-cart message and returns to the store when the cart has no items', async () => {
    const { navigation } = await renderCheckout(buildStore([]));

    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy();
    await fireEvent.press(screen.getByText('Ir a la tienda'));

    expect(navigation.navigate).toHaveBeenCalledWith('Home');
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it('shows the cart summary and detects the card brand as the user types', async () => {
    await renderCheckout();

    expect(screen.getByText('Resumen del pedido')).toBeTruthy();
    expect(screen.queryByTestId('card-brand-badge')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('checkout-cardNumber'), '4242424242424242');

    expect(await screen.findByTestId('card-brand-badge')).toBeTruthy();
    expect(screen.getByText('VISA')).toBeTruthy();
  });

  it('shows validation errors and does not submit when required fields are missing', async () => {
    await renderCheckout();

    await fireEvent.press(screen.getByTestId('checkout-submit-button'));

    expect(await screen.findByText('Ingresa tu nombre completo')).toBeTruthy();
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it('creates the transaction and navigates to Processing with the card data on a valid submit', async () => {
    const transaction = buildTransaction();
    mockedCreateTransaction.mockResolvedValue(transaction);
    const { navigation } = await renderCheckout();

    await fillValidForm();
    await fireEvent.press(screen.getByTestId('checkout-submit-button'));

    await waitFor(() =>
      expect(mockedCreateTransaction).toHaveBeenCalledWith({
        customer: { email: 'maria@example.com', fullName: 'María Pérez', phone: undefined },
        items: [{ productId: 'producto-1', quantity: 1 }],
      }),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Processing', {
      transactionId: 'tx-1',
      card: {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'MARIA PEREZ',
      },
    });
  });

  it('shows an error message and does not navigate when the transaction creation fails', async () => {
    mockedCreateTransaction.mockRejectedValue(new Error('no pudimos crear la transacción'));
    const { navigation } = await renderCheckout();

    await fillValidForm();
    await fireEvent.press(screen.getByTestId('checkout-submit-button'));

    expect(await screen.findByText('no pudimos crear la transacción')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalledWith('Processing', expect.anything());
  });
});
