import { detectCardBrand, formatCardNumber, isValidLuhn } from './cardValidation';

describe('isValidLuhn', () => {
  it('accepts the Wompi sandbox approved test card', () => {
    expect(isValidLuhn('4242424242424242')).toBe(true);
  });

  it('accepts the Wompi sandbox declined test card', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
  });

  it('accepts a formatted card number with spaces', () => {
    expect(isValidLuhn('4242 4242 4242 4242')).toBe(true);
  });

  it('rejects a number that fails the checksum', () => {
    expect(isValidLuhn('4242424242424241')).toBe(false);
  });

  it('rejects a number that is too short', () => {
    expect(isValidLuhn('4242')).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it('detects Visa from the leading 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
  });

  it('detects Mastercard from the 51-55 range', () => {
    expect(detectCardBrand('5555555555554444')).toBe('mastercard');
  });

  it('detects Mastercard from the 2221-2720 range', () => {
    expect(detectCardBrand('2223000048400011')).toBe('mastercard');
  });

  it('detects Amex from the 34/37 prefix', () => {
    expect(detectCardBrand('378282246310005')).toBe('amex');
  });

  it('returns unknown for unrecognized prefixes', () => {
    expect(detectCardBrand('6011000000000004')).toBe('unknown');
  });
});

describe('formatCardNumber', () => {
  it('groups digits into blocks of 4', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('strips non-digit characters before grouping', () => {
    expect(formatCardNumber('4242-4242 4242.4242')).toBe('4242 4242 4242 4242');
  });

  it('truncates beyond 19 digits', () => {
    expect(formatCardNumber('42424242424242424242424242')).toBe('4242 4242 4242 4242 424');
  });
});
