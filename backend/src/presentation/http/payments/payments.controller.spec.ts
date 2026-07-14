import { BadGatewayException, ConflictException, NotFoundException } from '@nestjs/common';
import type { ProcessPaymentUseCase } from '../../../application/checkout/use-cases/process-payment.use-case';
import { Payment } from '../../../domain/payment/payment.entity';
import { Transaction } from '../../../domain/transaction/transaction.entity';
import {
  PaymentGatewayError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/transaction/transaction.errors';
import type { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentsController } from './payments.controller';

function construirResultado() {
  const transaction = new Transaction({
    id: 'transaccion-1',
    reference: 'TX-EXAMPLE-001',
    status: 'APPROVED',
    amountInCents: 5000000,
    currency: 'COP',
    customerId: 'cliente-1',
    wompiTransactionId: 'wompi-tx-1',
    items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 2500000 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const payment = new Payment({
    id: 'pago-1',
    transactionId: 'transaccion-1',
    wompiTransactionId: 'wompi-tx-1',
    status: 'APPROVED',
    paymentMethodType: 'CARD',
    cardBrand: 'VISA',
    lastFour: '4242',
    rawResponse: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { transaction, payment };
}

const dtoValido: ProcessPaymentDto = { cardToken: 'tok_test_1234567890', installments: 1 };

describe('PaymentsController', () => {
  let processPaymentUseCase: jest.Mocked<ProcessPaymentUseCase>;
  let controller: PaymentsController;

  beforeEach(() => {
    processPaymentUseCase = { execute: jest.fn() } as unknown as jest.Mocked<ProcessPaymentUseCase>;
    controller = new PaymentsController(processPaymentUseCase);
  });

  it('returns the payment result response DTO', async () => {
    processPaymentUseCase.execute.mockResolvedValue(construirResultado());

    const result = await controller.create('transaccion-1', dtoValido);

    expect(result).toMatchObject({ status: 'APPROVED', cardBrand: 'VISA', lastFour: '4242' });
  });

  it('translates TransactionNotFoundError into a NotFoundException', async () => {
    processPaymentUseCase.execute.mockRejectedValue(new TransactionNotFoundError('id-inexistente'));

    await expect(controller.create('id-inexistente', dtoValido)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('translates TransactionAlreadyProcessedError into a ConflictException', async () => {
    processPaymentUseCase.execute.mockRejectedValue(
      new TransactionAlreadyProcessedError('transaccion-1', 'APPROVED'),
    );

    await expect(controller.create('transaccion-1', dtoValido)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('translates PaymentGatewayError into a BadGatewayException', async () => {
    processPaymentUseCase.execute.mockRejectedValue(
      new PaymentGatewayError('Wompi is unreachable'),
    );

    await expect(controller.create('transaccion-1', dtoValido)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
