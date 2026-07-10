import { Router, Request, Response } from 'express';
import { db, DocData } from '../config/firebase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { adminMiddleware } from '../middleware/auth';

const router = Router();
const settingsRef = db.collection('settings');

interface SettingsData extends DocData {
  defaultVatPercent: number;
  currency: string;
  decimalPlaces: number;
  defaultQuantity: number;
  autoSave: boolean;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  vatPresets: number[];
}

const defaultSettings: SettingsData = {
  defaultVatPercent: 13,
  currency: 'NPR',
  decimalPlaces: 2,
  defaultQuantity: 1,
  autoSave: true,
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  vatPresets: [0, 10, 13, 15],
};

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const doc = await settingsRef.doc('singleton').get();

  if (!doc.exists) {
    await settingsRef.doc('singleton').set(defaultSettings);
    res.json({ id: 'singleton', ...defaultSettings });
    return;
  }

  const data = doc.data() as SettingsData;
  res.json({
    id: doc.id,
    ...defaultSettings,
    ...data,
  });
}));

router.put('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    defaultVatPercent,
    currency,
    decimalPlaces,
    defaultQuantity,
    autoSave,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    vatPresets,
  } = req.body;

  const doc = await settingsRef.doc('singleton').get();

  if (!doc.exists) {
    await settingsRef.doc('singleton').set(defaultSettings);
  }

  const updateData: Partial<SettingsData> = {};

  if (defaultVatPercent !== undefined) {
    const val = parseFloat(defaultVatPercent);
    if (isNaN(val) || val < 0 || val > 100) throw new AppError('defaultVatPercent must be between 0 and 100');
    updateData.defaultVatPercent = val;
  }
  if (currency !== undefined) updateData.currency = currency;
  if (decimalPlaces !== undefined) {
    const val = parseInt(decimalPlaces);
    if (isNaN(val) || val < 0 || val > 10) throw new AppError('decimalPlaces must be between 0 and 10');
    updateData.decimalPlaces = val;
  }
  if (defaultQuantity !== undefined) {
    const val = parseInt(defaultQuantity);
    if (isNaN(val) || val < 1) throw new AppError('defaultQuantity must be at least 1');
    updateData.defaultQuantity = val;
  }
  if (autoSave !== undefined) updateData.autoSave = Boolean(autoSave);
  if (companyName !== undefined) updateData.companyName = companyName;
  if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
  if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
  if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
  if (vatPresets !== undefined) {
    if (!Array.isArray(vatPresets)) throw new AppError('vatPresets must be an array');
    updateData.vatPresets = vatPresets.map((v: unknown) => Number(v)).filter((v: number) => !isNaN(v));
  }

  if (Object.keys(updateData).length > 0) {
    await settingsRef.doc('singleton').update(updateData);
  }

  const updated = await settingsRef.doc('singleton').get();
  const updatedData = updated.data() as SettingsData;
  res.json({ id: updated.id, ...defaultSettings, ...updatedData });
}));

router.post('/seed', adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { confirm } = req.body;
  if (confirm !== true) {
    throw new AppError('Set confirm: true to seed products');
  }

  const productsRef = db.collection('products');
  const existing = await productsRef.get();
  if (!existing.empty) {
    throw new AppError('Products already exist. Reset data first to re-seed.');
  }

  const seedData = [
    { code: "NP29103A", name: "Truman Bathing Bar", size: "125 g", pv: 4.79, dp: 230 },
    { code: "NP7006E", name: "Product Catalogue - English", size: "1 piece", pv: null, dp: 80 },
    { code: "NP33104", name: "MOM Long Wear Liquid Lipstick Walnut Crush 004", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33105", name: "MOM Long Wear Liquid Lipstick Red Velvet 005", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33106", name: "MOM Long Wear Liquid Lipstick Wine Mousse 006", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33109", name: "MOM Long Wear Liquid Lipstick Pink Paradise 009", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33122", name: "MOM Long Wear Liquid Lipstick Pink Shock 022", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP33124", name: "MOM Long Wear Liquid Lipstick Perfect Maroon 024", size: "6 ml", pv: 19.38, dp: 930 },
    { code: "NP35002", name: "MOM Deep Define Kajal (Black)", size: "2.5 g", pv: 8.65, dp: 415 },
    { code: "NP35401", name: "MOM Showtime Mascara", size: "8 ml", pv: 19.17, dp: 920 },
    { code: "NP35205A", name: "MOM Makeup Pro Fix Loose Powder", size: "6 g", pv: 18.33, dp: 880 },
    { code: "NP30015A", name: "MOM Pro Perfect Foundation Bisque 001", size: "30 ml", pv: 18.75, dp: 900 },
    { code: "NP30016A", name: "MOM Pro Perfect Foundation-Tawny 002", size: "30 ml", pv: 18.75, dp: 900 },
    { code: "NP28001", name: "Skin Formula 9 Youth Elixir Lotion", size: "25 ml", pv: 59.38, dp: 2850 },
    { code: "NP28002", name: "Skin Formula 9 Intense Hydration Cream", size: "50 g", pv: 52.08, dp: 2500 },
    { code: "NP28004A", name: "Skin Formula 9 Deep Cleansing Oil", size: "25 ml", pv: 48.97, dp: 2350 },
    { code: "NP28007", name: "Skin Formula 9 Brightening Treatment Cream", size: "50 g", pv: 82.81, dp: 3975 },
    { code: "NP28008", name: "Skin Formula 9 Blemish Gel", size: "15 ml", pv: 38.54, dp: 1850 },
    { code: "NP28009", name: "Skin Formula 9 Under Eye Serum", size: "15 ml", pv: 39.06, dp: 1875 },
    { code: "NP28014A", name: "Skin Formula 9 Radiant Glow Face Mist", size: "50 ml", pv: 21.88, dp: 1050 },
    { code: "NP28016", name: "Skin Formula 9 Skin Perfecting Vitamin C Serum", size: "50 ml", pv: 37.50, dp: 1800 },
    { code: "NP28017A", name: "Skin Formula 9 Hydrating Sunscreen Serum SPF 50 PA+++", size: "50 ml", pv: 37.50, dp: 1800 },
    { code: "NP23020A", name: "Assure Deep Cleanse Shampoo (Oily)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23021A", name: "Assure Moisture Rich Shampoo (D&D)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23022A", name: "Assure Daily Care Shampoo (Normal)", size: "200 ml", pv: 5.38, dp: 310 },
    { code: "NP23023A", name: "Assure Anti-Ageing Night Cream", size: "60 g", pv: 8.23, dp: 395 },
    { code: "NP23024A", name: "Assure Complete Fairness Cream", size: "50 g", pv: 5.21, dp: 300 },
    { code: "NP23029A", name: "Assure Sun Defense SPF 30+", size: "60 g", pv: 8.54, dp: 410 },
    { code: "NP23030A", name: "Assure Clarifying Face Wash", size: "60 g", pv: 5.52, dp: 265 },
    { code: "NP23033A", name: "Assure Aura Perfume Spray", size: "100 ml", pv: 16.25, dp: 780 },
  ];

  const now = new Date().toISOString();
  let seeded = 0;
  for (const p of seedData) {
    const existingCheck = await productsRef.where('code', '==', p.code).get();
    if (existingCheck.empty) {
      await productsRef.add({
        ...p,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      });
      seeded++;
    }
  }

  res.json({ message: `Seeded ${seeded} products`, total: seedData.length });
}));

router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
  const { confirm } = req.body;
  if (confirm !== true) {
    throw new AppError('Set confirm: true to reset all data');
  }

  const collections = ['products', 'portfolios', 'portfolioItems'];
  for (const name of collections) {
    const snapshot = await db.collection(name).get();
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  await settingsRef.doc('singleton').set(defaultSettings);
  res.json({ message: 'All data has been reset' });
}));

router.get('/backup', asyncHandler(async (req: Request, res: Response) => {
  const [products, portfolios, portfolioItems, settingsDoc] = await Promise.all([
    db.collection('products').get(),
    db.collection('portfolios').get(),
    db.collection('portfolioItems').get(),
    settingsRef.doc('singleton').get(),
  ]);

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: settingsDoc.exists ? settingsDoc.data() : defaultSettings,
    products: products.docs.map((d) => ({ id: d.id, ...d.data() })),
    portfolios: portfolios.docs.map((d) => ({ id: d.id, ...d.data() })),
    portfolioItems: portfolioItems.docs.map((d) => ({ id: d.id, ...d.data() })),
  };

  res.json(backup);
}));

router.post('/restore', asyncHandler(async (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.portfolios) || !Array.isArray(data.portfolioItems)) {
    throw new AppError('Invalid backup data format');
  }

  const BATCH_LIMIT = 500;

  const deleteCollection = async (name: string) => {
    const snapshot = await db.collection(name).get();
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + BATCH_LIMIT);
      for (const doc of chunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  };

  await Promise.all([
    deleteCollection('products'),
    deleteCollection('portfolios'),
    deleteCollection('portfolioItems'),
  ]);

  const restoreCollection = async (name: string, items: any[]) => {
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      const chunk = items.slice(i, i + BATCH_LIMIT);
      for (const item of chunk) {
        const { id, ...rest } = item;
        const docRef = db.collection(name).doc(id);
        batch.set(docRef, rest as DocData);
      }
      await batch.commit();
    }
  };

  await restoreCollection('products', data.products);
  await restoreCollection('portfolios', data.portfolios);
  await restoreCollection('portfolioItems', data.portfolioItems);

  if (data.settings) {
    await settingsRef.doc('singleton').set(data.settings);
  }

  res.json({ message: 'Data restored successfully' });
}));

export default router;
