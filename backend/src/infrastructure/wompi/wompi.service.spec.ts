import { createHash } from 'node:crypto';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { PaymentGatewayError } from '../../domain/transaction/transaction.errors';
import { WompiService } from './wompi.service';

const CONFIG: Record<string, string> = {
  'wompi.sandboxUrl': 'https://api-sandbox.example.wompi.dev/v1',
  'wompi.publicKey': 'pub_test_key',
  'wompi.privateKey': 'prv_test_key',
  'wompi.integrityKey': 'integrity_secret',
};

function axiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as never };
}

function construirMerchantResponse() {
  return axiosResponse({
    data: {
      presigned_acceptance: { acceptance_token: 'acceptance-token-123' },
      presigned_personal_data_auth: { acceptance_token: 'personal-auth-token-456' },
    },
  });
}

function construirTransactionResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return axiosResponse({
    data: {
      id: 'wompi-tx-1',
      status: 'APPROVED',
      status_message: null,
      payment_method_type: 'CARD',
      payment_method: { type: 'CARD', extra: { brand: 'VISA', last_four: '4242' } },
      ...overrides,
    },
  });
}

describe('WompiService', () => {
  let httpService: { get: jest.Mock; post: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let service: WompiService;

  beforeEach(() => {
    httpService = { get: jest.fn(), post: jest.fn() };
    configService = {
      getOrThrow: jest.fn((key: string) => CONFIG[key]),
    };
    service = new WompiService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  describe('chargeCard', () => {
    it('fetches acceptance tokens, signs the payload and maps an APPROVED response', async () => {
      httpService.get.mockReturnValueOnce(of(construirMerchantResponse()));
      httpService.post.mockReturnValueOnce(of(construirTransactionResponse()));

      const result = await service.chargeCard({
        reference: 'TX-REF-1',
        amountInCents: 5000000,
        currency: 'COP',
        customerEmail: 'cliente@example.com',
        cardToken: 'tok_test_123',
        installments: 1,
      });

      expect(result).toMatchObject({
        gatewayTransactionId: 'wompi-tx-1',
        status: 'APPROVED',
        cardBrand: 'VISA',
        lastFour: '4242',
      });

      const [, body] = httpService.post.mock.calls[0] as [string, Record<string, unknown>];
      expect(body.acceptance_token).toBe('acceptance-token-123');
      expect(body.accept_personal_auth).toBe('personal-auth-token-456');

      const expectedSignature = createHash('sha256')
        .update('TX-REF-15000000COPintegrity_secret')
        .digest('hex');
      expect(body.signature).toBe(expectedSignature);
    });

    it('maps unknown card brands to UNKNOWN', async () => {
      httpService.get.mockReturnValueOnce(of(construirMerchantResponse()));
      httpService.post.mockReturnValueOnce(
        of(
          construirTransactionResponse({
            payment_method: { type: 'CARD', extra: { brand: 'AMEX' } },
          }),
        ),
      );

      const result = await service.chargeCard({
        reference: 'TX-REF-2',
        amountInCents: 1000000,
        currency: 'COP',
        customerEmail: 'cliente@example.com',
        cardToken: 'tok_test_456',
        installments: 1,
      });

      expect(result.cardBrand).toBe('UNKNOWN');
    });

    it('maps DECLINED and ERROR statuses through', async () => {
      httpService.get.mockReturnValueOnce(of(construirMerchantResponse()));
      httpService.post.mockReturnValueOnce(
        of(construirTransactionResponse({ status: 'DECLINED' })),
      );

      const result = await service.chargeCard({
        reference: 'TX-REF-3',
        amountInCents: 1000000,
        currency: 'COP',
        customerEmail: 'cliente@example.com',
        cardToken: 'tok_test_789',
        installments: 1,
      });

      expect(result.status).toBe('DECLINED');
    });

    it('wraps a failed HTTP call in a PaymentGatewayError', async () => {
      httpService.get.mockReturnValueOnce(of(construirMerchantResponse()));
      httpService.post.mockReturnValueOnce(
        throwError(() => ({
          message: 'Request failed with status code 422',
          response: {
            data: {
              error: { type: 'INPUT_VALIDATION_ERROR', messages: { signature: ['inválida'] } },
            },
          },
        })),
      );

      await expect(
        service.chargeCard({
          reference: 'TX-REF-4',
          amountInCents: 1000000,
          currency: 'COP',
          customerEmail: 'cliente@example.com',
          cardToken: 'tok_test_bad',
          installments: 1,
        }),
      ).rejects.toBeInstanceOf(PaymentGatewayError);
    });
  });

  describe('getChargeStatus', () => {
    it('polls the transaction endpoint and maps the result', async () => {
      httpService.get.mockReturnValueOnce(of(construirTransactionResponse({ status: 'PENDING' })));

      const result = await service.getChargeStatus('wompi-tx-1');

      expect(result.status).toBe('PENDING');
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/wompi-tx-1'),
        expect.anything(),
      );
    });
  });
});
