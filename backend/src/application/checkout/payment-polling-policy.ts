export const PAYMENT_POLLING_POLICY = Symbol('PAYMENT_POLLING_POLICY');

export interface PaymentPollingPolicy {
  intervalMs: number;
  maxAttempts: number;
}
