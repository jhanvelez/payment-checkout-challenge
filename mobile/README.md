# Payment Checkout — Mobile

App de checkout en React Native CLI (sin Expo) + TypeScript, con Redux Toolkit y persistencia cifrada.

> Para el panorama completo del proyecto (arquitectura, backend, decisiones técnicas) ver el [README principal](../README.md).

## Requisitos

- Entorno de React Native configurado: [guía oficial](https://reactnative.dev/docs/set-up-your-environment) (Android Studio + JDK para Android; Xcode + CocoaPods para iOS)
- El backend corriendo — ver [README principal](../README.md#cómo-correr-el-backend-con-docker)

## Instalación y arranque

```bash
npm install

# terminal 1
npm start

# terminal 2
npm run android   # o: npm run ios
```

## Conexión con el backend

La app ya está configurada para no requerir cambios en el caso más común:

- **Emulador Android**: usa automáticamente `http://10.0.2.2:3000` (alias del emulador hacia `localhost` del host).
- **Dispositivo físico / iOS**: edita el host en [`src/services/env.ts`](src/services/env.ts) por la IP de tu máquina en la red local.

**Tarjetas de prueba (Wompi sandbox)**: `4242 4242 4242 4242` (aprobada) · `4111 1111 1111 1111` (rechazada). Cualquier fecha futura, CVC de 3 dígitos.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Servidor Metro |
| `npm run android` / `npm run ios` | Compila e instala en emulador/dispositivo |
| `npm run lint` | ESLint |
| `npm run test` | Tests (Jest + React Native Testing Library) |
| `npx tsc --noEmit` | Chequeo de tipos |

## Estructura

```
src/
├── features/     # Un slice de Redux por dominio: products, cart, checkout, payment, transaction, ui
├── screens/      # Splash, Home, ProductDetail, Checkout, Processing, Result
├── components/   # UI kit compartido: Button, Card, TextField, CartSummary, ...
├── services/     # Cliente axios (backend) + cliente Wompi (tokenización directa desde el dispositivo)
├── store/        # Store, hooks tipados, storage cifrado (MMKV + Keychain)
├── navigation/   # React Navigation (native-stack)
├── theme/        # Design tokens: colores, tipografía, espaciado
└── utils/        # Validación de tarjeta (Luhn, marca), formato de moneda
```

Solo el slice `transaction` se persiste (historial de pagos), cifrado con AES-256 vía MMKV; la llave de cifrado vive en el Keystore/Keychain nativo, nunca en almacenamiento plano. El carrito y el estado de checkout son intencionalmente efímeros.

## Testing

**~93% statements**, 80 tests: reducers, componentes, pantallas, y validaciones (Luhn, detección de marca de tarjeta, schemas de zod).

```bash
npm run test -- --coverage
```
