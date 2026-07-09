import { NextResponse } from 'next/server';

const productData = [
  { code: "NP23087A", name: "Assure Active (Deo for Men)", size: "150 ml", pv: 6.77, dp: 390, isFavorite: false, categoryName: "Assure" },
  { code: "NP23023A", name: "Assure Anti-Ageing Night Cream", size: "60 g", pv: 8.23, dp: 395, isFavorite: false, categoryName: "Assure" },
  { code: "NP23094", name: "Assure Anti-Hairfall Bounce Restore Shampoo", size: "150 ml", pv: 6.94, dp: 400, isFavorite: false, categoryName: "Assure" },
  { code: "NP23033A", name: "Assure Aura Perfume Spray", size: "100 ml", pv: 16.25, dp: 780, isFavorite: false, categoryName: "Assure" },
  { code: "NP23016A", name: "Assure BB Cream", size: "30 g", pv: 14.58, dp: 700, isFavorite: false, categoryName: "Assure" },
  { code: "NP24007", name: "Dentassure Gano Toothpaste", size: "100 g", pv: 5.42, dp: 260, isFavorite: false, categoryName: "Dentassure" },
  { code: "NP20025", name: "Vestige Amla", size: "60 capsules", pv: 7.29, dp: 350, isFavorite: false, categoryName: "Health Care" },
  { code: "NP21026A", name: "Vestige Collagen", size: "7.5 x 10 g", pv: 27.09, dp: 1300, isFavorite: false, categoryName: "Health Care" },
  { code: "NP22042C", name: "Lite House Rice Bran Oil", size: "2 L", pv: 8.42, dp: 970, isFavorite: false, categoryName: "Consumables" },
];

let products = productData.map((p, i) => ({
  id: `product-${i + 1}`,
  ...p,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json(products);
  }

  const query = q.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.code.toLowerCase().includes(query) ||
    p.categoryName.toLowerCase().includes(query)
  );

  return NextResponse.json(filtered);
}
