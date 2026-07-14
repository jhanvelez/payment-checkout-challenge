import type { TokenizeCardInput } from '../services/wompiClient';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ProductDetail: { productId: string };
  Checkout: undefined;
  Processing: { transactionId: string; card: TokenizeCardInput };
  Result: undefined;
};
