import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { tokenizeCard, type TokenizeCardInput } from '../../services/wompiClient';
import { submitPayment, type SubmitPaymentPayload } from '../../services/transactionsApi';
import { extractApiErrorMessage } from '../../services/apiClient';
import type { PaymentResultDto } from '../../types/api';

export interface PaymentState {
  cardToken: string | null;
  cardBrand: string | null;
  lastFour: string | null;
  tokenizeStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
  error: string | null;
  result: PaymentResultDto | null;
}

const initialState: PaymentState = {
  cardToken: null,
  cardBrand: null,
  lastFour: null,
  tokenizeStatus: 'idle',
  paymentStatus: 'idle',
  error: null,
  result: null,
};

export const tokenizeCardThunk = createAsyncThunk<
  { id: string; brand: string; lastFour: string },
  TokenizeCardInput,
  { rejectValue: string }
>('payment/tokenizeCard', async (input, { rejectWithValue }) => {
  try {
    return await tokenizeCard(input);
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error));
  }
});

export const submitPaymentThunk = createAsyncThunk<
  PaymentResultDto,
  SubmitPaymentPayload,
  { rejectValue: string }
>('payment/submit', async (payload, { rejectWithValue }) => {
  try {
    return await submitPayment(payload);
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error));
  }
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    resetPayment: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(tokenizeCardThunk.pending, (state) => {
        state.tokenizeStatus = 'loading';
        state.error = null;
      })
      .addCase(tokenizeCardThunk.fulfilled, (state, action) => {
        state.tokenizeStatus = 'succeeded';
        state.cardToken = action.payload.id;
        state.cardBrand = action.payload.brand;
        state.lastFour = action.payload.lastFour;
      })
      .addCase(tokenizeCardThunk.rejected, (state, action) => {
        state.tokenizeStatus = 'failed';
        state.error = action.payload ?? 'No pudimos validar la tarjeta';
      })
      .addCase(submitPaymentThunk.pending, (state) => {
        state.paymentStatus = 'processing';
        state.error = null;
      })
      .addCase(submitPaymentThunk.fulfilled, (state, action) => {
        state.paymentStatus = 'succeeded';
        state.result = action.payload;
      })
      .addCase(submitPaymentThunk.rejected, (state, action) => {
        state.paymentStatus = 'failed';
        state.error = action.payload ?? 'No pudimos procesar el pago';
      });
  },
});

export const { resetPayment } = paymentSlice.actions;
export const paymentReducer = paymentSlice.reducer;
