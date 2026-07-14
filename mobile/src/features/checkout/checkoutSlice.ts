import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createTransaction, type CreateTransactionPayload } from '../../services/transactionsApi';
import { extractApiErrorMessage } from '../../services/apiClient';
import type { TransactionDto } from '../../types/api';

export interface CustomerInfo {
  email: string;
  fullName: string;
  phone?: string;
}

export interface CheckoutState {
  customer: CustomerInfo | null;
  transaction: TransactionDto | null;
  status: 'idle' | 'creating' | 'created' | 'failed';
  error: string | null;
}

const initialState: CheckoutState = {
  customer: null,
  transaction: null,
  status: 'idle',
  error: null,
};

export const startCheckout = createAsyncThunk<
  TransactionDto,
  CreateTransactionPayload,
  { rejectValue: string }
>('checkout/start', async (payload, { rejectWithValue }) => {
  try {
    return await createTransaction(payload);
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error));
  }
});

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    resetCheckout: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(startCheckout.pending, (state, action) => {
        state.status = 'creating';
        state.error = null;
        state.customer = action.meta.arg.customer;
      })
      .addCase(startCheckout.fulfilled, (state, action) => {
        state.status = 'created';
        state.transaction = action.payload;
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'No pudimos iniciar la transacción';
      });
  },
});

export const { resetCheckout } = checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;
