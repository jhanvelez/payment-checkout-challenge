import { configureStore } from '@reduxjs/toolkit';
import {
  addItem,
  cartReducer,
  clearCart,
  removeItem,
  selectCartItemCount,
  selectCartTotalInCents,
  updateQuantity,
} from './cartSlice';
import type { ProductDto } from '../../types/api';

function buildProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'producto-1',
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos',
    description: 'Producto de prueba',
    priceInCents: 18790000,
    currency: 'COP',
    stock: 5,
    imageUrl: null,
    ...overrides,
  };
}

function buildStore() {
  return configureStore({ reducer: { cart: cartReducer } });
}

describe('cartSlice', () => {
  it('starts empty', () => {
    const store = buildStore();
    expect(store.getState().cart.items).toEqual([]);
  });

  it('adds a new product to the cart', () => {
    const store = buildStore();

    store.dispatch(addItem({ product: buildProduct(), quantity: 2 }));

    expect(store.getState().cart.items).toEqual([
      expect.objectContaining({ productId: 'producto-1', quantity: 2 }),
    ]);
  });

  it('increments quantity when adding an already-present product', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct(), quantity: 1 }));

    store.dispatch(addItem({ product: buildProduct(), quantity: 2 }));

    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.items[0].quantity).toBe(3);
  });

  it('caps quantity at the available stock', () => {
    const store = buildStore();

    store.dispatch(addItem({ product: buildProduct({ stock: 3 }), quantity: 10 }));

    expect(store.getState().cart.items[0].quantity).toBe(3);
  });

  it('updateQuantity removes the item when set to zero', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct(), quantity: 1 }));

    store.dispatch(updateQuantity({ productId: 'producto-1', quantity: 0 }));

    expect(store.getState().cart.items).toEqual([]);
  });

  it('removeItem drops the matching product', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct(), quantity: 1 }));

    store.dispatch(removeItem({ productId: 'producto-1' }));

    expect(store.getState().cart.items).toEqual([]);
  });

  it('clearCart empties every item', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct(), quantity: 1 }));
    store.dispatch(addItem({ product: buildProduct({ id: 'producto-2' }), quantity: 1 }));

    store.dispatch(clearCart());

    expect(store.getState().cart.items).toEqual([]);
  });

  it('selectCartTotalInCents sums unit price times quantity across items', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct({ priceInCents: 1000 }), quantity: 2 }));
    store.dispatch(addItem({ product: buildProduct({ id: 'producto-2', priceInCents: 500 }), quantity: 3 }));

    expect(selectCartTotalInCents(store.getState())).toBe(2 * 1000 + 3 * 500);
  });

  it('selectCartItemCount sums quantities across items', () => {
    const store = buildStore();
    store.dispatch(addItem({ product: buildProduct(), quantity: 2 }));
    store.dispatch(addItem({ product: buildProduct({ id: 'producto-2' }), quantity: 3 }));

    expect(selectCartItemCount(store.getState())).toBe(5);
  });
});
