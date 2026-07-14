export class EmptyCartError extends Error {
  constructor() {
    super('Cannot create a transaction with no items');
    this.name = 'EmptyCartError';
  }
}

export class TransactionNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Transaction "${identifier}" was not found`);
    this.name = 'TransactionNotFoundError';
  }
}
