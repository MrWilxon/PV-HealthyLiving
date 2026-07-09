import { Router, Request, Response } from 'express';
import { db, DocData } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { calculatePortfolioSummary } from '../utils/calculations';

const router = Router();
const portfoliosRef = db.collection('portfolios');
const portfolioItemsRef = db.collection('portfolioItems');

interface PortfolioData extends DocData {
  name: string;
  date: string;
  vatPercent: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioItemData extends DocData {
  portfolioId: string;
  productId: string;
  productName: string;
  productCode: string;
  size: string;
  pv: number;
  dp: number;
  quantity: number;
  totalPV: number;
  totalPrice: number;
  itemDate: string;
  createdAt: string;
}

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  let query = portfoliosRef as any;

  if (status && typeof status === 'string') {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.orderBy('updatedAt', 'desc').get();
  const portfolios: Array<PortfolioData & { id: string; items: Array<{ id: string } & PortfolioItemData>; _count: { items: number } }> = [];

  for (const doc of snapshot.docs) {
    const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', doc.id).get();
    portfolios.push({
      id: doc.id,
      ...(doc.data() as PortfolioData),
      items: itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
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
  const items = itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) }));

  res.json({ id: doc.id, ...doc.data(), items });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, date, vatPercent } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('Portfolio name is required');
  }

  const vatNum = vatPercent !== undefined ? parseFloat(vatPercent) : 13;
  if (isNaN(vatNum) || vatNum < 0 || vatNum > 100) {
    throw new AppError('vatPercent must be a number between 0 and 100');
  }

  const portfolioData: PortfolioData = {
    name: name.trim(),
    date: date || new Date().toISOString().split('T')[0],
    vatPercent: vatNum,
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

  const updateData: Partial<PortfolioData> = {
    updatedAt: new Date().toISOString(),
  };

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) throw new AppError('Portfolio name cannot be empty');
    updateData.name = name.trim();
  }
  if (date !== undefined) updateData.date = date;
  if (vatPercent !== undefined) {
    const vatNum = parseFloat(vatPercent);
    if (isNaN(vatNum) || vatNum < 0 || vatNum > 100) throw new AppError('vatPercent must be between 0 and 100');
    updateData.vatPercent = vatNum;
  }
  if (status !== undefined) {
    const allowed = ['draft', 'completed', 'archived'];
    if (!allowed.includes(status)) throw new AppError(`status must be one of: ${allowed.join(', ')}`);
    updateData.status = status;
  }

  await portfoliosRef.doc(id).update(updateData);

  if (vatPercent !== undefined) {
    const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', id).get();
    const items = itemsSnapshot.docs.map((d) => d.data() as PortfolioItemData);
    const summary = calculatePortfolioSummary(
      items.map((item) => ({ totalPV: item.totalPV, totalPrice: item.totalPrice })),
      parseFloat(vatPercent)
    );

    await portfoliosRef.doc(id).update({
      subtotal: summary.subtotal,
      vatAmount: summary.vatAmount,
      grandTotal: summary.grandTotal,
    });
  }

  const updated = await portfoliosRef.doc(id).get();
  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', id).get();

  res.json({
    id: updated.id,
    ...updated.data(),
    items: itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
  });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await portfoliosRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', id).get();
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

  const existing = doc.data()! as PortfolioData;
  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', id).get();

  const now = new Date().toISOString();
  const newPortfolioData: PortfolioData = {
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
    const itemData = itemDoc.data() as PortfolioItemData;
    const { createdAt, ...rest } = itemData;
    await portfolioItemsRef.add({
      ...rest,
      portfolioId: newDocRef.id,
      createdAt: now,
    });
  }

  const newItemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', newDocRef.id).get();

  res.status(201).json({
    id: newDocRef.id,
    ...newPortfolioData,
    items: newItemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
  });
}));

export default router;
