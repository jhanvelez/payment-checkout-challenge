import { checkoutFormSchema } from './checkoutSchema';

function futureExpiry(): { expMonth: string; expYear: string } {
  const now = new Date();
  const nextYear = (now.getFullYear() + 1) % 100;
  return { expMonth: '12', expYear: String(nextYear).padStart(2, '0') };
}

function buildValues(overrides: Record<string, string | undefined> = {}) {
  return {
    fullName: 'María Pérez',
    email: 'maria.perez@example.com',
    phone: '3001234567',
    cardNumber: '4242 4242 4242 4242',
    cardHolder: 'MARIA PEREZ',
    cvc: '123',
    ...futureExpiry(),
    ...overrides,
  };
}

describe('checkoutFormSchema', () => {
  it('accepts a valid checkout form', () => {
    const result = checkoutFormSchema.safeParse(buildValues());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cardNumber).toBe('4242424242424242');
    }
  });

  it('accepts an omitted optional phone', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ phone: undefined }));

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ email: 'not-an-email' }));

    expect(result.success).toBe(false);
  });

  it('rejects a card number that fails the Luhn checksum', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ cardNumber: '4242 4242 4242 4241' }));

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported card brand', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ cardNumber: '6011 0000 0000 0004' }));

    expect(result.success).toBe(false);
  });

  it('rejects an expired card', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ expMonth: '01', expYear: '20' }));

    expect(result.success).toBe(false);
  });

  it('rejects a short full name', () => {
    const result = checkoutFormSchema.safeParse(buildValues({ fullName: 'Al' }));

    expect(result.success).toBe(false);
  });
});
