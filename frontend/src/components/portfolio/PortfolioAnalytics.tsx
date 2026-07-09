'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Calendar } from 'lucide-react';
import { PortfolioItem } from '@/types';
import { formatCurrency, formatPV } from '@/lib/utils';

interface PortfolioAnalyticsProps {
  items: PortfolioItem[];
  currency?: string;
}

interface MonthlyData {
  month: string;
  label: string;
  items: PortfolioItem[];
  totalPV: number;
  totalSpent: number;
  itemCount: number;
}

export function PortfolioAnalytics({ items, currency = 'NPR' }: PortfolioAnalyticsProps) {
  const monthlyData = useMemo(() => {
    const groups: Record<string, PortfolioItem[]> = {};

    items.forEach((item) => {
      const dateStr = item.itemDate || item.createdAt;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });

    const months: MonthlyData[] = Object.entries(groups)
      .map(([key, monthItems]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return {
          month: key,
          label,
          items: monthItems,
          totalPV: monthItems.reduce((sum, item) => sum + item.totalPV, 0),
          totalSpent: monthItems.reduce((sum, item) => sum + item.totalPrice, 0),
          itemCount: monthItems.length,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    return months;
  }, [items]);

  const stats = useMemo(() => {
    const totalPV = items.reduce((sum, item) => sum + item.totalPV, 0);
    const totalSpent = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const uniqueProducts = new Set(items.map((item) => item.productId)).size;
    const avgPerMonth = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;
    return { totalPV, totalSpent, uniqueProducts, avgPerMonth };
  }, [items, monthlyData]);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Add products to see analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Total PV</span>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatPV(stats.totalPV)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-green-600 mb-1">
              <Package className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Products</span>
            </div>
            <p className="text-lg font-bold text-green-700">{stats.uniqueProducts}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Monthly Breakdown
          </h4>
          <div className="space-y-3 max-h-64 overflow-auto">
            {monthlyData.map((month) => (
              <div key={month.month} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{month.label}</span>
                  <span className="text-xs text-gray-500">{month.itemCount} items</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">PV: </span>
                    <span className="font-medium">{formatPV(month.totalPV)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Spent: </span>
                    <span className="font-medium">{formatCurrency(month.totalSpent, currency)}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {month.items.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full truncate max-w-[120px]"
                      title={item.productName}
                    >
                      {item.productName}
                    </span>
                  ))}
                  {month.items.length > 5 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{month.items.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
