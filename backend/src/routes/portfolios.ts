import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { calculatePortfolioSummary } from '../utils/calculations';

const router = Router();
const portfoliosRef = db.collection('portfolios');
const portfolioItemsRef = db.collection('portfolioItems');

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  let query: any = portfoliosRef;

  if (status && typeof status === 'string') {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.orderBy('updatedAt', 'desc').get();
  const portfolios: any[] = [];

  for (const doc of snapshot.docs) {
    const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', doc.id).get();
    portfolios.push({
      id: doc.id,
      ...doc.data(),
      items: itemsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      _count: { items: itemsSnapshot.size },
    });
  }

  res.json(portfolios);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await portfoliosRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', id).get();
  const items = itemsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

  res.json({ id: doc.id, ...doc.data(), items });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, date, vatPercent } = req.body;

  if (!name) {
    throw new AppError('Portfolio name is required');
  }

  const portfolioData = {
    name,
    date: date || new Date().toISOString().split('T')[0],
    vatPercent: vatPercent !== undefined ? parseFloat(vatPercent) : 13,
    subtotal: 0,
    vatAmount: 0,
    grandTotal: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await portfoliosRef.add(portfolioData);
  res.status(201).json({ id: docRef.id, ...portfolioData, items: [] });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { name, date, vatPercent, status } = req.body;

  const doc = await portfoliosRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (name) updateData.name = name;
  if (date !== undefined) updateData.date = date;
  if (vatPercent !== undefined) updateData.vatPercent = parseFloat(vatPercent);
  if (status) updateData.status = status;

  await portfoliosRef.doc(id).update(updateData);

  if (vatPercent !== undefined) {
    const itemsSnapshot = await portfolioItemsRef
      .where('portfolioId', '==', id)
      .get();

    const items = itemsSnapshot.docs.map((d: any) => d.data());
    const summary = calculatePortfolioSummary(
      items.map((item: any) => ({ totalPV: item.totalPV, totalPrice: item.totalPrice })),
      parseFloat(vatPercent)
    );

    await portfoliosRef.doc(id).update({
      subtotal: summary.subtotal,
      vatAmount: summary.vatAmount,
      grandTotal: summary.grandTotal,
    });
  }

  const updated = await portfoliosRef.doc(id).get();
  const itemsSnapshot = await portfolioItemsRef
    .where('portfolioId', '==', id)
    .get();

  res.json({
    id: updated.id,
    ...updated.data(),
    items: itemsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })),
  });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await portfoliosRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const itemsSnapshot = await portfolioItemsRef
    .where('portfolioId', '==', id)
    .get();

  const batch = db.batch();
  for (const itemDoc of itemsSnapshot.docs) {
    batch.delete(itemDoc.ref);
  }
  batch.delete(portfoliosRef.doc(id));
  await batch.commit();

  res.json({ message: 'Portfolio deleted' });
}));

router.post('/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await portfoliosRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const existing = doc.data()!;
  const itemsSnapshot = await portfolioItemsRef
    .where('portfolioId', '==', id)
    .get();

  const now = new Date().toISOString();
  const newPortfolioData = {
    name: `${existing.name} (Copy)`,
    date: existing.date || new Date().toISOString().split('T')[0],
    vatPercent: existing.vatPercent,
    subtotal: existing.subtotal,
    vatAmount: existing.vatAmount,
    grandTotal: existing.grandTotal,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const newDocRef = await portfoliosRef.add(newPortfolioData);

  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const { createdAt, ...rest } = itemData;
    await portfolioItemsRef.add({
      ...rest,
      portfolioId: newDocRef.id,
      createdAt: now,
    });
  }

  const newItemsSnapshot = await portfolioItemsRef
    .where('portfolioId', '==', newDocRef.id)
    .get();

  res.status(201).json({
    id: newDocRef.id,
    ...newPortfolioData,
    items: newItemsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })),
  });
}));

export default router;
