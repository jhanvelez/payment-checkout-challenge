import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchProducts } from '../../services/productsApi';
import { extractApiErrorMessage } from '../../services/apiClient';
import type { ProductDto } from '../../types/api';

export interface ProductsState {
  items: ProductDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const loadProducts = createAsyncThunk<ProductDto[], void, { rejectValue: string }>(
  'products/load',
  async (_arg, { rejectWithValue }) => {
    try {
      return await fetchProducts();
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error));
    }
  },
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action: PayloadAction<ProductDto[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'No pudimos cargar los productos';
      });
  },
});

export const productsReducer = productsSlice.reducer;
