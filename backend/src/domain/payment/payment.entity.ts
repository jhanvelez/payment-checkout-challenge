export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface PaymentProps {
  id: string;
  transactionId: string;
  wompiTransactionId: string | null;
  status: PaymentStatus;
  paymentMethodType: string | null;
  cardBrand: CardBrand | null;
  lastFour: string | null;
  rawResponse: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  constructor(private readonly props: PaymentProps) {}

  get id(): string {
    return this.props.id;
  }

  get transactionId(): string {
    return this.props.transactionId;
  }

  get wompiTransactionId(): string | null {
    return this.props.wompiTransactionId;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get paymentMethodType(): string | null {
    return this.props.paymentMethodType;
  }

  get cardBrand(): CardBrand | null {
    return this.props.cardBrand;
  }

  get lastFour(): string | null {
    return this.props.lastFour;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
