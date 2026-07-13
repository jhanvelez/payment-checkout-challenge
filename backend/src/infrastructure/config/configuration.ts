export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },

  wompi: {
    uatUrl: process.env.WOMPI_UAT_URL,
    sandboxUrl: process.env.WOMPI_SANDBOX_URL,
    publicKey: process.env.WOMPI_PUBLIC_KEY,
    privateKey: process.env.WOMPI_PRIVATE_KEY,
    eventsKey: process.env.WOMPI_EVENTS_KEY,
    integrityKey: process.env.WOMPI_INTEGRITY_KEY,
  },
});
