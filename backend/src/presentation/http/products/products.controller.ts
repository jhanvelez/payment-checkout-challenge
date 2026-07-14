import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetProductByIdUseCase } from '../../../application/product/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../../application/product/use-cases/list-products.use-case';
import { ProductNotFoundError } from '../../../domain/product/product.errors';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the product catalog' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async list(): Promise<ProductResponseDto[]> {
    const products = await this.listProductsUseCase.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product does not exist' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.getProductByIdUseCase.execute(id);
      return ProductResponseDto.fromDomain(product);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
