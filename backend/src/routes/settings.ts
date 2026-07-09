import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { adminMiddleware } from '../middleware/auth';

const router = Router();
const settingsRef = db.collection('settings');

const defaultSettings = {
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
    return res.json({ id: 'singleton', ...defaultSettings });
  }

  const data = doc.data()!;
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

  const updateData: any = {};
  if (defaultVatPercent !== undefined) updateData.defaultVatPercent = parseFloat(defaultVatPercent);
  if (currency !== undefined) updateData.currency = currency;
  if (decimalPlaces !== undefined) updateData.decimalPlaces = parseInt(decimalPlaces);
  if (defaultQuantity !== undefined) updateData.defaultQuantity = parseInt(defaultQuantity);
  if (autoSave !== undefined) updateData.autoSave = autoSave;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
  if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
  if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
  if (vatPresets !== undefined) updateData.vatPresets = vatPresets;

  if (Object.keys(updateData).length > 0) {
    await settingsRef.doc('singleton').update(updateData);
  }

  const updated = await settingsRef.doc('singleton').get();
  const updatedData = updated.data()!;
  res.json({ id: updated.id, ...defaultSettings, ...updatedData });
}));

router.post('/reset', adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { confirm } = req.body;
  if (confirm !== true) {
    return res.status(400).json({ error: { message: 'Set confirm: true to reset all data' } });
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
    products: products.docs.map((d: any) => ({ id: d.id, ...d.data() })),
    portfolios: portfolios.docs.map((d: any) => ({ id: d.id, ...d.data() })),
    portfolioItems: portfolioItems.docs.map((d: any) => ({ id: d.id, ...d.data() })),
  };

  res.json(backup);
}));

router.post('/restore', adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !data.products || !data.portfolios || !data.portfolioItems) {
    return res.status(400).json({ error: { message: 'Invalid backup data format' } });
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
