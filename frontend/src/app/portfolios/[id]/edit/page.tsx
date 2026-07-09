'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { AddProductDialog } from '@/components/portfolio/AddProductDialog';
import { QuantityControl } from '@/components/portfolio/QuantityControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Check,
  Plus,
  Calendar,
  Trash2,
  TrendingUp,
  DollarSign,
  Percent,
  Package,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/components/ui/toast';
import { Product, PortfolioItem } from '@/types';
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

interface MonthGroup {
  monthKey: string;
  label: string;
  items: PortfolioItem[];
  totalPV: number;
  subtotal: number;
}

function groupByMonth(items: PortfolioItem[]): MonthGroup[] {
  const groups: Record<string, PortfolioItem[]> = {};
  for (const item of items) {
    const dateStr = item.itemDate || item.createdAt;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups)
    .map(([key, arr]) => {
      const [y, m] = key.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1);
      let tp = 0, ts = 0;
      for (const item of arr) {
        tp += item.totalPV;
        ts += item.totalPrice;
      }
      return {
        monthKey: key,
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        items: arr,
        totalPV: tp,
        subtotal: ts,
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

interface EditableCellProps {
  value: string | number;
  field: string;
  itemId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  type?: 'text' | 'number';
  prefix?: string;
  className?: string;
  min?: number;
  max?: number;
}

function EditableCell({
  value,
  field,
  itemId,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  type = 'text',
  prefix = '',
  className = '',
  min,
  max,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(String(value));
  const savedRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      setEditValue(String(value));
      savedRef.current = false;
    }
  }, [isEditing, value]);

  const handleSave = () => {
    if (savedRef.current) return;
    savedRef.current = true;

    if (type === 'number') {
      const num = parseFloat(editValue);
      if (isNaN(num)) {
        setEditValue(String(value));
        return;
      }
      if (min !== undefined && num < min) {
        setEditValue(String(min));
        onSave(String(min));
        return;
      }
      if (max !== undefined && num > max) {
        setEditValue(String(max));
        onSave(String(max));
        return;
      }
    }
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`h-8 ${type === 'number' ? 'w-24 text-right' : ''}`}
          autoFocus
          step={type === 'number' ? '0.01' : undefined}
          min={min}
          max={max}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSave}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className={`text-left hover:bg-gray-100 px-2 py-1 rounded group flex items-center gap-1 min-w-[80px] ${className}`}
    >
      <span className="flex-1 truncate">
        {prefix}{typeof value === 'number' ? formatPV(value) : value}
      </span>
      <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const monthParam = searchParams.get('month');
  const validMonthParam = monthParam && monthParam !== 'undefined' && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : null;

  const {
    currentPortfolio,
    isLoading,
    fetchPortfolio,
    updatePortfolio,
    addItem,
    updateItem,
    deleteItem,
  } = usePortfolioStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [localDate, setLocalDate] = useState('');
  const dateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchPortfolio(id);
    }
    fetchSettings();
  }, [id, fetchPortfolio, fetchSettings]);

  const monthGroups = useMemo(
    () => (currentPortfolio ? groupByMonth(currentPortfolio.items) : []),
    [currentPortfolio?.items]
  );

  useEffect(() => {
    if (monthGroups.length === 0) return;

    if (validMonthParam) {
      const monthExists = monthGroups.some((g) => g.monthKey === validMonthParam);
      if (monthExists) {
        setSelectedMonth(validMonthParam);
      } else {
        setSelectedMonth(monthGroups[0].monthKey);
      }
    } else if (!selectedMonth) {
      setSelectedMonth(monthGroups[0].monthKey);
    }
  }, [monthGroups, selectedMonth, validMonthParam]);

  useEffect(() => {
    if (currentPortfolio?.date) {
      setLocalDate(currentPortfolio.date);
    }
  }, [currentPortfolio?.date]);

  useEffect(() => {
    return () => {
      if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    };
  }, []);

  const handleDateChange = (date: string) => {
    setLocalDate(date);
    if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    dateDebounceRef.current = setTimeout(async () => {
      if (currentPortfolio && date !== currentPortfolio.date) {
        try {
          await updatePortfolio(currentPortfolio.id, { date });
          toast('Date updated', 'success');
        } catch {
          toast('Failed to update date', 'error');
        }
      }
    }, 800);
  };

  const handleAddItem = async (product: Product, itemDate: string, quantity: number) => {
    if (!currentPortfolio) return;
    try {
      await addItem(currentPortfolio.id, product.id, quantity, itemDate);
      toast(`Added ${product.name} to portfolio`, 'success');
    } catch {
      toast('Failed to add item', 'error');
    }
  };

  const handleItemEdit = useCallback(
    async (itemId: string, field: string, value: string) => {
      try {
        const numFields = ['pv', 'dp'];
        if (numFields.includes(field)) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            await updateItem(itemId, { [field]: numValue });
          }
        } else {
          await updateItem(itemId, { [field]: value });
        }
      } catch {
        toast('Failed to update item', 'error');
      }
    },
    [updateItem, toast]
  );

  const handleQuantityChange = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        await updateItem(itemId, { quantity });
      } catch {
        toast('Failed to update quantity', 'error');
      }
    },
    [updateItem, toast]
  );

  const handleDelete = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await deleteItem(deleteItemId);
      toast('Product removed', 'success');
      setDeleteItemId(null);
    } catch {
      toast('Remove failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDone = () => {
    router.push(`/portfolios/${id}`);
  };

  const selectedGroup = monthGroups.find((g) => g.monthKey === selectedMonth);
  const currency = settings?.currency || 'NPR';
  const vatPercent = currentPortfolio?.vatPercent ?? 0;
  const isMonthMode = !!validMonthParam;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-sm text-gray-500">Loading portfolio...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentPortfolio) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Portfolio Not Found</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            The portfolio you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            onClick={() => router.push('/portfolios')}
            className="bg-gray-900 hover:bg-gray-800"
          >
            Back to Portfolios
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isMonthMode && selectedGroup
                    ? `Edit ${selectedGroup.label}`
                    : 'Edit Portfolio'}
                </h1>
                <p className="text-sm text-gray-500">{currentPortfolio.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button
                onClick={handleDone}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </div>

        {/* Date Picker - Only show when not in month mode */}
        {!isMonthMode && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 border border-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="portfolio-date" className="text-sm font-medium text-gray-700 block mb-1.5">
                  Portfolio Date
                </Label>
                <Input
                  id="portfolio-date"
                  type="date"
                  value={localDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left: Month Cards */}
          <div className="xl:col-span-3 space-y-6">
            {/* Month Tabs - Only show when not in month mode and multiple months */}
            {!isMonthMode && monthGroups.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {monthGroups.map((group) => (
                  <button
                    key={group.monthKey}
                    onClick={() => setSelectedMonth(group.monthKey)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all whitespace-nowrap ${
                      selectedMonth === group.monthKey
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{group.label}</span>
                    <span
                      className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium ${
                        selectedMonth === group.monthKey
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {group.items.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Month Card */}
            {selectedGroup && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Month Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedGroup.label}</h2>
                        <p className="text-sm text-gray-500">
                          {selectedGroup.items.length} product{selectedGroup.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedGroup.subtotal, currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Table with Inline Editing */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="w-12 text-gray-500 font-medium">#</TableHead>
                        <TableHead className="text-gray-500 font-medium">Product</TableHead>
                        <TableHead className="text-gray-500 font-medium">Size</TableHead>
                        <TableHead className="text-gray-500 font-medium">Qty</TableHead>
                        <TableHead className="text-right text-gray-500 font-medium">PV</TableHead>
                        <TableHead className="text-right text-gray-500 font-medium">Price</TableHead>
                        <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGroup.items.map((item, index) => (
                        <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                          <TableCell className="text-gray-400 font-mono text-sm">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              value={item.productName}
                              field="productName"
                              itemId={item.id}
                              isEditing={editingCell?.id === item.id && editingCell?.field === 'productName'}
                              onStartEdit={() => setEditingCell({ id: item.id, field: 'productName' })}
                              onSave={(val) => {
                                handleItemEdit(item.id, 'productName', val);
                                setEditingCell(null);
                              }}
                              onCancel={() => setEditingCell(null)}
                              className="font-medium text-gray-900 min-w-[180px]"
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              value={item.size}
                              field="size"
                              itemId={item.id}
                              isEditing={editingCell?.id === item.id && editingCell?.field === 'size'}
                              onStartEdit={() => setEditingCell({ id: item.id, field: 'size' })}
                              onSave={(val) => {
                                handleItemEdit(item.id, 'size', val);
                                setEditingCell(null);
                              }}
                              onCancel={() => setEditingCell(null)}
                              className="text-gray-600"
                            />
                          </TableCell>
                          <TableCell>
                            <QuantityControl
                              value={item.quantity}
                              onChange={(qty) => handleQuantityChange(item.id, qty)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <EditableCell
                              value={item.pv}
                              field="pv"
                              itemId={item.id}
                              isEditing={editingCell?.id === item.id && editingCell?.field === 'pv'}
                              onStartEdit={() => setEditingCell({ id: item.id, field: 'pv' })}
                              onSave={(val) => {
                                handleItemEdit(item.id, 'pv', val);
                                setEditingCell(null);
                              }}
                              onCancel={() => setEditingCell(null)}
                              type="number"
                              min={0}
                              className="font-medium text-blue-600 justify-end"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <EditableCell
                              value={item.dp}
                              field="dp"
                              itemId={item.id}
                              isEditing={editingCell?.id === item.id && editingCell?.field === 'dp'}
                              onStartEdit={() => setEditingCell({ id: item.id, field: 'dp' })}
                              onSave={(val) => {
                                handleItemEdit(item.id, 'dp', val);
                                setEditingCell(null);
                              }}
                              onCancel={() => setEditingCell(null)}
                              type="number"
                              min={0}
                              prefix={`${currency} `}
                              className="font-medium text-gray-900 justify-end"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItemId(item.id)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Month Summary Footer */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Total PV</p>
                        <p className="font-semibold text-blue-600">{formatPV(selectedGroup.totalPV)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="font-medium text-gray-900">{formatCurrency(selectedGroup.subtotal, currency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">VAT ({vatPercent}%)</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(selectedGroup.subtotal * (vatPercent / 100), currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Grand Total</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            selectedGroup.subtotal + selectedGroup.subtotal * (vatPercent / 100),
                            currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Product Button for this month */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    variant="outline"
                    className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product to {selectedGroup.label}
                  </Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {monthGroups.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-1">No products yet</p>
                <p className="text-sm text-gray-500 mb-4">Add products to get started</p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            )}
          </div>

          {/* Right: Summary Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-28">
              <PortfolioSummary currency={currency} />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItemId} onOpenChange={() => !isDeleting && setDeleteItemId(null)}>
        <DialogContent>
          <DialogClose onClose={() => !isDeleting && setDeleteItemId(null)} />
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this product from the portfolio?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItemId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSelect={handleAddItem}
        selectedProductIds={currentPortfolio.items.map((item) => item.productId)}
        currency={currency}
      />
    </MainLayout>
  );
}
