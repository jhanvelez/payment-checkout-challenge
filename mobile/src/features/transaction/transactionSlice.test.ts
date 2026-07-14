import { configureStore } from '@reduxjs/toolkit';
import { recordTransactionResult, selectLastTransaction, transactionReducer } from './transactionSlice';
import type { PaymentResultDto } from '../../types/api';

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
  return configureStore({ reducer: { transaction: transactionReducer } });
}

describe('transactionSlice', () => {
  it('starts with an empty history', () => {
    const store = buildStore();

    expect(store.getState().transaction.history).toEqual([]);
    expect(selectLastTransaction(store.getState())).toBeNull();
  });

  it('records a transaction result with a completedAt timestamp, most recent first', () => {
    const store = buildStore();

    store.dispatch(recordTransactionResult(buildPaymentResult({ transactionId: 'tx-1' })));
    store.dispatch(recordTransactionResult(buildPaymentResult({ transactionId: 'tx-2' })));

    const history = store.getState().transaction.history;
    expect(history).toHaveLength(2);
    expect(history[0].transactionId).toBe('tx-2');
    expect(history[0].completedAt).toEqual(expect.any(String));
    expect(selectLastTransaction(store.getState())?.transactionId).toBe('tx-2');
  });

  it('caps the history at 20 entries', () => {
    const store = buildStore();

    for (let i = 0; i < 25; i += 1) {
      store.dispatch(recordTransactionResult(buildPaymentResult({ transactionId: `tx-${i}` })));
    }

    expect(store.getState().transaction.history).toHaveLength(20);
    expect(store.getState().transaction.history[0].transactionId).toBe('tx-24');
  });
});
