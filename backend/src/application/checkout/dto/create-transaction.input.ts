export interface CreateTransactionItemInput {
  productId: string;
  quantity: number;
}

export interface CreateTransactionCustomerInput {
  email: string;
  fullName: string;
  phone?: string;
}

export interface CreateTransactionInput {
  customer: CreateTransactionCustomerInput;
  items: CreateTransactionItemInput[];
}
