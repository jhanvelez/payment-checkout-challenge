import type { Params } from 'nestjs-pino';

export const pinoLoggerConfig = (isProduction: boolean): Params => ({
  pinoHttp: {
    level: isProduction ? 'info' : 'debug',
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'HH:MM:ss',
          },
        },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.number',
        'req.body.cvc',
        'req.body.card_number',
        'req.body.cvv',
      ],
      censor: '***REDACTED***',
    },
    customProps: () => ({ context: 'HTTP' }),
  },
});
