import axios from 'axios';
import { WOMPI_PUBLIC_KEY, WOMPI_SANDBOX_URL } from './env';

export interface TokenizeCardInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface TokenizedCard {
  id: string;
  brand: string;
  lastFour: string;
}

/**
 * Tokenizes the card directly against Wompi from the device, using the
 * public key. Raw card data (number/cvc) never reaches our backend - only
 * the resulting token does. This keeps the backend out of PCI card-data
 * scope entirely.
 */
export async function tokenizeCard(input: TokenizeCardInput): Promise<TokenizedCard> {
  const response = await axios.post<{
    data: { id: string; brand: string; last_four: string };
  }>(
    `${WOMPI_SANDBOX_URL}/tokens/cards`,
    {
      number: input.number,
      cvc: input.cvc,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      card_holder: input.cardHolder,
    },
    { headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` }, timeout: 15000 },
  );

  return {
    id: response.data.data.id,
    brand: response.data.data.brand,
    lastFour: response.data.data.last_four,
  };
}
