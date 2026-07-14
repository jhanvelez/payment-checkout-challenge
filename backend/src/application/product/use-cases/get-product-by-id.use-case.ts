import { Inject, Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/product/product.entity';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../domain/product/product.repository';

@Injectable()
export class GetProductByIdUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }
}
