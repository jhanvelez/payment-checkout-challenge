# Payment Checkout

Prueba técnica: checkout de pago con tarjeta de crédito, con backend en NestJS (arquitectura hexagonal) y app móvil en React Native, integrados con la pasarela de pagos Wompi (sandbox).

- **Backend**: [`backend/`](backend) — NestJS + TypeScript + Prisma + PostgreSQL
- **Mobile**: [`mobile/`](mobile) — React Native CLI + TypeScript + Redux Toolkit

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [Variables de entorno](#variables-de-entorno)
- [Cómo correr el backend con Docker](#cómo-correr-el-backend-con-docker)
- [Cómo correr la app móvil](#cómo-correr-la-app-móvil)
- [Cómo probar](#cómo-probar)
- [Documentación de la API (Swagger)](#documentación-de-la-api-swagger)
- [Decisiones técnicas](#decisiones-técnicas)
- [Capturas / demo](#capturas--demo)

---

## Arquitectura

### Backend — Arquitectura hexagonal (ports & adapters)

```
backend/src/
├── domain/            # Entidades y contratos (repository ports), sin dependencias externas
├── application/       # Casos de uso (orquestan domain + ports)
├── infrastructure/     # Adaptadores: Prisma (Postgres), cliente Wompi, config, logger
├── presentation/       # Controllers HTTP, DTOs (Swagger + class-validator), filtro global de excepciones
└── shared/             # Utilidades transversales
```

Regla de dependencia: `presentation` → `application` → `domain` ← `infrastructure`. El dominio no conoce Prisma ni Wompi; `application` solo conoce las interfaces (`ProductRepository`, `PaymentGatewayPort`, etc.), nunca la implementación concreta.

### Base de datos

PostgreSQL vía Prisma. Tablas principales: `products`, `customers`, `transactions`, `transaction_items`, `payments`, `inventory_movements`.

### Mobile — Flux por dominio (Redux Toolkit) + navegación por flujo

```
mobile/src/
├── features/           # Un slice de Redux por dominio: products, cart, checkout, payment, transaction, ui
├── screens/             # Splash, Home, ProductDetail, Checkout, Processing, Result
├── components/          # UI kit compartido (Button, Card, TextField, CartSummary, ...)
├── services/            # Cliente axios (nuestro backend) + cliente Wompi (tokenización directa)
├── store/               # Store, hooks tipados, persistencia cifrada
├── navigation/           # React Navigation (native-stack)
└── theme/               # Design tokens (colores, tipografía, espaciado)
```

Solo el slice `transaction` se persiste (historial de pagos), cifrado con AES-256 vía MMKV; la clave de cifrado vive en el Keystore/Keychain nativo (`react-native-keychain`), nunca en almacenamiento plano.

---

## Stack tecnológico

### Backend

| | |
|---|---|
| Framework | NestJS + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Contenedores | Docker + Docker Compose |
| Validación | class-validator / class-transformer |
| Documentación API | Swagger (`@nestjs/swagger`) |
| Logging | Pino |
| Seguridad | Helmet, rate limiting (`@nestjs/throttler`) |
| Config | `@nestjs/config` + validación con Joi |
| Testing | Jest (unit) + Supertest (e2e) |

### Mobile

| | |
|---|---|
| Framework | React Native (CLI, sin Expo) + TypeScript |
| Estado | Redux Toolkit + Redux Persist |
| Navegación | React Navigation (native-stack) |
| Formularios | React Hook Form + Zod |
| HTTP | Axios |
| Almacenamiento seguro | MMKV (cifrado AES-256) + Keychain/Keystore |
| Animaciones | React Native Reanimated + Gesture Handler |
| Testing | Jest + React Native Testing Library |

---

## Flujo de la aplicación

**Mobile:** Splash → Productos → Detalle → Checkout (resumen + datos del comprador + tarjeta) → Procesando → Resultado → Volver a la tienda

**Backend, al pagar:**

```
POST /v1/transactions          → crea la transacción en PENDING
POST /v1/transactions/:id/payments
  → tokeniza la tarjeta (hecho desde el dispositivo, el backend nunca ve el número de tarjeta)
  → llama a Wompi con el token
  → actualiza el estado de la transacción (APPROVED / DECLINED / ERROR)
  → si fue aprobado: descuenta stock y registra el movimiento de inventario
  → responde con el resultado final
```

---

## Variables de entorno

Hay dos archivos de ejemplo:

- **`.env.example`** (raíz) — usado por `docker-compose.yml` para levantar todo el stack.
- **`backend/.env.example`** — usado si corres el backend fuera de Docker (`npm run start:dev`).

Cópialos y complétalos con tus credenciales de Wompi sandbox (`docs.wompi.co/docs/colombia/ambientes-y-llaves`):

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales de Postgres (tienen valores por defecto funcionales) |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Rate limiting del backend |
| `CORS_ORIGIN` | Origen permitido por CORS |
| `WOMPI_UAT_URL` / `WOMPI_SANDBOX_URL` | URLs del ambiente sandbox de Wompi |
| `WOMPI_PUBLIC_KEY` | Llave pública (la usa también la app móvil para tokenizar tarjetas) |
| `WOMPI_PRIVATE_KEY` | Llave privada (solo backend, para firmar transacciones) |
| `WOMPI_EVENTS_KEY` | Llave de eventos/webhooks de Wompi |
| `WOMPI_INTEGRITY_KEY` | Llave de integridad (firma el hash de la transacción) |
| `WOMPI_POLL_INTERVAL_MS` / `WOMPI_POLL_MAX_ATTEMPTS` | Cada cuánto y cuántas veces el backend consulta a Wompi el estado final de un pago |

Sin las llaves de Wompi, el backend levanta igual, pero `POST /v1/transactions/:id/payments` fallará al intentar tokenizar/cobrar.

---

## Cómo correr el backend con Docker

Requisitos: Docker + Docker Compose. No se necesita Node ni Postgres instalados localmente.

```bash
# 1. Desde la raíz del repo, crea tu .env
cp .env.example .env
# y completa las 4 llaves de WOMPI_* con tus credenciales sandbox

# 2. Levanta todo (Postgres + migraciones + seed + backend)
docker compose up --build
```

Esto levanta 3 servicios en orden (`postgres` → `migrate` → `backend`, con `depends_on`/healthchecks entre ellos):

1. **`postgres`** — Postgres 16, expuesto en `localhost:5433` (no 5432, para no chocar con un Postgres local).
2. **`migrate`** — corre `prisma migrate deploy` y luego `prisma db seed` (carga 6 productos de ejemplo). Es un contenedor de un solo uso; termina y sale con código 0.
3. **`backend`** — la API, expuesta en `localhost:3000`.

Cuando termine, verifica que todo esté sano:

```bash
curl http://localhost:3000/health
# {"status":"ok"}

curl http://localhost:3000/v1/products
# lista de productos sembrados
```

La documentación interactiva de la API queda en **http://localhost:3000/docs**.

**No hace falta ningún cambio en el código del backend para que esto funcione** — el `docker-compose.yml` y el `Dockerfile` (multi-stage: `deps` → `build` → `prod-deps` → `runtime`) ya están completos y probados de punta a punta (incluyendo reconstruir la imagen y correr la suite e2e completa contra el contenedor). Lo único que puede faltar del lado de quien lo corre es completar las 4 llaves de Wompi en `.env` — sin eso, todo lo que no sea "procesar un pago" (catálogo, crear transacción PENDING) funciona igual.

Para bajar el stack:

```bash
docker compose down          # detiene los contenedores, conserva los datos
docker compose down -v       # además borra el volumen de Postgres (reinicia todo desde cero)
```

Para reconstruir después de cambiar código del backend:

```bash
docker compose up -d --build backend
```

---

## Cómo correr la app móvil

Requisitos: entorno de React Native configurado ([guía oficial](https://reactnative.dev/docs/set-up-your-environment)), backend corriendo (ver arriba).

```bash
cd mobile
npm install

# Terminal 1: Metro
npm start

# Terminal 2: instalar y correr en el emulador/dispositivo Android
npm run android
```

La app ya está configurada para apuntar al backend dockerizado sin tocar nada:
- **Emulador Android**: usa automáticamente `http://10.0.2.2:3000` (alias especial del emulador hacia `localhost` del host).
- **Dispositivo físico**: cambia el host en [`mobile/src/services/env.ts`](mobile/src/services/env.ts) por la IP de tu máquina en la red local.

Tarjetas de prueba de Wompi sandbox: `4242 4242 4242 4242` (aprobada) y `4111 1111 1111 1111` (rechazada), cualquier fecha futura y CVC de 3 dígitos.

---

## Cómo probar

### Backend

```bash
cd backend
npm run test          # unit tests
npm run test:cov       # unit tests + reporte de cobertura
npm run test:e2e       # tests end-to-end (requiere Postgres accesible, ver backend/.env)
npm run lint
npm run build
```

Cobertura actual: **~96% statements** (56 tests unitarios) + 14 tests e2e, incluyendo un suite que corre contra el sandbox real de Wompi (no mockeado).

### Mobile

```bash
cd mobile
npm run test -- --coverage
npm run lint
npx tsc --noEmit
```

Cobertura actual: **~93% statements** (80 tests) sobre reducers, componentes, pantallas y validaciones (Luhn, detección de marca de tarjeta, schemas de zod).

CI: cada PR corre lint + build + tests + cobertura del backend automáticamente ([`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml)).

---

## Documentación de la API (Swagger)

Con el backend corriendo: **http://localhost:3000/docs**

Todos los endpoints documentados con summary, request/response schemas con ejemplos, y los códigos de error reales que cada uno puede devolver (400/404/409/502 según el caso).

---

## Decisiones técnicas

- **Arquitectura hexagonal en el backend**: el dominio no depende de Prisma ni de Wompi; ambos son adaptadores intercambiables detrás de una interfaz (`ProductRepository`, `PaymentGatewayPort`). Facilita testear casos de uso con mocks simples y aislar la lógica de negocio de la infraestructura.
- **Tokenización de tarjeta desde el cliente**: la app móvil tokeniza la tarjeta directamente contra Wompi con la llave pública; el número de tarjeta y el CVC nunca llegan a nuestro backend, reduciendo el alcance PCI del servidor a "nunca ve datos de tarjeta".
- **Stock se descuenta solo tras un pago aprobado**: `POST /v1/transactions` valida stock pero no lo decrementa; el descuento (y el registro del movimiento de inventario) ocurre atómicamente cuando Wompi confirma el pago, evitando descontar stock de transacciones que nunca se pagan.
- **Persistencia cifrada en mobile**: solo el historial de transacciones se persiste (carrito y estado de checkout son efímeros, a propósito), cifrado con MMKV (AES-256) y con la llave de cifrado en el Keystore/Keychain nativo — no en almacenamiento plano.
- **Idempotencia del pago**: reprocesar una transacción que ya no está en `PENDING` responde `409 Conflict` en vez de cobrar dos veces.
- **Reintentos en la pantalla de "Procesando"**: un fallo de red/gateway hacia Wompi (distinto de un pago rechazado, que es un resultado válido) muestra un estado de error con reintento, sin perder la transacción `PENDING` ya creada.

---

## Capturas / demo

_Pendiente: agregar capturas de pantalla y/o un GIF del flujo completo (catálogo → checkout → resultado)._
