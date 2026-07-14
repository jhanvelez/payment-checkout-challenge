import type { CardBrand } from './payment.entity';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type GatewayChargeStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface ChargeCardRequest {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  cardToken: string;
  installments: number;
}

export interface GatewayChargeResult {
  gatewayTransactionId: string;
  status: GatewayChargeStatus;
  paymentMethodType: string | null;
  cardBrand: CardBrand | null;
  lastFour: string | null;
  rawResponse: unknown;
}

/**
 * Outbound port for any card-payment gateway. The application layer only
 * knows this contract - it has no idea Wompi exists. Swapping providers
 * means writing a new infrastructure adapter, not touching use-cases.
 */
export interface PaymentGatewayPort {
  chargeCard(request: ChargeCardRequest): Promise<GatewayChargeResult>;
  getChargeStatus(gatewayTransactionId: string): Promise<GatewayChargeResult>;
}
