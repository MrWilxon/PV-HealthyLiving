import { NextResponse } from 'next/server';

let settings = {
  defaultVatPercent: 13,
  currency: 'NPR',
  decimalPlaces: 2,
  defaultQuantity: 1,
  autoSave: true,
};

export async function GET() {
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const data = await request.json();
  settings = { ...settings, ...data };
  return NextResponse.json(settings);
}
