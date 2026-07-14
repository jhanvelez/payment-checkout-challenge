import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProductDto } from '../../types/api';

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPriceInCents: number;
  currency: string;
  quantity: number;
  availableStock: number;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{ product: ProductDto; quantity: number }>,
    ) => {
      const { product, quantity } = action.payload;
      const existing = state.items.find((item) => item.productId === product.id);
      const maxQuantity = product.stock;

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, maxQuantity);
        return;
      }

      state.items.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        unitPriceInCents: product.priceInCents,
        currency: product.currency,
        quantity: Math.min(quantity, maxQuantity),
        availableStock: product.stock,
      });
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const item = state.items.find((entry) => entry.productId === action.payload.productId);
      if (!item) {
        return;
      }
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter((entry) => entry.productId !== item.productId);
        return;
      }
      item.quantity = Math.min(action.payload.quantity, item.availableStock);
    },
    removeItem: (state, action: PayloadAction<{ productId: string }>) => {
      state.items = state.items.filter((entry) => entry.productId !== action.payload.productId);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export function selectCartTotalInCents(state: { cart: CartState }): number {
  return state.cart.items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0);
}

export function selectCartItemCount(state: { cart: CartState }): number {
  return state.cart.items.reduce((count, item) => count + item.quantity, 0);
}
