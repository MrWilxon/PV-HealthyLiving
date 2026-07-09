import { db } from '../src/config/localDb';

const productData: Record<string, Array<{
  code: string;
  name: string;
  size: string;
  pv: number | null;
  dp: number;
}>> = {
  "Business Tools": [
    { code: "NP29103A", name: "Truman Bathing Bar", size: "125 g", pv: 4.79, dp: 230 },
    { code: "NP7006E", name: "Product Catalogue - English", size: "1 piece", pv: null, dp: 80 },
  ],
  "Lips": [
    { code: "NP33104", name: "MOM* Long Wear Liquid Lipstick Walnut Crush 004", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33105", name: "MOM* Long Wear Liquid Lipstick Red Velvet 005", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33106", name: "MOM* Long Wear Liquid Lipstick Wine Mousse 006", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33109", name: "MOM* Long Wear Liquid Lipstick Pink Paradise 009", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33122", name: "MOM* Long Wear Liquid Lipstick Pink Shock 022", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33124", name: "MOM* Long Wear Liquid Lipstick Perfect Maroon 024", size: "6 ml", pv: 19.38, dp: 930 },
  ],
  "Eyes": [
    { code: "NP35002", name: "MOM* Deep Define Kajal (Black)", size: "2.5 g", pv: 8.65, dp: 415 },
    { code: "NP35401", name: "MOM* Showtime Mascara", size: "8 ml", pv: 19.17, dp: 920 },
  ],
  "Face": [
    { code: "NP35205A", name: "MOM* Makeup Pro Fix Loose Powder", size: "6 g", pv: 18.33, dp: 880 },
    { code: "NP30015A", name: "MOM* Pro Perfect Foundation Bisque 001", size: "30 ml", pv: 18.75, dp: 900 },
    { code: "NP30016A", name: "MOM* Pro Perfect Foundation-Tawny 002", size: "30 ml", pv: 18.75, dp: 900 },
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
    { code: "NP23022A", name: "Assure Daily Care Shampoo (Normal)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23023A", name: "Assure Anti-Ageing Night Cream", size: "60 g", pv: 8.23, dp: 395 },
    { code: "NP23024A", name: "Assure Complete Fairness Cream", size: "50 g", pv: 5.21, dp: 300 },
    { code: "NP23029A", name: "Assure Sun Defense SPF 30+", size: "60 g", pv: 8.54, dp: 410 },
    { code: "NP23030A", name: "Assure Clarifying Face Wash", size: "60 g", pv: 5.52, dp: 265 },
    { code: "NP23033A", name: "Assure Aura Perfume Spray", size: "100 ml", pv: 16.25, dp: 780 },
    { code: "NP23035A", name: "Assure Hand & Body Lotion", size: "250 ml", pv: 7.92, dp: 380 },
    { code: "NP23036", name: "Assure Daily Moisturiser", size: "250 ml", pv: 9.06, dp: 435 },
    { code: "NP23037", name: "Assure Purifying Cleanser + Toner", size: "250 ml", pv: 9.90, dp: 475 },
    { code: "NP23038A", name: "Assure Hand Wash", size: "250 ml", pv: 4.30, dp: 225 },
    { code: "NP23040A", name: "Assure Captive (Pocket Perfume)", size: "18 ml", pv: 3.75, dp: 180 },
    { code: "NP23041A", name: "Assure Blossom (Pocket Perfume)", size: "18 ml", pv: 3.75, dp: 180 },
    { code: "NP23042A", name: "Assure Charisma (Pocket Perfume)", size: "18 ml", pv: 3.73, dp: 180 },
    { code: "NP23048A", name: "Assure Natural Sunscreen SPF 40+", size: "75 g", pv: 18.76, dp: 900 },
    { code: "NP23054A", name: "Assure Natural Face Scrub", size: "75 g", pv: 10.83, dp: 520 },
    { code: "NP23060", name: "Assure Natural Hair Mask", size: "150 g", pv: 14.58, dp: 700 },
    { code: "NP23073B", name: "Assure Force Fresh Body Talc", size: "100 g", pv: 2.60, dp: 150 },
    { code: "NP23074B", name: "Assure Enchant Body Talc", size: "100 g", pv: 2.60, dp: 150 },
    { code: "NP23080A", name: "Assure Vitamin C Facial Foam", size: "100 ml", pv: 13.64, dp: 655 },
    { code: "NP23081A", name: "Assure Vitamin C Gel Crème", size: "50 g", pv: 9.58, dp: 460 },
    { code: "NP23086A", name: "Assure Complexion Bar", size: "75 g", pv: 2.60, dp: 150 },
    { code: "NP23087A", name: "Assure Active (Deo for Men)", size: "150 ml", pv: 6.77, dp: 390 },
    { code: "NP23088", name: "Assure Rapture (Deo for Women)", size: "125 ml", pv: 5.21, dp: 300 },
    { code: "NP23090", name: "Assure Soap", size: "100 g", pv: 0.91, dp: 75 },
    { code: "NP23010A", name: "Assure Hair Conditioner", size: "75 g", pv: 8.54, dp: 410 },
    { code: "NP23093", name: "Assure Keratin Smoothening Shampoo", size: "150 ml", pv: 6.94, dp: 400 },
    { code: "NP23094", name: "Assure Anti-Hairfall Bounce Restore Shampoo", size: "150 ml", pv: 6.94, dp: 400 },
    { code: "NP23095", name: "Assure Intensive Care Rinse Off Conditioner", size: "100 ml", pv: 9.58, dp: 460 },
    { code: "NP23096", name: "Assure Damage Protection Leave-On Hair Serum", size: "30 ml", pv: 9.38, dp: 450 },
    { code: "NP23011A", name: "Assure Hair Oil", size: "200 ml", pv: 5.73, dp: 275 },
    { code: "NP23014A", name: "Assure Foot Cream", size: "50 g", pv: 5.31, dp: 255 },
    { code: "NP23016A", name: "Assure BB Cream", size: "30 g", pv: 14.58, dp: 700 },
  ],
  "DewGarden": [
    { code: "NP23039", name: "DewGarden Foaming Intimate Wash", size: "80 ml", pv: 7.50, dp: 360 },
    { code: "NP23101", name: "DewGarden Fly Sanitary Napkin", size: "Pack of 10", pv: 7.29, dp: 350 },
  ],
  "Dentassure": [
    { code: "NP24010A", name: "Dentassure Toothpaste", size: "100 g", pv: 2.60, dp: 150 },
    { code: "NP24004", name: "Dentassure Whitening Toothpaste", size: "90 g", pv: 4.27, dp: 205 },
    { code: "NP24005", name: "Dentassure Mouthwash", size: "250 ml", pv: 6.30, dp: 300 },
    { code: "NP24007", name: "Dentassure Gano Toothpaste", size: "100 g", pv: 5.42, dp: 260 },
    { code: "NP24011A", name: "Dentassure Multi-Action Toothbrush", size: "Set of 4", pv: 8.44, dp: 405 },
  ],
  "Health Care": [
    { code: "NP20004", name: "Vestige Noni", size: "90 capsules", pv: 18.06, dp: 800 },
    { code: "NP20005", name: "Vestige Aloe Vera", size: "60 capsules", pv: 9.17, dp: 440 },
    { code: "NP20007A", name: "Vestige Ganoderma", size: "90 capsules", pv: 31.04, dp: 1490 },
    { code: "NP20008", name: "Vestige Colostrum", size: "60 capsules", pv: 21.67, dp: 1040 },
    { code: "NP20023", name: "Vestige Spirulina", size: "100 capsules", pv: 11.67, dp: 560 },
    { code: "NP20026A", name: "Vestige Neem", size: "100 softgels", pv: 21.88, dp: 1050 },
    { code: "NP20027A", name: "Vestige Flax Oil", size: "90 softgels", pv: 25.00, dp: 1200 },
    { code: "NP21001A", name: "Vestige Glucosamine", size: "60 tablets", pv: 19.27, dp: 925 },
    { code: "NP21003A", name: "Vestige L-Arginine", size: "15 x 10 g", pv: 50.00, dp: 2400 },
    { code: "NP21032B", name: "Vestige Fibre Jar", size: "200 g", pv: 35.94, dp: 1725 },
    { code: "NP21012", name: "Vestige Detox Foot Patches", size: "10 patches", pv: 38.11, dp: 2195 },
    { code: "NP21013A", name: "Vestige Prime Krill Oil", size: "30 softgels", pv: 44.79, dp: 2150 },
    { code: "NP21019", name: "Vestige Eye Support", size: "30 capsules", pv: 20.63, dp: 990 },
    { code: "NP21023B", name: "Vestige Calcium", size: "100 tablets", pv: 17.71, dp: 850 },
    { code: "NP21026A", name: "Vestige Collagen", size: "7.5 x 10 g", pv: 27.09, dp: 1300 },
    { code: "NP21030B", name: "Vestige Coenzyme Q10", size: "30 softgels", pv: 36.04, dp: 1730 },
    { code: "NP21041", name: "Vestige Protein Powder", size: "200 g", pv: 32.71, dp: 1570 },
    { code: "NP20025", name: "Vestige Amla", size: "60 capsules", pv: 7.29, dp: 350 },
    { code: "NP20016", name: "Vestige Curcumin Plus", size: "60 capsules", pv: 33.02, dp: 1584 },
    { code: "NP20017", name: "Vestige Shatavari Max", size: "90 capsules", pv: 16.88, dp: 810 },
    { code: "NP21040A", name: "Vestige Veslim Shake (Mango Flavour)", size: "500 g", pv: 67.71, dp: 3250 },
    { code: "NP22048", name: "Vestige Veslim Shake (Vanilla Flavour)", size: "500 g", pv: 67.71, dp: 3250 },
  ],
  "Consumables": [
    { code: "NPL00001", name: "Real Pineapple", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NPL00002", name: "Real Canberry", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NPL00003", name: "Real Orange", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NP22007B", name: "Enerva Breakfast Cereal", size: "350 g", pv: 11.29, dp: 650 },
    { code: "NP22020", name: "Zeta Special Tea", size: "250 g", pv: 3.75, dp: 240 },
    { code: "NP22028A", name: "Dabur Honitus Ginger", size: "100 N", pv: 1.33, dp: 192 },
    { code: "NP22029D", name: "Dabur Hajmola Regular", size: "120 tablets", pv: 0.63, dp: 90 },
    { code: "NP22030D", name: "Dabur Hajmola Pudina", size: "120 tablets", pv: 0.63, dp: 90 },
    { code: "NP22032", name: "Rakura Supreme Himalayan Organic Green Tea", size: "100 g", pv: 1.53, dp: 220 },
    { code: "NP22033", name: "Rakura Supreme Himalayan Organic Green Tea", size: "200 g", pv: 2.78, dp: 400 },
    { code: "NP22039C", name: "Dabur Chyawanprash", size: "500 g", pv: 2.52, dp: 363 },
    { code: "NP22041", name: "Zeta Premium Coffee", size: "50 g", pv: 6.35, dp: 305 },
    { code: "NP22042C", name: "Lite House Rice Bran Oil", size: "2 L", pv: 8.42, dp: 970 },
    { code: "NP22043B", name: "Invigo Nutritional Protein Powder Jar", size: "200 g", pv: 28.13, dp: 1350 },
    { code: "NP22051C", name: "Real Mixed Fruit", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NP22052C", name: "Real Activ Apple", size: "1 L", pv: 2.15, dp: 310 },
    { code: "NP22053C", name: "Real Mango Nectar 1 Ltr", size: "1 L", pv: 1.94, dp: 280 },
    { code: "NP22054C", name: "Real Pomegranate", size: "1 L", pv: 1.98, dp: 285 },
    { code: "NP22055C", name: "Dabur Guava Nectar", size: "400 g", pv: 2.50, dp: 360 },
    { code: "NP22056D", name: "Dabur Honey", size: "100 g", pv: 0.96, dp: 138 },
    { code: "NPL00004", name: "Dabur Honey", size: "500 g", pv: 4.80, dp: 690 },
  ],
  "Hyvest": [
    { code: "NP25001A", name: "Hyvest Ultra Wash Liquid Laundary Detergent", size: "500 ml", pv: 11.35, dp: 655 },
    { code: "NP25003A", name: "Hyvest Ultra Swab Floor Cleaner Solution", size: "500 ml", pv: 6.77, dp: 390 },
    { code: "NP25008A", name: "Hyvest Ultra Guard Disinfectant Toilet Cleanser", size: "500 ml", pv: 3.81, dp: 220 },
    { code: "NP25012", name: "Hyvest Ultra Shine Glass and Household Cleaner", size: "500 ml", pv: 4.69, dp: 270 },
    { code: "NP25016A", name: "Hyvest Ultra Scrub Dishwashing Liquid", size: "500 ml", pv: 6.77, dp: 390 },
    { code: "NP25018B", name: "Hyvest Ultra Matic Detergent Powder", size: "500 g", pv: 5.55, dp: 320 },
  ],
};

async function seed() {
  console.log('Seeding local database...');

  const productsRef = db.collection('products');
  const settingsRef = db.collection('settings');

  let count = 0;
  for (const [categoryName, products] of Object.entries(productData)) {
    for (const product of products) {
      const existing = await productsRef.where('code', '==', product.code).get();
      if (existing.empty) {
        await productsRef.add({
          code: product.code,
          name: product.name,
          size: product.size,
          pv: product.pv,
          dp: product.dp,
          isFavorite: false,
          categoryName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    }
  }

  const existingSettings = await settingsRef.doc('singleton').get();
  if (!existingSettings.exists) {
    await settingsRef.doc('singleton').set({
      defaultVatPercent: 13,
      currency: 'NPR',
      decimalPlaces: 2,
      defaultQuantity: 1,
      autoSave: true,
    });
  }

  console.log(`Seeded ${count} products`);
}

seed().catch(console.error);
