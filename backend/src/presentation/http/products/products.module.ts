import { Module } from '@nestjs/common';
import { GetProductByIdUseCase } from '../../../application/product/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../../application/product/use-cases/list-products.use-case';
import { PRODUCT_REPOSITORY } from '../../../domain/product/product.repository';
import { ProductPrismaRepository } from '../../../infrastructure/persistence/prisma/repositories/product.prisma.repository';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductByIdUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
