import { randomBytes } from 'node:crypto';

export function generateTransactionReference(): string {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = randomBytes(3).toString('hex').toUpperCase();
  return `TX-${timestampPart}-${randomPart}`;
}
