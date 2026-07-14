import { Customer } from '../../../domain/customer/customer.entity';
import type { CustomerRepository } from '../../../domain/customer/customer.repository';
import type {
  GatewayChargeResult,
  PaymentGatewayPort,
} from '../../../domain/payment/payment-gateway.port';
import { Payment } from '../../../domain/payment/payment.entity';
import type { PaymentRepository } from '../../../domain/payment/payment.repository';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { Transaction } from '../../../domain/transaction/transaction.entity';
import {
  PaymentGatewayError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/transaction/transaction.errors';
import type { TransactionRepository } from '../../../domain/transaction/transaction.repository';
import type { PaymentPollingPolicy } from '../payment-polling-policy';
import { ProcessPaymentUseCase } from './process-payment.use-case';

function construirTransaccion(overrides: Partial<Record<string, unknown>> = {}): Transaction {
  return new Transaction({
    id: 'transaccion-1',
    reference: 'TX-EXAMPLE-001',
    status: 'PENDING',
    amountInCents: 5000000,
    currency: 'COP',
    customerId: 'cliente-1',
    wompiTransactionId: null,
    items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 2500000 }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function construirCliente(): Customer {
  return new Customer({
    id: 'cliente-1',
    email: 'camila.rodriguez@example.com',
    fullName: 'Camila Rodríguez',
    phone: null,
    createdAt: new Date(),
  });
}

function construirCargoAprobado(overrides: Partial<GatewayChargeResult> = {}): GatewayChargeResult {
  return {
    gatewayTransactionId: 'wompi-tx-1',
    status: 'APPROVED',
    paymentMethodType: 'CARD',
    cardBrand: 'VISA',
    lastFour: '4242',
    rawResponse: { id: 'wompi-tx-1' },
    ...overrides,
  };
}

function construirPago(status: Payment['status'] = 'APPROVED'): Payment {
  return new Payment({
    id: 'pago-1',
    transactionId: 'transaccion-1',
    wompiTransactionId: 'wompi-tx-1',
    status,
    paymentMethodType: 'CARD',
    cardBrand: 'VISA',
    lastFour: '4242',
    rawResponse: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ProcessPaymentUseCase', () => {
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let pollingPolicy: PaymentPollingPolicy;
  let useCase: ProcessPaymentUseCase;

  const entrada = { transactionId: 'transaccion-1', cardToken: 'tok_test_123', installments: 1 };

  beforeEach(() => {
    transactionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
    };
    customerRepository = { findById: jest.fn(), findByEmail: jest.fn(), create: jest.fn() };
    productRepository = { findAll: jest.fn(), findById: jest.fn(), decreaseStock: jest.fn() };
    paymentRepository = { create: jest.fn(), findByTransactionId: jest.fn() };
    paymentGateway = { chargeCard: jest.fn(), getChargeStatus: jest.fn() };
    pollingPolicy = { intervalMs: 0, maxAttempts: 3 };

    useCase = new ProcessPaymentUseCase(
      transactionRepository,
      customerRepository,
      productRepository,
      paymentRepository,
      paymentGateway,
      pollingPolicy,
    );
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(entrada)).rejects.toThrow(TransactionNotFoundError);
  });

  it('throws TransactionAlreadyProcessedError when the transaction is not PENDING', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion({ status: 'APPROVED' }));

    await expect(useCase.execute(entrada)).rejects.toThrow(TransactionAlreadyProcessedError);
  });

  it('charges the card, marks the transaction APPROVED and decreases stock', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion());
    customerRepository.findById.mockResolvedValue(construirCliente());
    paymentGateway.chargeCard.mockResolvedValue(construirCargoAprobado());
    paymentRepository.create.mockResolvedValue(construirPago('APPROVED'));
    transactionRepository.updateStatus.mockResolvedValue(
      construirTransaccion({ status: 'APPROVED' }),
    );
    productRepository.decreaseStock.mockResolvedValue({} as never);

    const result = await useCase.execute(entrada);

    expect(paymentGateway.chargeCard).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'camila.rodriguez@example.com',
        cardToken: 'tok_test_123',
      }),
    );
    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      'transaccion-1',
      'APPROVED',
      'wompi-tx-1',
    );
    expect(productRepository.decreaseStock).toHaveBeenCalledWith('producto-1', 2, 'transaccion-1');
    expect(result.transaction.status).toBe('APPROVED');
  });

  it('marks the transaction DECLINED and does not touch stock', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion());
    customerRepository.findById.mockResolvedValue(construirCliente());
    paymentGateway.chargeCard.mockResolvedValue(construirCargoAprobado({ status: 'DECLINED' }));
    paymentRepository.create.mockResolvedValue(construirPago('DECLINED'));
    transactionRepository.updateStatus.mockResolvedValue(
      construirTransaccion({ status: 'DECLINED' }),
    );

    await useCase.execute(entrada);

    expect(productRepository.decreaseStock).not.toHaveBeenCalled();
  });

  it('polls until a PENDING charge resolves to a final status', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion());
    customerRepository.findById.mockResolvedValue(construirCliente());
    paymentGateway.chargeCard.mockResolvedValue(construirCargoAprobado({ status: 'PENDING' }));
    paymentGateway.getChargeStatus
      .mockResolvedValueOnce(construirCargoAprobado({ status: 'PENDING' }))
      .mockResolvedValueOnce(construirCargoAprobado({ status: 'APPROVED' }));
    paymentRepository.create.mockResolvedValue(construirPago('APPROVED'));
    transactionRepository.updateStatus.mockResolvedValue(
      construirTransaccion({ status: 'APPROVED' }),
    );
    productRepository.decreaseStock.mockResolvedValue({} as never);

    const result = await useCase.execute(entrada);

    expect(paymentGateway.getChargeStatus).toHaveBeenCalledTimes(2);
    expect(result.transaction.status).toBe('APPROVED');
  });

  it('records ERROR when polling exhausts all attempts still PENDING', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion());
    customerRepository.findById.mockResolvedValue(construirCliente());
    paymentGateway.chargeCard.mockResolvedValue(construirCargoAprobado({ status: 'PENDING' }));
    paymentGateway.getChargeStatus.mockResolvedValue(construirCargoAprobado({ status: 'PENDING' }));
    paymentRepository.create.mockResolvedValue(construirPago('ERROR'));
    transactionRepository.updateStatus.mockResolvedValue(construirTransaccion({ status: 'ERROR' }));

    await useCase.execute(entrada);

    expect(paymentGateway.getChargeStatus).toHaveBeenCalledTimes(pollingPolicy.maxAttempts);
    expect(paymentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ERROR' }),
    );
  });

  it('wraps a gateway failure in PaymentGatewayError', async () => {
    transactionRepository.findById.mockResolvedValue(construirTransaccion());
    customerRepository.findById.mockResolvedValue(construirCliente());
    paymentGateway.chargeCard.mockRejectedValue(new Error('network down'));

    await expect(useCase.execute(entrada)).rejects.toBeInstanceOf(PaymentGatewayError);
  });
});
