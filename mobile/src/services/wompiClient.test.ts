import axios from 'axios';
import { tokenizeCard } from './wompiClient';
import { WOMPI_PUBLIC_KEY, WOMPI_SANDBOX_URL } from './env';

jest.mock('axios');
const mockedPost = axios.post as jest.MockedFunction<typeof axios.post>;

describe('tokenizeCard', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('tokenizes the card directly against Wompi using the public key, never touching our backend', async () => {
    mockedPost.mockResolvedValue({
      data: { data: { id: 'tok_stagtest_123', brand: 'VISA', last_four: '4242' } },
    });

    const result = await tokenizeCard({
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '30',
      cardHolder: 'MARIA PEREZ',
    });

    expect(mockedPost).toHaveBeenCalledWith(
      `${WOMPI_SANDBOX_URL}/tokens/cards`,
      {
        number: '4242424242424242',
        cvc: '123',
        exp_month: '12',
        exp_year: '30',
        card_holder: 'MARIA PEREZ',
      },
      { headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` }, timeout: 15000 },
    );
    expect(result).toEqual({ id: 'tok_stagtest_123', brand: 'VISA', lastFour: '4242' });
  });

  it('propagates rejection when Wompi declines the tokenization request', async () => {
    mockedPost.mockRejectedValue(new Error('tarjeta inválida'));

    await expect(
      tokenizeCard({ number: '123', cvc: '123', expMonth: '12', expYear: '30', cardHolder: 'X' }),
    ).rejects.toThrow('tarjeta inválida');
  });
});
