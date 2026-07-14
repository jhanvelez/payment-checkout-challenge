export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product with id "${productId}" was not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Product "${productId}" has insufficient stock: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientStockError';
  }
}
