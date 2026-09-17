import { db } from './prisma/db.js';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting heavy database seed...');

  console.log('🌱 Starting heavy database seed...');

  // ----------------------------------------------------
  // 1. Create Mock User & Address
  // ----------------------------------------------------
  console.log('Creating Mock User and Address...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const mockUser = await db.orm.public.User.create({
    email: 'test@example.com',
    password: hashedPassword,
    fullName: 'Test User',
    role: 'USER',
  });

  const mockAddress = await db.orm.public.Address.create({
    userId: mockUser.id,
    receiver: 'Test User',
    phone: '0987654321',
    street: '123 E-commerce St',
    city: 'Tech City',
    isDefault: true,
  });

  // ----------------------------------------------------
  // 2. Create Categories
  // ----------------------------------------------------
  console.log('Creating Categories...');
  const catSmartphone = await db.orm.public.Category.create({ name: 'Smartphones', slug: 'smartphones' });
  const catLaptop = await db.orm.public.Category.create({ name: 'Laptops', slug: 'laptops' });
  const catAudio = await db.orm.public.Category.create({ name: 'Audio & Headphones', slug: 'audio' });
  const catWearable = await db.orm.public.Category.create({ name: 'Wearables', slug: 'wearables' });
  const catAccessory = await db.orm.public.Category.create({ name: 'Accessories', slug: 'accessories' });

  // ----------------------------------------------------
  // 3. Create Products
  // ----------------------------------------------------
  console.log('Creating Products...');
  const products = [
    // --- Smartphones ---
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Titanium, 256GB, Natural Titanium',
      price: '29900000',
      stock: 150,
      categoryId: catSmartphone.id,
      images: ['https://example.com/iphone15.jpg'],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-s24-ultra',
      description: 'Snapdragon 8 Gen 3, AI integrated',
      price: '27500000',
      stock: 80,
      categoryId: catSmartphone.id,
      images: ['https://example.com/s24.jpg'],
    },
    {
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      description: 'Best camera phone, Pure Android',
      price: '21900000',
      stock: 30,
      categoryId: catSmartphone.id,
      images: ['https://example.com/pixel8.jpg'],
    },

    // --- Laptops ---
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      description: 'M3 Chip, 13 inch, 16GB RAM',
      price: '27900000',
      stock: 50,
      categoryId: catLaptop.id,
      images: ['https://example.com/macbook.jpg'],
    },
    {
      name: 'Dell XPS 15',
      slug: 'dell-xps-15',
      description: 'OLED Display, Intel Core i9',
      price: '45000000',
      stock: 20,
      categoryId: catLaptop.id,
      images: ['https://example.com/xps.jpg'],
    },
    {
      name: 'ThinkPad X1 Carbon Gen 11',
      slug: 'thinkpad-x1-carbon-gen-11',
      description: 'Business laptop, ultra-light',
      price: '39000000',
      stock: 25,
      categoryId: catLaptop.id,
      images: ['https://example.com/thinkpad.jpg'],
    },

    // --- Audio ---
    {
      name: 'AirPods Pro 2',
      slug: 'airpods-pro-2',
      description: 'Active Noise Cancellation, USB-C',
      price: '5900000',
      stock: 200,
      categoryId: catAudio.id,
      images: ['https://example.com/airpods.jpg'],
    },
    {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'Industry leading noise canceling over-ear headphones',
      price: '7900000',
      stock: 60,
      categoryId: catAudio.id,
      images: ['https://example.com/sony.jpg'],
    },
    {
      name: 'Marshall Stanmore III',
      slug: 'marshall-stanmore-3',
      description: 'Bluetooth home speaker with vintage design',
      price: '9500000',
      stock: 15,
      categoryId: catAudio.id,
      images: ['https://example.com/marshall.jpg'],
    },

    // --- Wearables ---
    {
      name: 'Apple Watch Series 9',
      slug: 'apple-watch-series-9',
      description: '45mm, Aluminum Case, Midnight',
      price: '10500000',
      stock: 90,
      categoryId: catWearable.id,
      images: ['https://example.com/watch9.jpg'],
    },
    {
      name: 'Garmin Fenix 7X',
      slug: 'garmin-fenix-7x',
      description: 'Multisport GPS watch, Solar powered',
      price: '22000000',
      stock: 10,
      categoryId: catWearable.id,
      images: ['https://example.com/garmin.jpg'],
    },

    // --- Accessories ---
    {
      name: 'Apple 20W USB-C Power Adapter',
      slug: 'apple-20w-charger',
      description: 'Fast charging for iPhones and iPads',
      price: '500000',
      stock: 500,
      categoryId: catAccessory.id,
      images: ['https://example.com/charger.jpg'],
    },
    {
      name: 'Logitech MX Master 3S',
      slug: 'logitech-mx-master-3s',
      description: 'Advanced wireless mouse for creators',
      price: '2500000',
      stock: 120,
      categoryId: catAccessory.id,
      images: ['https://example.com/mxmaster.jpg'],
    },
    {
      name: 'Keychron K2 Wireless Mechanical Keyboard',
      slug: 'keychron-k2',
      description: 'Hot-swappable, RGB Backlight, Brown Switch',
      price: '2100000',
      stock: 75,
      categoryId: catAccessory.id,
      images: ['https://example.com/keychron.jpg'],
    }
  ];

  for (const p of products) {
    await db.orm.public.Product.create(p);
  }

  console.log(`✅ Successfully seeded 1 User, 1 Address, 5 Categories and ${products.length} Products!`);
  console.log(`\nTest User Login:`);
  console.log(`Email: test@example.com`);
  console.log(`Password: password123`);
  console.log(`Address ID for Checkout: ${mockAddress.id}`);
  
  await db.close();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await db.close();
  process.exit(1);
});
