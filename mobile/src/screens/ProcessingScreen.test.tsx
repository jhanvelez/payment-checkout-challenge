import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProcessingScreen } from './ProcessingScreen';
import { cartReducer } from '../features/cart/cartSlice';
import { checkoutReducer } from '../features/checkout/checkoutSlice';
import { paymentReducer } from '../features/payment/paymentSlice';
import { transactionReducer } from '../features/transaction/transactionSlice';
import { tokenizeCard } from '../services/wompiClient';
import { submitPayment } from '../services/transactionsApi';
import type { CartItem } from '../features/cart/cartSlice';
import type { PaymentResultDto } from '../types/api';

jest.mock('../services/wompiClient');
jest.mock('../services/transactionsApi');
const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;
const mockedSubmitPayment = submitPayment as jest.MockedFunction<typeof submitPayment>;

const card = { number: '4242424242424242', cvc: '123', expMonth: '12', expYear: '30', cardHolder: 'MARIA PEREZ' };

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

function buildPaymentResult(overrides: Partial<PaymentResultDto> = {}): PaymentResultDto {
  return {
    transactionId: 'tx-1',
    reference: 'TX-ABC123',
    status: 'APPROVED',
    amountInCents: 18790000,
    currency: 'COP',
    cardBrand: 'VISA',
    lastFour: '4242',
    ...overrides,
  };
}

function buildStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      checkout: checkoutReducer,
      payment: paymentReducer,
      transaction: transactionReducer,
    },
    preloadedState: { cart: { items: [buildCartItem()] } },
  });
}

async function renderProcessing(store = buildStore()) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), reset: jest.fn() };
  const route = { key: 'Processing', name: 'Processing' as const, params: { transactionId: 'tx-1', card } };
  const utils = await render(
    <Provider store={store}>
      {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
      <ProcessingScreen navigation={navigation} route={route} />
    </Provider>,
  );
  return { ...utils, navigation, store };
}

describe('ProcessingScreen', () => {
  beforeEach(() => {
    mockedTokenizeCard.mockReset();
    mockedSubmitPayment.mockReset();
  });

  it('tokenizes the card, submits the payment, records the result and navigates to Result', async () => {
    mockedTokenizeCard.mockResolvedValue({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
    const paymentResult = buildPaymentResult();
    mockedSubmitPayment.mockResolvedValue(paymentResult);
    const { navigation, store } = await renderProcessing();

    expect(screen.getByText('Validando tu tarjeta...')).toBeTruthy();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('Result'));

    expect(mockedTokenizeCard).toHaveBeenCalledWith(card);
    expect(mockedSubmitPayment).toHaveBeenCalledWith({ transactionId: 'tx-1', cardToken: 'tok_123' });
    expect(store.getState().transaction.history[0]).toMatchObject(paymentResult);
    expect(store.getState().cart.items).toEqual([]);
    expect(store.getState().payment.tokenizeStatus).toBe('idle');
  });

  it('shows an error with retry when tokenizing the card fails, and recovers on retry', async () => {
    mockedTokenizeCard.mockRejectedValueOnce(new Error('tarjeta inválida'));
    mockedTokenizeCard.mockResolvedValueOnce({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
    mockedSubmitPayment.mockResolvedValue(buildPaymentResult());
    const { navigation } = await renderProcessing();

    expect(await screen.findByText('tarjeta inválida')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Reintentar'));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('Result'));
    expect(mockedTokenizeCard).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the payment gateway call fails', async () => {
    mockedTokenizeCard.mockResolvedValue({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
    mockedSubmitPayment.mockRejectedValue(new Error('gateway no disponible'));
    const { navigation } = await renderProcessing();

    expect(await screen.findByText('gateway no disponible')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
