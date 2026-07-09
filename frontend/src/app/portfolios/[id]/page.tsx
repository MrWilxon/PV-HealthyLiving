'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { AddProductDialog } from '@/components/portfolio/AddProductDialog';
import { AnalyticsDialog } from '@/components/portfolio/AnalyticsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Printer, Calendar, Plus, BarChart3, TrendingUp, Pencil, Copy, Trash2, Download } from 'lucide-react';
import { SkeletonMonthCard } from '@/components/ui/skeleton';
import { Product } from '@/types';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatPV } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

export default function PortfolioDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { currentPortfolio, isLoading, fetchPortfolio, updatePortfolio, addItem, deletePortfolio } = usePortfolioStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddItem = async (product: Product, itemDate: string, quantity: number) => {
    if (!currentPortfolio) return;
    try {
      await addItem(currentPortfolio.id, product.id, quantity, itemDate);
      toast(`Added ${product.name} to portfolio`, 'success');
    } catch {
      toast('Failed to add item', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !currentPortfolio) return;
    setIsDeleting(true);
    try {
      await deletePortfolio(currentPortfolio.id);
      toast('Portfolio deleted', 'success');
      router.push('/portfolios');
    } catch {
      toast('Failed to delete portfolio', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDuplicate = async () => {
    if (!currentPortfolio) return;
    try {
      const { duplicatePortfolio } = usePortfolioStore.getState();
      await duplicatePortfolio(currentPortfolio.id);
      toast('Portfolio duplicated', 'success');
    } catch {
      toast('Failed to duplicate portfolio', 'error');
    }
  };

  useEffect(() => {
    if (id) {
      fetchPortfolio(id);
    }
    fetchSettings();
  }, [id, fetchPortfolio, fetchSettings]);

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SkeletonMonthCard />
            <SkeletonMonthCard />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentPortfolio) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Portfolio not found</p>
          <Button className="mt-4" onClick={() => router.push('/portfolios')}>
            Back to Portfolios
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="print-only" style={{ display: 'none' }}>
        <h1>Portfolio: {currentPortfolio.name}</h1>
        <p>Date: {currentPortfolio.date || 'N/A'}</p>
      </div>
      <div className="space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentPortfolio.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4" />
                {formatDate(currentPortfolio.date || currentPortfolio.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAnalyticsDialogOpen(true)}>
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" onClick={() => {
              const data = {
                ...currentPortfolio,
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `portfolio-${currentPortfolio.name.replace(/\s+/g, '-').toLowerCase()}-${currentPortfolio.date || 'undated'}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/portfolios/${currentPortfolio?.id}/edit?month=${group.key}`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDuplicate}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(currentPortfolio.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
          <div>
            <PortfolioSummary currency={settings?.currency || 'NPR'} />
          </div>
        </div>
      </div>

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSelect={handleAddItem}
        selectedProductIds={currentPortfolio.items.map((item) => item.productId)}
        currency={settings?.currency || 'NPR'}
      />

      <AnalyticsDialog
        open={analyticsDialogOpen}
        onOpenChange={setAnalyticsDialogOpen}
        items={currentPortfolio.items}
        currency={settings?.currency || 'NPR'}
      />

      <Dialog open={!!deleteId} onOpenChange={() => !isDeleting && setDeleteId(null)}>
        <DialogContent>
          <DialogClose onClose={() => !isDeleting && setDeleteId(null)} />
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
