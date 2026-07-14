import { Customer } from '../../../domain/customer/customer.entity';
import type { CustomerRepository } from '../../../domain/customer/customer.repository';
import { Product } from '../../../domain/product/product.entity';
import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../domain/product/product.errors';
import type { ProductRepository } from '../../../domain/product/product.repository';
import { Transaction } from '../../../domain/transaction/transaction.entity';
import { EmptyCartError } from '../../../domain/transaction/transaction.errors';
import type { TransactionRepository } from '../../../domain/transaction/transaction.repository';
import type { CreateTransactionInput } from '../dto/create-transaction.input';
import { CreateTransactionUseCase } from './create-transaction.use-case';

function construirProducto(overrides: Partial<Record<string, unknown>> = {}): Product {
  return new Product({
    id: 'producto-1',
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos con cancelación de ruido',
    description: 'Producto de ejemplo usado en las pruebas automatizadas',
    priceInCents: 18790000,
    currency: 'COP',
    stock: 34,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function construirCliente(overrides: Partial<Record<string, unknown>> = {}): Customer {
  return new Customer({
    id: 'cliente-1',
    email: 'camila.rodriguez@example.com',
    fullName: 'Camila Rodríguez',
    phone: '+57 301 5551234',
    createdAt: new Date(),
    ...overrides,
  });
}

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

const entradaValida: CreateTransactionInput = {
  customer: { email: 'camila.rodriguez@example.com', fullName: 'Camila Rodríguez' },
  items: [{ productId: 'producto-1', quantity: 2 }],
};

describe('CreateTransactionUseCase', () => {
  let customerRepository: jest.Mocked<CustomerRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let useCase: CreateTransactionUseCase;

  beforeEach(() => {
    customerRepository = { findByEmail: jest.fn(), create: jest.fn() };
    productRepository = { findAll: jest.fn(), findById: jest.fn(), decreaseStock: jest.fn() };
    transactionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
    };
    useCase = new CreateTransactionUseCase(
      customerRepository,
      productRepository,
      transactionRepository,
    );
  });

  it('throws EmptyCartError when there are no items', async () => {
    await expect(useCase.execute({ ...entradaValida, items: [] })).rejects.toThrow(EmptyCartError);
  });

  it('throws ProductNotFoundError when a product in the cart does not exist', async () => {
    customerRepository.findByEmail.mockResolvedValue(construirCliente());
    productRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(entradaValida)).rejects.toThrow(ProductNotFoundError);
  });

  it('throws InsufficientStockError when requested quantity exceeds stock', async () => {
    customerRepository.findByEmail.mockResolvedValue(construirCliente());
    productRepository.findById.mockResolvedValue(construirProducto({ stock: 1 }));

    await expect(useCase.execute(entradaValida)).rejects.toThrow(InsufficientStockError);
  });

  it('reuses an existing customer instead of creating a new one', async () => {
    const cliente = construirCliente();
    customerRepository.findByEmail.mockResolvedValue(cliente);
    productRepository.findById.mockResolvedValue(construirProducto());
    transactionRepository.create.mockResolvedValue(construirTransaccion());

    await useCase.execute(entradaValida);

    expect(customerRepository.create).not.toHaveBeenCalled();
  });

  it('creates a new customer when none exists with that email', async () => {
    customerRepository.findByEmail.mockResolvedValue(null);
    customerRepository.create.mockResolvedValue(construirCliente());
    productRepository.findById.mockResolvedValue(construirProducto());
    transactionRepository.create.mockResolvedValue(construirTransaccion());

    await useCase.execute(entradaValida);

    expect(customerRepository.create).toHaveBeenCalledWith({
      email: 'camila.rodriguez@example.com',
      fullName: 'Camila Rodríguez',
      phone: null,
    });
  });

  it('creates the transaction as PENDING with the amount computed from product prices', async () => {
    customerRepository.findByEmail.mockResolvedValue(construirCliente());
    productRepository.findById.mockResolvedValue(construirProducto({ priceInCents: 18790000 }));
    transactionRepository.create.mockResolvedValue(construirTransaccion());

    await useCase.execute(entradaValida);

    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
        amountInCents: 37580000,
        currency: 'COP',
        customerId: 'cliente-1',
        items: [{ productId: 'producto-1', quantity: 2, unitPriceInCents: 18790000 }],
      }),
    );
  });
});
