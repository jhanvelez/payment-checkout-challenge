import { z } from 'zod';
import { detectCardBrand, isValidLuhn } from '../../utils/cardValidation';

function isExpiryInFuture(expMonth: string, expYear: string): boolean {
  const month = Number(expMonth);
  const year = Number(expYear);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) {
    return true;
  }
  if (year === currentYear) {
    return month >= currentMonth;
  }
  return false;
}

export const checkoutFormSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa tu nombre completo'),
    email: z.string().trim().email('Correo inválido'),
    phone: z.string().trim().optional(),
    cardNumber: z
      .string()
      .transform((value) => value.replace(/\s/g, ''))
      .pipe(
        z
          .string()
          .regex(/^\d{13,19}$/, 'Número de tarjeta inválido')
          .refine(isValidLuhn, 'Número de tarjeta inválido')
          .refine((value) => detectCardBrand(value) !== 'unknown', 'Tarjeta no soportada'),
      ),
    cardHolder: z.string().trim().min(3, 'Ingresa el nombre del titular'),
    expMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mes inválido (MM)'),
    expYear: z.string().regex(/^\d{2}$/, 'Año inválido (AA)'),
    cvc: z.string().regex(/^\d{3,4}$/, 'CVC inválido'),
  })
  .refine((data) => isExpiryInFuture(data.expMonth, data.expYear), {
    message: 'La tarjeta está vencida',
    path: ['expYear'],
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
