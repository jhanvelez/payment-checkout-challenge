export interface ProcessPaymentInput {
  transactionId: string;
  cardToken: string;
  installments: number;
}
