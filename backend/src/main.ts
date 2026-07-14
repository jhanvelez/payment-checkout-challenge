import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  app.useLogger(app.get(Logger));

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payment Checkout API')
    .setDescription('Credit card payment checkout backend')
    .setVersion('1.0')
    .addTag('products')
    .addTag('transactions')
    .addTag('payments')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
