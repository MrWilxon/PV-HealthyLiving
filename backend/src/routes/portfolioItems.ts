import { Router, Request, Response } from 'express';
import { db, DocData } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { calculateItemTotals, calculatePortfolioSummary } from '../utils/calculations';

const router = Router();
const portfoliosRef = db.collection('portfolios');
const portfolioItemsRef = db.collection('portfolioItems');
const productsRef = db.collection('products');

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

interface PortfolioData extends DocData {
  vatPercent: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  updatedAt: string;
}

interface ProductData extends DocData {
  name: string;
  code: string;
  size: string;
  pv: number | null;
  dp: number;
}

async function recalculatePortfolio(portfolioId: string) {
  const portfolioDoc = await portfoliosRef.doc(portfolioId).get();
  if (!portfolioDoc.exists) return;

  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', portfolioId).get();
  const items = itemsSnapshot.docs.map((d) => d.data() as PortfolioItemData);
  const portfolio = portfolioDoc.data() as PortfolioData;

  const summary = calculatePortfolioSummary(
    items.map((item) => ({ totalPV: item.totalPV, totalPrice: item.totalPrice })),
    portfolio.vatPercent
  );

  await portfoliosRef.doc(portfolioId).update({
    subtotal: summary.subtotal,
    vatAmount: summary.vatAmount,
    grandTotal: summary.grandTotal,
    updatedAt: new Date().toISOString(),
  });
}

router.post('/:portfolioId/items', asyncHandler(async (req: Request, res: Response) => {
  const portfolioId = String(req.params.portfolioId);
  const { productId, quantity, itemDate } = req.body;

  if (!productId) {
    throw new AppError('Product ID is required');
  }

  const portfolioDoc = await portfoliosRef.doc(portfolioId).get();
  if (!portfolioDoc.exists) {
    throw new AppError('Portfolio not found', 404);
  }

  const productDoc = await productsRef.doc(productId).get();
  if (!productDoc.exists) {
    throw new AppError('Product not found', 404);
  }

  const product = productDoc.data() as ProductData;
  const qty = quantity != null ? Number(quantity) : 1;
  if (isNaN(qty) || qty < 1) {
    throw new AppError('Quantity must be at least 1');
  }

  const pv = product.pv || 0;
  const dp = product.dp;
  const { totalPV, totalPrice } = calculateItemTotals(qty, pv, dp);

  const itemData: PortfolioItemData = {
    portfolioId,
    productId,
    productName: product.name,
    productCode: product.code,
    size: product.size,
    pv,
    dp,
    quantity: qty,
    totalPV,
    totalPrice,
    itemDate: itemDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  const docRef = await portfolioItemsRef.add(itemData);
  await recalculatePortfolio(portfolioId);

  const updatedPortfolio = await portfoliosRef.doc(portfolioId).get();
  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', portfolioId).get();

  res.status(201).json({
    item: { id: docRef.id, ...itemData },
    portfolio: {
      id: updatedPortfolio.id,
      ...updatedPortfolio.data(),
      items: itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
    },
  });
}));

router.put('/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { quantity, pv, dp, productName, productCode, size, itemDate } = req.body;

  const doc = await portfolioItemsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio item not found', 404);
  }

  const existing = doc.data() as PortfolioItemData;
  const newQty = quantity !== undefined ? Number(quantity) : existing.quantity;
  const newPv = pv !== undefined ? Number(pv) : existing.pv;
  const newDp = dp !== undefined ? Number(dp) : existing.dp;

  if (quantity !== undefined && (isNaN(newQty) || newQty < 1)) {
    throw new AppError('Quantity must be at least 1');
  }

  const { totalPV, totalPrice } = calculateItemTotals(newQty, newPv, newDp);

  const updateData: Partial<PortfolioItemData> = { totalPV, totalPrice };
  if (quantity !== undefined) updateData.quantity = newQty;
  if (pv !== undefined) updateData.pv = newPv;
  if (dp !== undefined) updateData.dp = newDp;
  if (productName !== undefined) updateData.productName = productName;
  if (productCode !== undefined) updateData.productCode = productCode;
  if (size !== undefined) updateData.size = size;
  if (itemDate !== undefined) updateData.itemDate = itemDate;

  await portfolioItemsRef.doc(id).update(updateData);
  await recalculatePortfolio(existing.portfolioId);

  const updatedItem = await portfolioItemsRef.doc(id).get();
  const updatedPortfolio = await portfoliosRef.doc(existing.portfolioId).get();
  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', existing.portfolioId).get();

  res.json({
    item: { id: updatedItem.id, ...updatedItem.data() },
    portfolio: {
      id: updatedPortfolio.id,
      ...updatedPortfolio.data(),
      items: itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
    },
  });
}));

router.delete('/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const doc = await portfolioItemsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Portfolio item not found', 404);
  }

  const existing = doc.data() as PortfolioItemData;
  await portfolioItemsRef.doc(id).delete();
  await recalculatePortfolio(existing.portfolioId);

  const updatedPortfolio = await portfoliosRef.doc(existing.portfolioId).get();
  const itemsSnapshot = await portfolioItemsRef.where('portfolioId', '==', existing.portfolioId).get();

  res.json({
    message: 'Item deleted',
    portfolio: {
      id: updatedPortfolio.id,
      ...updatedPortfolio.data(),
      items: itemsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PortfolioItemData) })),
    },
  });
}));

export default router;
