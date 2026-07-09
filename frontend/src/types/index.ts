export interface Product {
  id: string;
  code: string;
  name: string;
  size: string;
  pv: number | null;
  dp: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  date: string;
  vatPercent: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  status: 'draft' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  items: PortfolioItem[];
  _count?: { items: number };
}

export interface PortfolioItem {
  id: string;
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
  product?: Product;
}

export interface Settings {
  id: string;
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

export interface DashboardStats {
  totalProducts: number;
  totalPortfolios: number;
  totalPV: number;
  recentPortfolios: Portfolio[];
}
