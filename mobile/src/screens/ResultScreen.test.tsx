import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ResultScreen } from './ResultScreen';
import { recordTransactionResult, transactionReducer } from '../features/transaction/transactionSlice';
import type { PaymentResultDto } from '../types/api';

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

function buildStore(result?: PaymentResultDto) {
  const store = configureStore({ reducer: { transaction: transactionReducer } });
  if (result) {
    store.dispatch(recordTransactionResult(result));
  }
  return store;
}

async function renderResult(store: ReturnType<typeof buildStore>) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), reset: jest.fn() };
  const route = { key: 'Result', name: 'Result' as const, params: undefined };
  const utils = await render(
    <Provider store={store}>
      {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
      <ResultScreen navigation={navigation} route={route} />
    </Provider>,
  );
  return { ...utils, navigation };
}

describe('ResultScreen', () => {
  it('shows the approved state with reference, amount and card', async () => {
    await renderResult(buildStore(buildPaymentResult({ status: 'APPROVED' })));

    expect(screen.getByText('¡Pago aprobado!')).toBeTruthy();
    expect(screen.getByText('TX-ABC123')).toBeTruthy();
    expect(screen.getByText('$ 187.900')).toBeTruthy();
    expect(screen.getByText('VISA •••• 4242')).toBeTruthy();
  });

  it('shows the declined state', async () => {
    await renderResult(buildStore(buildPaymentResult({ status: 'DECLINED' })));

    expect(screen.getByText('Pago rechazado')).toBeTruthy();
  });

  it('shows the error state', async () => {
    await renderResult(buildStore(buildPaymentResult({ status: 'ERROR', cardBrand: null, lastFour: null })));

    expect(screen.getByText('Ocurrió un error')).toBeTruthy();
  });

  it('resets the stack to Home when the fallback button is pressed with no transaction', async () => {
    const { navigation } = await renderResult(buildStore());

    expect(screen.getByText('Sin información de pago')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('result-home-button'));

    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('resets the stack to Home from the approved state', async () => {
    const { navigation } = await renderResult(buildStore(buildPaymentResult()));

    await fireEvent.press(screen.getByTestId('result-home-button'));

    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });
});
