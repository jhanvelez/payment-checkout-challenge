import { BadRequestException } from '@nestjs/common';
import type { CreateTransactionUseCase } from '../../../application/checkout/use-cases/create-transaction.use-case';
import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../domain/product/product.errors';
import { Transaction } from '../../../domain/transaction/transaction.entity';
import { EmptyCartError } from '../../../domain/transaction/transaction.errors';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsController } from './transactions.controller';

function construirTransaccion(): Transaction {
  return new Transaction({
    id: 'transaccion-1',
    reference: 'TX-EXAMPLE-001',
    status: 'PENDING',
    amountInCents: 37580000,
    currency: 'COP',
    customerId: 'cliente-1',
    wompiTransactionId: null,
    items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 18790000 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const dtoValido: CreateTransactionDto = {
  customer: { email: 'camila.rodriguez@example.com', fullName: 'Camila Rodríguez' },
  items: [{ productId: 'producto-1', quantity: 2 }],
};

describe('TransactionsController', () => {
  let createTransactionUseCase: jest.Mocked<CreateTransactionUseCase>;
  let controller: TransactionsController;

  beforeEach(() => {
    createTransactionUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateTransactionUseCase>;
    controller = new TransactionsController(createTransactionUseCase);
  });

  it('returns the created transaction as a response DTO', async () => {
    createTransactionUseCase.execute.mockResolvedValue(construirTransaccion());

    const result = await controller.create(dtoValido);

    expect(result).toMatchObject({ reference: 'TX-EXAMPLE-001', status: 'PENDING' });
  });

  it.each([
    new EmptyCartError(),
    new ProductNotFoundError('producto-1'),
    new InsufficientStockError('producto-1', 5, 1),
  ])('translates %p into a BadRequestException', async (error) => {
    createTransactionUseCase.execute.mockRejectedValue(error);

    await expect(controller.create(dtoValido)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rethrows unexpected errors', async () => {
    createTransactionUseCase.execute.mockRejectedValue(new Error('fallo inesperado'));

    await expect(controller.create(dtoValido)).rejects.toThrow('fallo inesperado');
  });
});
