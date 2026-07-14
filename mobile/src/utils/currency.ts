/**
 * Backend amounts are always integer cents (matches Wompi's amount_in_cents
 * convention, even for COP which has no minor unit in everyday use).
 */
export function formatCurrency(amountInCents: number, currency = 'COP'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
