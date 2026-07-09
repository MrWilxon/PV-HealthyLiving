import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const hyvestProducts = [
  { code: "NP25001A", name: "Hyvest Ultra Wash Liquid Laundary Detergent", size: "500 ml", pv: 11.35, dp: 655 },
  { code: "NP25003A", name: "Hyvest Ultra Swab Floor Cleaner Solution", size: "500 ml", pv: 6.77, dp: 390 },
  { code: "NP25008A", name: "Hyvest Ultra Guard Disinfectant Toilet Cleanser", size: "500 ml", pv: 3.81, dp: 220 },
  { code: "NP25012", name: "Hyvest Ultra Shine Glass and Household Cleaner", size: "500 ml", pv: 4.69, dp: 270 },
  { code: "NP25016A", name: "Hyvest Ultra Scrub Dishwashing Liquid", size: "500 ml", pv: 6.77, dp: 390 },
  { code: "NP25018B", name: "Hyvest Ultra Matic Detergent Powder", size: "500 g", pv: 5.55, dp: 320 },
];

async function addHyvest() {
  const productsRef = db.collection('products');

  for (const product of hyvestProducts) {
    const existing = await productsRef.where('code', '==', product.code).get();
    if (existing.empty) {
      await productsRef.add({
        ...product,
        categoryName: 'Hyvest',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`Added: ${product.code} - ${product.name}`);
    } else {
      console.log(`Exists: ${product.code}`);
    }
  }

  console.log('Done!');
}

addHyvest().catch(console.error);
