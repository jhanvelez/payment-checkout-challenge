export interface WompiAcceptanceTokens {
  acceptanceToken: string;
  personalAuthToken: string;
}

export interface WompiMerchantResponse {
  data: {
    presigned_acceptance: { acceptance_token: string };
    presigned_personal_data_auth: { acceptance_token: string };
  };
}

export interface WompiTransactionData {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  status_message: string | null;
  payment_method_type: string | null;
  payment_method?: {
    type?: string;
    extra?: {
      brand?: string;
      last_four?: string;
    };
  };
}

export interface WompiTransactionResponse {
  data: WompiTransactionData;
}

export interface WompiErrorResponse {
  error: {
    type: string;
    messages: Record<string, string[]> | string;
  };
}
