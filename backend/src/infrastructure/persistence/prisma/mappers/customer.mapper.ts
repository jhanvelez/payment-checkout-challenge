import type { Customer as PrismaCustomer } from '@prisma/client';
import { Customer } from '../../../../domain/customer/customer.entity';

export class CustomerMapper {
  static toDomain(record: PrismaCustomer): Customer {
    return new Customer({
      id: record.id,
      email: record.email,
      fullName: record.fullName,
      phone: record.phone,
      createdAt: record.createdAt,
    });
  }
}
