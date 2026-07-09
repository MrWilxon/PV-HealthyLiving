'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Trash2, TrendingUp, Printer } from 'lucide-react';
import { Product } from '@/types';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatPV } from '@/lib/utils';
import { PortfolioSummary } from './PortfolioSummary';
import { AddProductDialog } from './AddProductDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogClose } from '@/components/ui/dialog';

interface PortfolioDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string | null;
}

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

interface MonthGroup {
  key: string;
  label: string;
  items: any[];
  totalPV: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}

export function PortfolioDetailDialog({ open, onOpenChange, portfolioId }: PortfolioDetailDialogProps) {
  const { currentPortfolio, fetchPortfolio, deleteItem, addItem } = usePortfolioStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  useEffect(() => {
    if (open && portfolioId) {
      fetchPortfolio(portfolioId);
      fetchSettings();
    }
  }, [open, portfolioId, fetchPortfolio, fetchSettings]);

  const handleAddItem = async (product: Product, itemDate: string, quantity: number) => {
    if (!currentPortfolio) return;
    try {
      await addItem(currentPortfolio.id, product.id, quantity, itemDate);
      toast(`Added ${product.name} to portfolio`, 'success');
      await fetchPortfolio(currentPortfolio.id);
    } catch {
      toast('Failed to add item', 'error');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId || !currentPortfolio) return;
    try {
      await deleteItem(currentPortfolio.id, deleteItemId);
      toast('Item deleted', 'success');
      setDeleteItemId(null);
      await fetchPortfolio(currentPortfolio.id);
    } catch {
      toast('Failed to delete item', 'error');
    }
  };

  const monthGroups = (currentPortfolio?.items || []).reduce((groups: MonthGroup[], item) => {
    const dateStr = item.itemDate || item.createdAt;
    const key = getMonthKey(dateStr);

    let group = groups.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        label: getMonthLabel(key),
        items: [],
        totalPV: 0,
        subtotal: 0,
        vatAmount: 0,
        grandTotal: 0,
      };
      groups.push(group);
    }

    group.items.push(item);
    group.totalPV += item.totalPV || 0;
    group.subtotal += item.totalPrice || 0;

    return groups;
  }, []);

  monthGroups.forEach(group => {
    group.vatAmount = group.subtotal * ((currentPortfolio?.vatPercent || 13) / 100);
    group.grandTotal = group.subtotal + group.vatAmount;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{currentPortfolio?.name || 'Portfolio Details'}</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-6">
            {monthGroups.map((group) => (
              <Card key={group.key} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">{group.label}</h2>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {group.items.length}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(group.subtotal)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">PV</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-gray-500">{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell className="text-right">{formatPV(item.pv)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.dp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Total PV</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{formatPV(group.totalPV)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(group.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">VAT (13%)</span>
                      <span className="text-sm font-medium">{formatCurrency(group.vatAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <span className="text-base font-bold text-gray-900">GRAND TOTAL</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(group.grandTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={() => setAddDialogOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
          <div>
            <PortfolioSummary currency={settings?.currency || 'NPR'} />
          </div>
        </div>
      </DialogContent>

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSelect={handleAddItem}
        selectedProductIds={currentPortfolio?.items.map((item) => item.productId) || []}
        currency={settings?.currency || 'NPR'}
      />

      <Dialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Are you sure you want to delete this item?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteItemId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
