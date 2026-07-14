import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../../domain/customer/customer.repository';
import {
  PAYMENT_GATEWAY,
  type GatewayChargeResult,
  type PaymentGatewayPort,
} from '../../../domain/payment/payment-gateway.port';
import type { Payment } from '../../../domain/payment/payment.entity';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../../../domain/payment/payment.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../domain/product/product.repository';
import type {
  Transaction,
  TransactionStatus,
} from '../../../domain/transaction/transaction.entity';
import {
  PaymentGatewayError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/transaction/transaction.errors';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../../domain/transaction/transaction.repository';
import { sleep } from '../../../shared/utils/sleep';
import type { ProcessPaymentInput } from '../dto/process-payment.input';
import { PAYMENT_POLLING_POLICY, type PaymentPollingPolicy } from '../payment-polling-policy';

export interface ProcessPaymentResult {
  transaction: Transaction;
  payment: Payment;
}

@Injectable()
export class ProcessPaymentUseCase {
  private readonly logger = new Logger(ProcessPaymentUseCase.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: PaymentRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
    @Inject(PAYMENT_POLLING_POLICY) private readonly pollingPolicy: PaymentPollingPolicy,
  ) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
    const transaction = await this.transactionRepository.findById(input.transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(input.transactionId);
    }
    if (!transaction.isPending()) {
      throw new TransactionAlreadyProcessedError(transaction.id, transaction.status);
    }

    const customer = await this.customerRepository.findById(transaction.customerId);
    if (!customer) {
      // Data-integrity invariant: customerId is a foreign key, so this should
      // be unreachable outside of manual DB tampering.
      throw new Error(
        `Customer "${transaction.customerId}" referenced by transaction "${transaction.id}" was not found`,
      );
    }

    const chargeResult = await this.chargeAndResolve(transaction, customer.email, input);
    const finalStatus: TransactionStatus =
      chargeResult.status === 'PENDING' ? 'ERROR' : chargeResult.status;

    const payment = await this.paymentRepository.create({
      transactionId: transaction.id,
      wompiTransactionId: chargeResult.gatewayTransactionId,
      status: finalStatus,
      paymentMethodType: chargeResult.paymentMethodType,
      cardBrand: chargeResult.cardBrand,
      lastFour: chargeResult.lastFour,
      rawResponse: chargeResult.rawResponse,
    });

    const updatedTransaction = await this.transactionRepository.updateStatus(
      transaction.id,
      finalStatus,
      chargeResult.gatewayTransactionId,
    );

    if (finalStatus === 'APPROVED') {
      await this.assignProductsAndDecreaseStock(updatedTransaction);
    }

    return { transaction: updatedTransaction, payment };
  }

  private async chargeAndResolve(
    transaction: Transaction,
    customerEmail: string,
    input: ProcessPaymentInput,
  ): Promise<GatewayChargeResult> {
    try {
      const initial = await this.paymentGateway.chargeCard({
        reference: transaction.reference,
        amountInCents: transaction.amountInCents,
        currency: transaction.currency,
        customerEmail,
        cardToken: input.cardToken,
        installments: input.installments,
      });
      return await this.waitForFinalStatus(initial);
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown payment gateway error',
      );
    }
  }

  private async waitForFinalStatus(initial: GatewayChargeResult): Promise<GatewayChargeResult> {
    let current = initial;
    let attempts = 0;

    while (current.status === 'PENDING' && attempts < this.pollingPolicy.maxAttempts) {
      await sleep(this.pollingPolicy.intervalMs);
      current = await this.paymentGateway.getChargeStatus(current.gatewayTransactionId);
      attempts += 1;
    }

    return current;
  }

  /**
   * Decrements stock and records the InventoryMovement audit trail that
   * doubles as the "product assigned to the customer" record required by
   * the payment flow. The payment was already captured by the gateway at
   * this point, so a stock failure here (e.g. an oversold edge case) is
   * logged for manual reconciliation rather than failing the response.
   */
  private async assignProductsAndDecreaseStock(transaction: Transaction): Promise<void> {
    for (const item of transaction.items) {
      try {
        await this.productRepository.decreaseStock(item.productId, item.quantity, transaction.id);
      } catch (error) {
        this.logger.error(
          `Stock decrement failed for product ${item.productId} on approved transaction ${transaction.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}
