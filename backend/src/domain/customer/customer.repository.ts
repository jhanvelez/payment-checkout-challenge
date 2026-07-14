import type { Customer } from './customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CreateCustomerData {
  email: string;
  fullName: string;
  phone: string | null;
}

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
}
