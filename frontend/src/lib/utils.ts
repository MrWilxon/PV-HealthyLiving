import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'NPR'): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPV(pv: number): string {
  return pv.toFixed(2);
}

export function calculateItemTotals(qty: number, pv: number, dp: number) {
  return {
    totalPV: qty * pv,
    totalPrice: qty * dp,
  };
}

export function calculatePortfolioSummary(
  items: Array<{ totalPV: number; totalPrice: number }>,
  vatPercent: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPV = items.reduce((sum, item) => sum + item.totalPV, 0);
  const vatAmount = subtotal * (vatPercent / 100);
  const grandTotal = subtotal + vatAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalPV: Math.round(totalPV * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    itemCount: items.length,
  };
}
