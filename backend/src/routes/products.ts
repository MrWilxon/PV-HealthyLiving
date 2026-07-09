import { Router, Request, Response } from 'express';
import { db, DocData } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();
const productsRef = db.collection('products');

interface ProductData extends DocData {
  code: string;
  name: string;
  size: string;
  pv: number | null;
  dp: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    throw new AppError('Search query is required');
  }

  const snapshot = await productsRef.get();
  const products: Array<{ id: string } & ProductData> = [];
  const query = q.toLowerCase();

  snapshot.forEach((doc) => {
    const data = doc.data() as ProductData;
    if (
      data.code?.toLowerCase().includes(query) ||
      data.name?.toLowerCase().includes(query) ||
      data.size?.toLowerCase().includes(query)
    ) {
      products.push({ id: doc.id, ...data });
    }
  });

  products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  res.json(products);
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { minPv, maxPv, minPrice, maxPrice, favorite, page, limit, sortBy, sortOrder, size, hasPv } = req.query;

  const snapshot = await productsRef.get();
  let products: Array<{ id: string } & ProductData> = [];

  snapshot.forEach((doc) => {
    products.push({ id: doc.id, ...(doc.data() as ProductData) });
  });

  if (minPv) {
    const val = parseFloat(minPv as string);
    if (!isNaN(val)) products = products.filter((p) => (p.pv ?? 0) >= val);
  }
  if (maxPv) {
    const val = parseFloat(maxPv as string);
    if (!isNaN(val)) products = products.filter((p) => (p.pv ?? 0) <= val);
  }
  if (minPrice) {
    const val = parseFloat(minPrice as string);
    if (!isNaN(val)) products = products.filter((p) => p.dp >= val);
  }
  if (maxPrice) {
    const val = parseFloat(maxPrice as string);
    if (!isNaN(val)) products = products.filter((p) => p.dp <= val);
  }
  if (favorite === 'true') {
    products = products.filter((p) => p.isFavorite === true);
  }
  if (size && typeof size === 'string') {
    const sizes = size.split(',').map((s) => s.trim().toLowerCase());
    products = products.filter((p) => sizes.includes(p.size?.toLowerCase()));
  }
  if (hasPv === 'true') {
    products = products.filter((p) => p.pv !== null && p.pv !== undefined);
  }
  if (hasPv === 'false') {
    products = products.filter((p) => p.pv === null || p.pv === undefined);
  }

  const sortField = (sortBy as string) || 'name';
  const order = sortOrder === 'desc' ? -1 : 1;

  products.sort((a, b) => {
    let aVal: string | number | null | undefined = a[sortField as keyof ProductData] as string | number | null | undefined;
    let bVal: string | number | null | undefined = b[sortField as keyof ProductData] as string | number | null | undefined;

    if (sortField === 'pv' || sortField === 'dp') {
      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
    }

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });

  const total = products.length;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.max(1, parseInt(limit as string) || 10);
  const totalPages = Math.ceil(total / limitNum);
  const start = (pageNum - 1) * limitNum;
  const paginated = products.slice(start, start + limitNum);

  res.json({ products: paginated, total, page: pageNum, limit: limitNum, totalPages });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await productsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Product not found', 404);
  }
  res.json({ id: doc.id, ...doc.data() });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { code, name, size, pv, dp } = req.body;

  if (!code || !name || !size || dp === undefined) {
    throw new AppError('Missing required fields: code, name, size, dp');
  }

  const dpNum = parseFloat(dp);
  if (isNaN(dpNum)) {
    throw new AppError('dp must be a valid number');
  }

  const existing = await productsRef.where('code', '==', code).get();
  if (!existing.empty) {
    throw new AppError('Product code already exists');
  }

  const productData: ProductData = {
    code,
    name,
    size,
    pv: pv !== undefined && pv !== null ? parseFloat(pv) : null,
    dp: dpNum,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await productsRef.add(productData);
  res.status(201).json({ id: docRef.id, ...productData });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { code, name, size, pv, dp, isFavorite } = req.body;

  const doc = await productsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Product not found', 404);
  }

  const existing = doc.data()! as ProductData;

  if (code && code !== existing.code) {
    const codeCheck = await productsRef.where('code', '==', code).get();
    if (!codeCheck.empty) {
      throw new AppError('Product code already exists');
    }
  }

  const updateData: Partial<ProductData> = {
    updatedAt: new Date().toISOString(),
  };

  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (size !== undefined) updateData.size = size;
  if (pv !== undefined) updateData.pv = pv === null ? null : parseFloat(pv);
  if (dp !== undefined) {
    const dpNum = parseFloat(dp);
    if (isNaN(dpNum)) throw new AppError('dp must be a valid number');
    updateData.dp = dpNum;
  }
  if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

  await productsRef.doc(id).update(updateData);
  const updated = await productsRef.doc(id).get();

  res.json({ id: updated.id, ...updated.data() });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await productsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Product not found', 404);
  }

  await productsRef.doc(id).delete();
  res.json({ message: 'Product deleted' });
}));

router.put('/:id/favorite', asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const doc = await productsRef.doc(id).get();
  if (!doc.exists) {
    throw new AppError('Product not found', 404);
  }

  const current = doc.data()! as ProductData;
  await productsRef.doc(id).update({
    isFavorite: !current.isFavorite,
    updatedAt: new Date().toISOString(),
  });

  const updated = await productsRef.doc(id).get();
  res.json({ id: updated.id, ...updated.data() });
}));

export default router;
