import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();
const productsRef = db.collection('products');

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    throw new AppError('Search query is required');
  }

  const snapshot = await productsRef.get();
  const products: any[] = [];
  const query = q.toLowerCase();

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    if (
      data.code?.toLowerCase().includes(query) ||
      data.name?.toLowerCase().includes(query) ||
      data.size?.toLowerCase().includes(query)
    ) {
      products.push({ id: doc.id, ...data });
    }
  });

  products.sort((a: any, b: any) => a.name?.localeCompare(b.name));
  res.json(products);
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { minPv, maxPv, minPrice, maxPrice, favorite, page, limit, sortBy, sortOrder, size, hasPv } = req.query;

  const snapshot = await productsRef.get();
  let products: any[] = [];

  snapshot.forEach((doc: any) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  if (minPv) {
    products = products.filter((p) => p.pv >= parseFloat(minPv as string));
  }
  if (maxPv) {
    products = products.filter((p) => p.pv <= parseFloat(maxPv as string));
  }
  if (minPrice) {
    products = products.filter((p) => p.dp >= parseFloat(minPrice as string));
  }
  if (maxPrice) {
    products = products.filter((p) => p.dp <= parseFloat(maxPrice as string));
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

  products.sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'pv' || sortField === 'dp') {
      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });

  const total = products.length;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
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
    throw new AppError('Missing required fields');
  }

  const existing = await productsRef.where('code', '==', code).get();
  if (!existing.empty) {
    throw new AppError('Product code already exists');
  }

  const productData = {
    code,
    name,
    size,
    pv: pv !== undefined && pv !== null ? parseFloat(pv) : null,
    dp: parseFloat(dp),
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

  const existing = doc.data()!;

  if (code && code !== existing.code) {
    const codeCheck = await productsRef.where('code', '==', code).get();
    if (!codeCheck.empty) {
      throw new AppError('Product code already exists');
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (size !== undefined) updateData.size = size;
  if (pv !== undefined) updateData.pv = pv === null ? null : parseFloat(pv);
  if (dp !== undefined) updateData.dp = parseFloat(dp);
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

  const current = doc.data()!;
  await productsRef.doc(id).update({
    isFavorite: !current.isFavorite,
    updatedAt: new Date().toISOString(),
  });

  const updated = await productsRef.doc(id).get();
  res.json({ id: updated.id, ...updated.data() });
}));

export default router;
