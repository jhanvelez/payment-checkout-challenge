import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../../domain/customer/customer.repository';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../domain/product/product.repository';
import type { TransactionItemProps } from '../../../domain/transaction/transaction-item';
import { generateTransactionReference } from '../../../domain/transaction/transaction-reference';
import { EmptyCartError } from '../../../domain/transaction/transaction.errors';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../../domain/transaction/transaction.repository';
import type { Transaction } from '../../../domain/transaction/transaction.entity';
import { InsufficientStockError } from '../../../domain/product/product.errors';
import type { CreateTransactionInput } from '../dto/create-transaction.input';

const DEFAULT_CURRENCY = 'COP';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    if (input.items.length === 0) {
      throw new EmptyCartError();
    }

    const customer = await this.resolveCustomer(input.customer);
    const items = await this.resolveItems(input.items);
    const amountInCents = items.reduce(
      (total, item) => total + item.unitPriceInCents * item.quantity,
      0,
    );

    return this.transactionRepository.create({
      reference: generateTransactionReference(),
      status: 'PENDING',
      amountInCents,
      currency: DEFAULT_CURRENCY,
      customerId: customer.id,
      items,
    });
  }

  private async resolveCustomer(
    customerInput: CreateTransactionInput['customer'],
  ): Promise<{ id: string }> {
    const existing = await this.customerRepository.findByEmail(customerInput.email);
    if (existing) {
      return existing;
    }
    return this.customerRepository.create({
      email: customerInput.email,
      fullName: customerInput.fullName,
      phone: customerInput.phone ?? null,
    });
  }

  private async resolveItems(
    itemsInput: CreateTransactionInput['items'],
  ): Promise<TransactionItemProps[]> {
    const items: TransactionItemProps[] = [];

    for (const itemInput of itemsInput) {
      const product = await this.productRepository.findById(itemInput.productId);
      if (!product) {
        throw new ProductNotFoundError(itemInput.productId);
      }
      if (!product.hasStockFor(itemInput.quantity)) {
        throw new InsufficientStockError(product.id, itemInput.quantity, product.stock);
      }
      items.push({
        productId: product.id,
        quantity: itemInput.quantity,
        unitPriceInCents: product.priceInCents,
      });
    }

    return items;
  }
}
