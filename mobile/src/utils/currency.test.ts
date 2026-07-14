import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats whole COP amounts without decimals', () => {
    expect(formatCurrency(18790000, 'COP')).toContain('187.900');
  });

  it('converts cents to the major unit before formatting', () => {
    expect(formatCurrency(100, 'COP')).toContain('1');
    expect(formatCurrency(100, 'COP')).not.toContain('100');
  });

  it('formats zero', () => {
    expect(formatCurrency(0, 'COP')).toContain('0');
  });
});
