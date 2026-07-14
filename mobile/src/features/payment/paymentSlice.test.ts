import { configureStore } from '@reduxjs/toolkit';
import { paymentReducer, resetPayment, submitPaymentThunk, tokenizeCardThunk } from './paymentSlice';
import { tokenizeCard } from '../../services/wompiClient';
import { submitPayment } from '../../services/transactionsApi';
import type { PaymentResultDto } from '../../types/api';

jest.mock('../../services/wompiClient');
jest.mock('../../services/transactionsApi');
const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;
const mockedSubmitPayment = submitPayment as jest.MockedFunction<typeof submitPayment>;

const cardInput = {
  number: '4242424242424242',
  cvc: '123',
  expMonth: '12',
  expYear: '30',
  cardHolder: 'MARIA PEREZ',
};

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
  return configureStore({ reducer: { payment: paymentReducer } });
}

describe('paymentSlice', () => {
  beforeEach(() => {
    mockedTokenizeCard.mockReset();
    mockedSubmitPayment.mockReset();
  });

  it('starts idle', () => {
    const store = buildStore();

    expect(store.getState().payment).toMatchObject({
      tokenizeStatus: 'idle',
      paymentStatus: 'idle',
      cardToken: null,
      result: null,
    });
  });

  describe('tokenizeCardThunk', () => {
    it('stores the card token, brand and last four on success', async () => {
      mockedTokenizeCard.mockResolvedValue({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
      const store = buildStore();

      await store.dispatch(tokenizeCardThunk(cardInput));

      expect(mockedTokenizeCard).toHaveBeenCalledWith(cardInput);
      expect(store.getState().payment).toMatchObject({
        tokenizeStatus: 'succeeded',
        cardToken: 'tok_123',
        cardBrand: 'VISA',
        lastFour: '4242',
      });
    });

    it('stores an error message when tokenization fails', async () => {
      mockedTokenizeCard.mockRejectedValue(new Error('tarjeta inválida'));
      const store = buildStore();

      await store.dispatch(tokenizeCardThunk(cardInput));

      expect(store.getState().payment.tokenizeStatus).toBe('failed');
      expect(store.getState().payment.error).toBe('tarjeta inválida');
    });
  });

  describe('submitPaymentThunk', () => {
    it('stores the payment result on success, regardless of approved/declined status', async () => {
      const result = buildPaymentResult({ status: 'DECLINED' });
      mockedSubmitPayment.mockResolvedValue(result);
      const store = buildStore();

      await store.dispatch(submitPaymentThunk({ transactionId: 'tx-1', cardToken: 'tok_123' }));

      expect(store.getState().payment.paymentStatus).toBe('succeeded');
      expect(store.getState().payment.result).toEqual(result);
    });

    it('stores an error message when the gateway call fails', async () => {
      mockedSubmitPayment.mockRejectedValue(new Error('gateway no disponible'));
      const store = buildStore();

      await store.dispatch(submitPaymentThunk({ transactionId: 'tx-1', cardToken: 'tok_123' }));

      expect(store.getState().payment.paymentStatus).toBe('failed');
      expect(store.getState().payment.error).toBe('gateway no disponible');
    });
  });

  it('resets to the initial state', async () => {
    mockedTokenizeCard.mockResolvedValue({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
    const store = buildStore();
    await store.dispatch(tokenizeCardThunk(cardInput));

    store.dispatch(resetPayment());

    expect(store.getState().payment).toMatchObject({
      tokenizeStatus: 'idle',
      cardToken: null,
    });
  });
});
