import { createHash } from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import type { CardBrand } from '../../domain/payment/payment.entity';
import type {
  ChargeCardRequest,
  GatewayChargeResult,
  GatewayChargeStatus,
  PaymentGatewayPort,
} from '../../domain/payment/payment-gateway.port';
import { PaymentGatewayError } from '../../domain/transaction/transaction.errors';
import type {
  WompiAcceptanceTokens,
  WompiErrorResponse,
  WompiMerchantResponse,
  WompiTransactionData,
  WompiTransactionResponse,
} from './wompi.types';

const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class WompiService implements PaymentGatewayPort {
  private readonly logger = new Logger(WompiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async chargeCard(request: ChargeCardRequest): Promise<GatewayChargeResult> {
    const acceptanceTokens = await this.getAcceptanceTokens();
    const signature = this.computeIntegritySignature(
      request.reference,
      request.amountInCents,
      request.currency,
    );

    const response = await this.post<WompiTransactionResponse>('/transactions', {
      acceptance_token: acceptanceTokens.acceptanceToken,
      accept_personal_auth: acceptanceTokens.personalAuthToken,
      amount_in_cents: request.amountInCents,
      currency: request.currency,
      customer_email: request.customerEmail,
      reference: request.reference,
      signature,
      payment_method: {
        type: 'CARD',
        token: request.cardToken,
        installments: request.installments,
      },
    });

    return this.toGatewayResult(response.data);
  }

  async getChargeStatus(gatewayTransactionId: string): Promise<GatewayChargeResult> {
    const response = await this.get<WompiTransactionResponse>(
      `/transactions/${gatewayTransactionId}`,
    );
    return this.toGatewayResult(response.data);
  }

  private async getAcceptanceTokens(): Promise<WompiAcceptanceTokens> {
    const publicKey = this.configService.getOrThrow<string>('wompi.publicKey');
    const response = await this.get<WompiMerchantResponse>(`/merchants/${publicKey}`, {
      Authorization: `Bearer ${publicKey}`,
    });
    return {
      acceptanceToken: response.data.presigned_acceptance.acceptance_token,
      personalAuthToken: response.data.presigned_personal_data_auth.acceptance_token,
    };
  }

  private computeIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const integritySecret = this.configService.getOrThrow<string>('wompi.integrityKey');
    const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  private toGatewayResult(data: WompiTransactionData): GatewayChargeResult {
    return {
      gatewayTransactionId: data.id,
      status: this.mapStatus(data.status),
      paymentMethodType: data.payment_method_type ?? data.payment_method?.type ?? null,
      cardBrand: this.mapCardBrand(data.payment_method?.extra?.brand),
      lastFour: data.payment_method?.extra?.last_four ?? null,
      rawResponse: data,
    };
  }

  private mapStatus(status: WompiTransactionData['status']): GatewayChargeStatus {
    switch (status) {
      case 'APPROVED':
        return 'APPROVED';
      case 'DECLINED':
        return 'DECLINED';
      case 'PENDING':
        return 'PENDING';
      case 'ERROR':
      case 'VOIDED':
      default:
        return 'ERROR';
    }
  }

  private mapCardBrand(brand: string | undefined): CardBrand {
    if (brand === 'VISA' || brand === 'MASTERCARD') {
      return brand;
    }
    return 'UNKNOWN';
  }

  private baseUrl(): string {
    return this.configService.getOrThrow<string>('wompi.sandboxUrl');
  }

  private async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, headers);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const privateKey = this.configService.getOrThrow<string>('wompi.privateKey');
    return this.request<T>('POST', path, body, { Authorization: `Bearer ${privateKey}` });
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.baseUrl()}${path}`;
    try {
      const response$ =
        method === 'GET'
          ? this.httpService.get<T>(url, { headers, timeout: REQUEST_TIMEOUT_MS })
          : this.httpService.post<T>(url, body, { headers, timeout: REQUEST_TIMEOUT_MS });
      const response = await firstValueFrom(response$);
      return response.data;
    } catch (error) {
      throw this.toPaymentGatewayError(method, path, error);
    }
  }

  private toPaymentGatewayError(method: string, path: string, error: unknown): PaymentGatewayError {
    const axiosError = error as AxiosError<WompiErrorResponse>;
    const wompiMessage = axiosError.response?.data?.error?.messages;
    const detail = wompiMessage ? JSON.stringify(wompiMessage) : axiosError.message;
    this.logger.error(`Wompi ${method} ${path} failed: ${detail}`);
    return new PaymentGatewayError(`Wompi request failed (${method} ${path}): ${detail}`);
  }
}
