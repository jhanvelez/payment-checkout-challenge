import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    sku: 'SKU-HEADPHONES-001',
    name: 'Wireless Headphones',
    description: 'Over-ear headphones with active noise cancellation and 30h battery life.',
    priceInCents: 15000000,
    stock: 30,
    imageUrl: 'https://placehold.co/600x600/png?text=Headphones',
  },
  {
    sku: 'SKU-KEYBOARD-001',
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable mechanical keyboard with RGB backlight.',
    priceInCents: 32000000,
    stock: 15,
    imageUrl: 'https://placehold.co/600x600/png?text=Keyboard',
  },
  {
    sku: 'SKU-SMARTWATCH-001',
    name: 'Smartwatch',
    description: 'Fitness smartwatch with heart-rate monitor and GPS.',
    priceInCents: 45000000,
    stock: 12,
    imageUrl: 'https://placehold.co/600x600/png?text=Smartwatch',
  },
  {
    sku: 'SKU-SPEAKER-001',
    name: 'Portable Speaker',
    description: 'Waterproof Bluetooth speaker with 20h playtime.',
    priceInCents: 18000000,
    stock: 40,
    imageUrl: 'https://placehold.co/600x600/png?text=Speaker',
  },
  {
    sku: 'SKU-USBHUB-001',
    name: 'USB-C Hub',
    description: '7-in-1 USB-C hub with HDMI, SD card reader and PD charging.',
    priceInCents: 9500000,
    stock: 60,
    imageUrl: 'https://placehold.co/600x600/png?text=USB-C+Hub',
  },
  {
    sku: 'SKU-WEBCAM-001',
    name: 'Webcam 1080p',
    description: 'Full HD webcam with autofocus and built-in microphone.',
    priceInCents: 13000000,
    stock: 20,
    imageUrl: 'https://placehold.co/600x600/png?text=Webcam',
  },
];

async function main(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seeded ${products.length} products`);
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
