'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp, Package, Calendar } from 'lucide-react';
import { PortfolioItem } from '@/types';
import { formatCurrency, formatPV } from '@/lib/utils';

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AnalyticsDialog({ open, onOpenChange, items, currency = 'NPR' }: AnalyticsDialogProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    items.forEach((item) => {
      const date = new Date(item.itemDate || item.createdAt);
      yearSet.add(date.getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [items]);

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const date = new Date(item.itemDate || item.createdAt);
      const itemYear = date.getFullYear();
      const itemMonth = date.getMonth() + 1;

      if (selectedYear !== 'all' && itemYear !== parseInt(selectedYear)) return false;
      if (selectedMonth !== 'all' && itemMonth !== parseInt(selectedMonth)) return false;
      return true;
    });
  }, [items, selectedYear, selectedMonth]);

  const monthlyData = useMemo(() => {
    const groups: Record<string, PortfolioItem[]> = {};

    filteredItems.forEach((item) => {
      const dateStr = item.itemDate || item.createdAt;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });

    const monthsData: MonthlyData[] = Object.entries(groups)
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

    return monthsData;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const totalPV = filteredItems.reduce((sum, item) => sum + item.totalPV, 0);
    const totalSpent = filteredItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const uniqueProducts = new Set(filteredItems.map((item) => item.productId)).size;
    const avgPerMonth = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;
    return { totalPV, totalSpent, uniqueProducts, avgPerMonth };
  }, [filteredItems, monthlyData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Analytics
          </DialogTitle>
          <DialogDescription>
            View detailed analytics and insights
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-1.5">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No data for selected period</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Months</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700">{monthlyData.length}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-orange-600 mb-1">
                    <span className="text-xs font-medium">Avg/Month</span>
                  </div>
                  <p className="text-lg font-bold text-orange-700">{formatCurrency(stats.avgPerMonth, currency)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Monthly Breakdown
                </h4>
                <div className="space-y-3 max-h-64 overflow-auto pr-2">
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
