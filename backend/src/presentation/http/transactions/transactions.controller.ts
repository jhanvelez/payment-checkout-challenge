import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTransactionUseCase } from '../../../application/checkout/use-cases/create-transaction.use-case';
import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../../domain/product/product.errors';
import { EmptyCartError } from '../../../domain/transaction/transaction.errors';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly createTransactionUseCase: CreateTransactionUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a PENDING transaction from the cart items' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({
    description: 'Empty cart, unknown product, or insufficient stock for one of the items',
  })
  async create(@Body() dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.createTransactionUseCase.execute({
        customer: dto.customer,
        items: dto.items,
      });
      return TransactionResponseDto.fromDomain(transaction);
    } catch (error) {
      if (
        error instanceof EmptyCartError ||
        error instanceof ProductNotFoundError ||
        error instanceof InsufficientStockError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
