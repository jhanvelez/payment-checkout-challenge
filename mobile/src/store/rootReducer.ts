import { combineReducers } from '@reduxjs/toolkit';
import { cartReducer } from '../features/cart/cartSlice';
import { checkoutReducer } from '../features/checkout/checkoutSlice';
import { paymentReducer } from '../features/payment/paymentSlice';
import { productsReducer } from '../features/products/productsSlice';
import { transactionReducer } from '../features/transaction/transactionSlice';
import { uiReducer } from '../features/ui/uiSlice';

export const rootReducer = combineReducers({
  products: productsReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  payment: paymentReducer,
  transaction: transactionReducer,
  ui: uiReducer,
});
