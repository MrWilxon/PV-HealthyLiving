import { NextResponse } from 'next/server';

let portfolios: any[] = [];

export async function GET() {
  return NextResponse.json(portfolios);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newPortfolio = {
    id: `portfolio-${portfolios.length + 1}`,
    name: data.name || 'New Portfolio',
    date: data.date || new Date().toISOString(),
    vatPercent: data.vatPercent || 13,
    subtotal: 0,
    vatAmount: 0,
    grandTotal: 0,
    totalPV: 0,
    status: 'draft',
    items: [],
    _count: { items: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  portfolios.push(newPortfolio);
  return NextResponse.json(newPortfolio, { status: 201 });
}
