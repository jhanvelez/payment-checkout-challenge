import {
  BadGatewayException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProcessPaymentUseCase } from '../../../application/checkout/use-cases/process-payment.use-case';
import {
  PaymentGatewayError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/transaction/transaction.errors';
import { PaymentResultResponseDto } from './dto/payment-result-response.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@ApiTags('payments')
@Controller('transactions/:transactionId/payments')
export class PaymentsController {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tokenize-and-charge a PENDING transaction through Wompi' })
  @ApiParam({ name: 'transactionId', format: 'uuid' })
  @ApiCreatedResponse({ type: PaymentResultResponseDto })
  @ApiNotFoundResponse({ description: 'Transaction does not exist' })
  @ApiConflictResponse({ description: 'Transaction is not in PENDING status (already processed)' })
  @ApiResponse({ status: 502, description: 'Wompi request failed' })
  async create(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() dto: ProcessPaymentDto,
  ): Promise<PaymentResultResponseDto> {
    try {
      const result = await this.processPaymentUseCase.execute({
        transactionId,
        cardToken: dto.cardToken,
        installments: dto.installments ?? 1,
      });
      return PaymentResultResponseDto.fromDomain(result);
    } catch (error) {
      if (error instanceof TransactionNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TransactionAlreadyProcessedError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof PaymentGatewayError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
  }
}
