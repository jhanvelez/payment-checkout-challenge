import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaymentResultDto } from '../../types/api';

export interface StoredTransaction extends PaymentResultDto {
  completedAt: string;
}

export interface TransactionState {
  history: StoredTransaction[];
}

const initialState: TransactionState = {
  history: [],
};

const MAX_HISTORY_ENTRIES = 20;

/**
 * This slice is the one persisted (encrypted, see src/store/secureStorage)
 * to disk - it's the "store the payment transaction data securely"
 * requirement. Everything else (cart, in-flight checkout/payment state) is
 * intentionally ephemeral.
 */
const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    recordTransactionResult: (state, action: PayloadAction<PaymentResultDto>) => {
      state.history.unshift({ ...action.payload, completedAt: new Date().toISOString() });
      state.history = state.history.slice(0, MAX_HISTORY_ENTRIES);
    },
  },
});

export const { recordTransactionResult } = transactionSlice.actions;
export const transactionReducer = transactionSlice.reducer;

export function selectLastTransaction(state: {
  transaction: TransactionState;
}): StoredTransaction | null {
  return state.transaction.history[0] ?? null;
}
