import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const productos = [
  {
    sku: 'AUD-ANC-100',
    name: 'Audífonos inalámbricos con cancelación de ruido',
    description:
      'Over-ear, hasta 28 horas de batería y modo transparencia. Incluye estuche rígido.',
    priceInCents: 18790000,
    stock: 34,
    imageUrl: 'https://placehold.co/600x600/png?text=Audifonos',
  },
  {
    sku: 'TEC-MEC-87',
    name: 'Teclado mecánico TKL',
    description: 'Switches rojos hot-swap, retroiluminación RGB por tecla y cable USB-C desmontable.',
    priceInCents: 26990000,
    stock: 18,
    imageUrl: 'https://placehold.co/600x600/png?text=Teclado',
  },
  {
    sku: 'RELOJ-SPORT-2',
    name: 'Reloj inteligente deportivo',
    description:
      'Mide frecuencia cardíaca, GPS integrado y resistencia al agua 5 ATM. Hasta 10 días de batería.',
    priceInCents: 45900000,
    stock: 9,
    imageUrl: 'https://placehold.co/600x600/png?text=Reloj',
  },
  {
    sku: 'PARL-BT-360',
    name: 'Parlante portátil 360°',
    description: 'Sonido envolvente, resistente a salpicaduras (IPX6) y 16 horas de reproducción continua.',
    priceInCents: 14990000,
    stock: 47,
    imageUrl: 'https://placehold.co/600x600/png?text=Parlante',
  },
  {
    sku: 'HUB-USBC-7EN1',
    name: 'Hub USB-C 7 en 1',
    description: 'HDMI 4K, lector de tarjetas SD/microSD, dos puertos USB 3.0 y carga PD de 100W.',
    priceInCents: 8990000,
    stock: 55,
    imageUrl: 'https://placehold.co/600x600/png?text=Hub+USB-C',
  },
  {
    sku: 'WEBCAM-FHD-2',
    name: 'Cámara web Full HD',
    description: 'Grabación 1080p a 30fps, enfoque automático y micrófono con reducción de ruido.',
    priceInCents: 11990000,
    stock: 26,
    imageUrl: 'https://placehold.co/600x600/png?text=Camara+Web',
  },
];

async function main(): Promise<void> {
  for (const producto of productos) {
    await prisma.product.upsert({
      where: { sku: producto.sku },
      update: producto,
      create: producto,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Se sembraron ${productos.length} productos`);
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
