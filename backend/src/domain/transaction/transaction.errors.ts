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

export class TransactionAlreadyProcessedError extends Error {
  constructor(identifier: string, currentStatus: string) {
    super(`Transaction "${identifier}" was already processed (status: ${currentStatus})`);
    this.name = 'TransactionAlreadyProcessedError';
  }
}

export class PaymentGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}
