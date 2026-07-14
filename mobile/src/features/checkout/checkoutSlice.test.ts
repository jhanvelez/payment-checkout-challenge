import { configureStore } from '@reduxjs/toolkit';
import { checkoutReducer, resetCheckout, startCheckout } from './checkoutSlice';
import { createTransaction } from '../../services/transactionsApi';
import type { TransactionDto } from '../../types/api';

jest.mock('../../services/transactionsApi');
const mockedCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;

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

function buildStore() {
  return configureStore({ reducer: { checkout: checkoutReducer } });
}

const payload = {
  customer: { email: 'maria@example.com', fullName: 'María Pérez' },
  items: [{ productId: 'producto-1', quantity: 1 }],
};

describe('checkoutSlice', () => {
  beforeEach(() => {
    mockedCreateTransaction.mockReset();
  });

  it('starts in idle with no customer or transaction', () => {
    const store = buildStore();

    expect(store.getState().checkout).toEqual({
      customer: null,
      transaction: null,
      status: 'idle',
      error: null,
    });
  });

  it('sets status to creating and stores the customer as soon as the request starts', () => {
    mockedCreateTransaction.mockReturnValue(new Promise(() => {}));
    const store = buildStore();

    store.dispatch(startCheckout(payload));

    expect(store.getState().checkout.status).toBe('creating');
    expect(store.getState().checkout.customer).toEqual(payload.customer);
  });

  it('stores the created transaction on success', async () => {
    const transaction = buildTransaction();
    mockedCreateTransaction.mockResolvedValue(transaction);
    const store = buildStore();

    await store.dispatch(startCheckout(payload));

    expect(store.getState().checkout.status).toBe('created');
    expect(store.getState().checkout.transaction).toEqual(transaction);
    expect(mockedCreateTransaction).toHaveBeenCalledWith(payload);
  });

  it('stores the error message on failure', async () => {
    mockedCreateTransaction.mockRejectedValue(new Error('sin conexión'));
    const store = buildStore();

    await store.dispatch(startCheckout(payload));

    expect(store.getState().checkout.status).toBe('failed');
    expect(store.getState().checkout.error).toBe('sin conexión');
  });

  it('resets to the initial state', async () => {
    mockedCreateTransaction.mockResolvedValue(buildTransaction());
    const store = buildStore();
    await store.dispatch(startCheckout(payload));

    store.dispatch(resetCheckout());

    expect(store.getState().checkout).toEqual({
      customer: null,
      transaction: null,
      status: 'idle',
      error: null,
    });
  });
});
