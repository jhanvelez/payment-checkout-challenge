# Payment Checkout — Backend

API REST en NestJS para el checkout de pago con tarjeta, con arquitectura hexagonal e integración real con Wompi.

> Para levantar todo el stack (Postgres + backend) con un solo comando vía Docker, ver el [README principal](../README.md#cómo-correr-el-backend-con-docker). Esta guía es para correr el backend directamente con Node, sin Docker.

## Requisitos

- Node.js 22
- PostgreSQL 16 accesible (por ejemplo, el de `docker compose up postgres` desde la raíz del repo)

## Instalación y arranque local

```bash
npm install
cp .env.example .env
# completa DATABASE_URL (localhost:5433 si usas el Postgres de docker compose)
# y las llaves WOMPI_* con tus credenciales sandbox

npx prisma migrate deploy
npx prisma db seed

npm run start:dev
```

La API queda en `http://localhost:3000`, con Swagger en `http://localhost:3000/docs`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Corre el build compilado |
| `npm run lint` | ESLint (`--fix`) |
| `npm run test` | Tests unitarios |
| `npm run test:cov` | Tests unitarios + reporte de cobertura |
| `npm run test:e2e` | Tests end-to-end (requiere Postgres accesible) |

## Estructura (arquitectura hexagonal)

```
src/
├── domain/          # Entidades y contratos (repository ports) — sin dependencias externas
├── application/     # Casos de uso: create-transaction, process-payment, list-products, ...
├── infrastructure/  # Adaptadores: repositorios Prisma, cliente Wompi, config, logger
├── presentation/    # Controllers HTTP, DTOs (Swagger + class-validator), filtro de excepciones
└── shared/          # Utilidades transversales
```

`presentation` → `application` → `domain` ← `infrastructure`. El dominio y los casos de uso no conocen Prisma ni Wompi directamente, solo las interfaces (`ProductRepository`, `PaymentGatewayPort`, etc.) — ambos son reemplazables sin tocar la lógica de negocio.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/v1/products` | Catálogo de productos |
| `GET` | `/v1/products/:id` | Detalle de un producto |
| `POST` | `/v1/transactions` | Crea una transacción en `PENDING` a partir del carrito |
| `POST` | `/v1/transactions/:id/payments` | Tokeniza y cobra vía Wompi; actualiza el estado y descuenta stock si fue aprobado |
| `GET` | `/health` | Health check |

Detalle completo de request/response y códigos de error en Swagger (`/docs`).

## Testing

- **~96% statements**, 56 tests unitarios (`npm run test:cov`).
- 14 tests e2e (`npm run test:e2e`), incluyendo un suite que corre contra el sandbox real de Wompi (no mockeado) — requiere las llaves `WOMPI_*` configuradas en `.env`.
