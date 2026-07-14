import type { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  /**
   * Atomically decrements stock and records the movement against the
   * transaction that consumed it (the audit trail doubles as the
   * "product assigned to the customer" record required by the payment flow).
   */
  decreaseStock(productId: string, quantity: number, transactionId: string): Promise<Product>;
}
