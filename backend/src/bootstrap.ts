import type { INestApplication } from '@nestjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Applies the request-handling pipeline (security headers, CORS,
 * versioning, validation) that production traffic goes through.
 * Shared between main.ts and the e2e test bootstraps so tests exercise
 * the exact same pipeline instead of a bare NestJS default app.
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: configService.get<string>('cors.origin') });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}
