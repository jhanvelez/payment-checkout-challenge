import { Inject, Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/product/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../domain/product/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}
