'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPV } from '@/lib/utils';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface MonthGroupData {
  items: any[];
  totalPV: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}

interface PortfolioSummaryProps {
  currency?: string;
  monthGroup?: MonthGroupData;
}

export function PortfolioSummary({ currency = 'NPR', monthGroup }: PortfolioSummaryProps) {
  const { currentPortfolio, updatePortfolio } = usePortfolioStore();
  const { settings } = useSettingsStore();
  const [customVat, setCustomVat] = useState('');
  const [isCustomVat, setIsCustomVat] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const vatPresets = (settings?.vatPresets || [0, 10, 13, 15]).map(String);

  useEffect(() => {
    if (currentPortfolio) {
      const vatStr = (currentPortfolio.vatPercent ?? 0).toString();
      const isPreset = vatPresets.includes(vatStr);
      if (!isPreset) {
        setIsCustomVat(true);
        setCustomVat(vatStr);
      } else {
        setIsCustomVat(false);
        setCustomVat('');
      }
    }
  }, [currentPortfolio?.vatPercent]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedUpdateVat = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      const newVat = parseFloat(value);
      if (!isNaN(newVat) && newVat >= 0 && newVat <= 100 && currentPortfolio) {
        await updatePortfolio(currentPortfolio.id, { vatPercent: newVat });
      }
    }, 500);
  }, [currentPortfolio?.id, updatePortfolio]);

  const handleVatChange = async (value: string) => {
    if (value === 'custom') {
      setIsCustomVat(true);
      return;
    }

    setIsCustomVat(false);
    const newVat = parseFloat(value);
    if (!isNaN(newVat) && currentPortfolio) {
      await updatePortfolio(currentPortfolio.id, { vatPercent: newVat });
    }
  };

  const handleCustomVatChange = (value: string) => {
    setCustomVat(value);
    debouncedUpdateVat(value);
  };

  if (!currentPortfolio) return null;

  const vatPercent = currentPortfolio.vatPercent || 13;

  const items = monthGroup?.items || currentPortfolio.items;
  const totalPV = monthGroup?.totalPV || items.reduce((sum, item) => sum + (item.totalPV || 0), 0);
  const subtotal = monthGroup?.subtotal || items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const vatAmount = subtotal * (vatPercent / 100);
  const grandTotal = subtotal + vatAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Portfolio Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </div>
          <span className="font-medium">{items.length}</span>
        </div>

        <div className="flex items-center justify-between py-3 bg-blue-50 -mx-6 px-6 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Total PV</span>
          </div>
          <span className="text-xl font-bold text-blue-700">{formatPV(totalPV)}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>Subtotal</span>
          </div>
          <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
        </div>

        <div className="py-2 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Percent className="h-4 w-4" />
              <span>VAT</span>
            </div>
          </div>
          <div className="space-y-2">
            <Select
              value={isCustomVat ? 'custom' : vatPercent.toString()}
              onValueChange={handleVatChange}
            >
              <SelectTrigger aria-label="VAT percentage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vatPresets.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}%
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {isCustomVat && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={customVat}
                  onChange={(e) => handleCustomVatChange(e.target.value)}
                  placeholder="Enter VAT %"
                  className="flex-1"
                  aria-label="Custom VAT percentage"
                />
                <span className="text-gray-500">%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-gray-600">VAT Amount</span>
          <span className="font-medium">{formatCurrency(vatAmount, currency)}</span>
        </div>

        <div className="flex items-center justify-between py-3 bg-gray-50 -mx-6 px-6 rounded-b-lg">
          <span className="text-lg font-bold">Grand Total</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
