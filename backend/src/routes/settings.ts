import { Router, Request, Response } from 'express';
import { db, DocData } from '../config/firebase';
import { asyncHandler, AppError } from '../middleware/errorHandler';

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

  const collections = ['products', 'portfolios', 'portfolioItems'];
  for (const name of collections) {
    const snapshot = await db.collection(name).get();
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  for (const item of data.products) {
    const { id, ...rest } = item;
    await db.collection('products').doc(id).set(rest);
  }
  for (const item of data.portfolios) {
    const { id, ...rest } = item;
    await db.collection('portfolios').doc(id).set(rest);
  }
  for (const item of data.portfolioItems) {
    const { id, ...rest } = item;
    await db.collection('portfolioItems').doc(id).set(rest);
  }

  if (data.settings) {
    await settingsRef.doc('singleton').set(data.settings);
  }

  res.json({ message: 'Data restored successfully' });
}));

export default router;
