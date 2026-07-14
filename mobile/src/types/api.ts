export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
}

export interface TransactionItemDto {
  productId: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface TransactionDto {
  id: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amountInCents: number;
  currency: string;
  items: TransactionItemDto[];
  createdAt: string;
}

export interface PaymentResultDto {
  transactionId: string;
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'ERROR';
  amountInCents: number;
  currency: string;
  cardBrand: string | null;
  lastFour: string | null;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
