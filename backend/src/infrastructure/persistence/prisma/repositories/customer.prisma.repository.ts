import { Injectable } from '@nestjs/common';
import type { Customer } from '../../../../domain/customer/customer.entity';
import type {
  CreateCustomerData,
  CustomerRepository,
} from '../../../../domain/customer/customer.repository';
import { CustomerMapper } from '../mappers/customer.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomerPrismaRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { id } });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const record = await this.prisma.customer.create({ data });
    return CustomerMapper.toDomain(record);
  }
}
