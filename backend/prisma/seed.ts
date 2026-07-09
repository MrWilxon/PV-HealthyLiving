import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productData: Record<string, Array<{
  code: string;
  name: string;
  size: string;
  pv: number | null;
  dp: number;
}>> = {
  "Business Tools": [
    { code: "NP2210A", name: "Truman Bathing Bar", size: "125 g", pv: 4.79, dp: 230 },
    { code: "NP7006", name: "Product Catalogue - English", size: "1 piece", pv: null, dp: 80 },
  ],
  "Lips": [
    { code: "NP33104", name: "MOM Long Wear Liquid Lipstick Walnut Crush 004", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33105", name: "MOM Long Wear Liquid Lipstick Red Velvet 005", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33106", name: "MOM Long Wear Liquid Lipstick Wine Mousse 006", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33109", name: "MOM Long Wear Liquid Lipstick Pink Paradise 009", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33122", name: "MOM Long Wear Liquid Lipstick Pink Shock 022", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33124", name: "MOM Long Wear Liquid Lipstick Perfect Maroon 024", size: "6 ml", pv: 19.38, dp: 930 },
  ],
  "Eyes": [
    { code: "NP35002", name: "MOM Deep Define Kajal (Black)", size: "2.5 g", pv: 8.65, dp: 415 },
    { code: "NP35401", name: "MOM Showtime Mascara", size: "8 ml", pv: 19.17, dp: 920 },
  ],
  "Face": [
    { code: "NP35205A", name: "MOM Makeup Pro Fix Loose Powder", size: "6 g", pv: 18.33, dp: 880 },
    { code: "NP30015A", name: "MOM Pro Perfect Foundation - Bisque 001", size: "30 ml", pv: 18.75, dp: 900 },
    { code: "NP30016A", name: "MOM Pro Perfect Foundation - Tawny 002", size: "30 ml", pv: 18.75, dp: 900 },
  ],
  "Skin Formula 9": [
    { code: "NP28001", name: "Skin Formula 9 Youth Elixir Lotion", size: "25 ml", pv: 59.38, dp: 2850 },
    { code: "NP28002", name: "Skin Formula 9 Intense Hydration Cream", size: "50 g", pv: 52.08, dp: 2500 },
    { code: "NP28004A", name: "Skin Formula 9 Deep Cleansing Oil", size: "25 ml", pv: 48.97, dp: 2350 },
    { code: "NP28007", name: "Skin Formula 9 Brightening Treatment Cream", size: "50 g", pv: 82.81, dp: 3975 },
    { code: "NP28008", name: "Skin Formula 9 Blemish Gel", size: "15 ml", pv: 38.54, dp: 1850 },
    { code: "NP28009", name: "Skin Formula 9 Under Eye Serum", size: "15 ml", pv: 39.06, dp: 1875 },
    { code: "NP28014A", name: "Skin Formula 9 Radiant Glow Face Mist", size: "50 ml", pv: 21.88, dp: 1050 },
    { code: "NP28016", name: "Skin Formula 9 Skin Perfecting Vitamin C Serum", size: "50 ml", pv: 37.50, dp: 1800 },
    { code: "NP28017A", name: "Skin Formula 9 Hydrating Sunscreen Serum SPF 50 PA+++", size: "50 ml", pv: 37.50, dp: 1800 },
  ],
  "Assure": [
    { code: "NP23020A", name: "Assure Deep Cleanse Shampoo (Oily)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23021A", name: "Assure Moisture Rich Shampoo (D&D)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23022A", name: "Assure Daily Care Shampoo (Normal)", size: "60 g", pv: 8.23, dp: 395 },
  ],
  "Health Care": [
    { code: "NP20004", name: "Vestige Noni", size: "90 capsules", pv: 18.06, dp: 800 },
    { code: "NP20005", name: "Vestige Aloe Vera", size: "60 capsules", pv: 9.17, dp: 440 },
    { code: "NP20007A", name: "Vestige Ganoderma", size: "90 capsules", pv: 31.04, dp: 1490 },
  ],
  "Consumables": [
    { code: "NPL00001", name: "Real Pineapple", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NPL00002", name: "Real Cranberry", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NPL00003", name: "Real Orange", size: "1 L", pv: 1.98, dp: 285 },
  ],
};

async function main() {
  console.log('Seeding database...');

  for (const [categoryName, products] of Object.entries(productData)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    for (const product of products) {
      await prisma.product.upsert({
        where: { code: product.code },
        update: {
          name: product.name,
          size: product.size,
          pv: product.pv,
          dp: product.dp,
          categoryId: category.id,
        },
        create: {
          code: product.code,
          name: product.name,
          size: product.size,
          pv: product.pv,
          dp: product.dp,
          categoryId: category.id,
        },
      });
    }

    console.log(`Seeded ${categoryName}: ${products.length} products`);
  }

  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      defaultVatPercent: 13,
      currency: 'NPR',
      decimalPlaces: 2,
      defaultQuantity: 1,
      autoSave: true,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
