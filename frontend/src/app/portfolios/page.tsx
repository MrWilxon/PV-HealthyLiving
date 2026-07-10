'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Eye, Trash2, Copy, AlertCircle, Check, X, Pencil, TrendingUp } from 'lucide-react';
import { SkeletonPortfolioCard } from '@/components/ui/skeleton';
import { Portfolio } from '@/types';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatPV } from '@/lib/utils';
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
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PortfoliosPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const {
    portfolios,
    isLoading,
    error,
    fetchPortfolios,
    deletePortfolio,
    duplicatePortfolio,
    updatePortfolio,
  } = usePortfolioStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deletePortfolio(deleteId);
      toast('Portfolio deleted', 'success');
      setDeleteId(null);
    } catch {
      toast('Failed to delete portfolio', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePortfolio(id);
      toast('Portfolio duplicated', 'success');
    } catch {
      toast('Failed to duplicate portfolio', 'error');
    }
  };

  const startEditing = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setEditValue(portfolio.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = async (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    try {
      await updatePortfolio(id, { name: trimmed });
      toast('Portfolio renamed', 'success');
      setEditingId(null);
      setEditValue('');
    } catch {
      toast('Failed to rename portfolio', 'error');
    }
  };

  const getPortfolioStats = (portfolio: Portfolio) => {
    const items = portfolio.items || [];
    const totalPV = items.reduce((sum, item) => sum + (item.totalPV || 0), 0);
    const subtotal = portfolio.subtotal || 0;
    const vatAmount = portfolio.vatAmount || 0;
    const grandTotal = portfolio.grandTotal || 0;
    return { totalPV, subtotal, vatAmount, grandTotal };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
            <p className="text-gray-500">{portfolios.length} portfolios</p>
          </div>
          <Button onClick={() => router.push('/portfolios/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Portfolio
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => fetchPortfolios()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPortfolioCard key={i} />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 mb-4">No portfolios yet</p>
            <Button onClick={() => router.push('/portfolios/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Portfolio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolios.map((portfolio) => {
              const stats = getPortfolioStats(portfolio);
              return (
                <Card key={portfolio.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {editingId === portfolio.id ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(portfolio.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="h-8 text-sm font-medium flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700"
                            onClick={() => saveEditing(portfolio.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900 truncate">{portfolio.name}</h2>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(portfolio);
                            }}
                            className="p-1 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] flex items-center justify-center lg:min-h-0 lg:min-w-0 lg:p-0.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                            aria-label={`Rename ${portfolio.name}`}
                          >
                            <Pencil className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(portfolio.date || portfolio.createdAt)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Total PV</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{formatPV(stats.totalPV)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(stats.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">VAT ({portfolio.vatPercent || 13}%)</span>
                      <span className="text-sm font-medium">{formatCurrency(stats.vatAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <span className="text-base font-bold text-gray-900">GRAND TOTAL</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(stats.grandTotal)}
                      </span>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <Button
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => router.push(`/portfolios/${portfolio.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(portfolio.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(portfolio.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
      </div>
    </MainLayout>
  );
}
