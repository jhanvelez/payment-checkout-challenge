import { apiClient } from './apiClient';
import { createTransaction, submitPayment } from './transactionsApi';
import type { PaymentResultDto, TransactionDto } from '../types/api';

jest.mock('./apiClient');
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

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

describe('transactionsApi', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('creates a transaction with the customer and items payload', async () => {
    const transaction = buildTransaction();
    mockedPost.mockResolvedValue({ data: transaction });
    const payload = {
      customer: { email: 'maria@example.com', fullName: 'María Pérez' },
      items: [{ productId: 'producto-1', quantity: 1 }],
    };

    const result = await createTransaction(payload);

    expect(mockedPost).toHaveBeenCalledWith('/transactions', payload);
    expect(result).toEqual(transaction);
  });

  it('submits a payment defaulting to 1 installment', async () => {
    const paymentResult = buildPaymentResult();
    mockedPost.mockResolvedValue({ data: paymentResult });

    const result = await submitPayment({ transactionId: 'tx-1', cardToken: 'tok_123' });

    expect(mockedPost).toHaveBeenCalledWith('/transactions/tx-1/payments', {
      cardToken: 'tok_123',
      installments: 1,
    });
    expect(result).toEqual(paymentResult);
  });

  it('submits a payment with the requested installments', async () => {
    mockedPost.mockResolvedValue({ data: buildPaymentResult() });

    await submitPayment({ transactionId: 'tx-1', cardToken: 'tok_123', installments: 6 });

    expect(mockedPost).toHaveBeenCalledWith('/transactions/tx-1/payments', {
      cardToken: 'tok_123',
      installments: 6,
    });
  });
});
