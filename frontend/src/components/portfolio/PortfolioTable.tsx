'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Calendar, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { PortfolioItem } from '@/types';
import { QuantityControl } from './QuantityControl';
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

interface PortfolioTableProps {
  items: PortfolioItem[];
  currency?: string;
  editable?: boolean;
  vatPercent?: number;
}

interface MonthGroup {
  monthKey: string;
  label: string;
  items: PortfolioItem[];
  totalPV: number;
  subtotal: number;
}

function groupByMonth(items: PortfolioItem[]): MonthGroup[] {
  const groups: Record<string, PortfolioItem[]> = {};
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
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
      for (let i = 0; i < arr.length; i++) {
        tp += arr[i].totalPV;
        ts += arr[i].totalPrice;
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

// ── ItemRow (memoized – desktop) ──────────────────────────────────

interface ItemRowProps {
  item: PortfolioItem;
  sn: number;
  currency: string;
  editable: boolean;
  editingCell: { id: string; field: string } | null;
  onEdit: (id: string, field: string, val: string) => void;
  onBlur: (id: string, field: string, val: string) => void;
  onQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
}

const ItemRow = memo(function ItemRow({
  item, sn, currency, editable, editingCell, onEdit, onBlur, onQty, onDelete,
}: ItemRowProps) {
  const render = (field: string, value: string | number, isNum = false) => {
    if (!editable) return <span>{value}</span>;
    const active = editingCell?.id === item.id && editingCell.field === field;
    if (active) {
      return (
        <Input
          type={isNum ? 'number' : 'text'}
          step={isNum ? '0.01' : undefined}
          value={value}
          onChange={(e) => onEdit(item.id, field, e.target.value)}
          onBlur={(e) => onBlur(item.id, field, e.target.value)}
          className={`h-8 ${isNum ? 'w-20 text-right' : ''}`}
          autoFocus
        />
      );
    }
    return (
      <button
        onClick={() => onEdit(item.id, field, String(value))}
        className="text-left hover:bg-gray-50 px-1 rounded w-full group flex items-center gap-1"
      >
        <span className="flex-1 truncate">{value}</span>
        <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
    );
  };

    return (
    <TableRow className="group/row">
      <TableCell className="text-sm text-gray-400 w-10">{sn}</TableCell>
      <TableCell className="font-medium">{render('productName', item.productName)}</TableCell>
      <TableCell>{render('size', item.size)}</TableCell>
      <TableCell className="text-right">{render('pv', formatPV(item.pv), true)}</TableCell>
      <TableCell className="text-right">{render('dp', formatCurrency(item.dp, currency), true)}</TableCell>
      {editable && (
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
});

// ── ItemCard (memoized – mobile) ──────────────────────────────────

const ItemCard = memo(function ItemCard({
  item, sn, currency, editable, onQty, onDelete,
}: {
  item: PortfolioItem; sn: number; currency: string; editable: boolean;
  onQty: (id: string, q: number) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/70 border border-gray-100">
      <span className="text-xs text-gray-400 font-mono shrink-0 w-6 text-center">#{sn}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.productName}</div>
        <div className="text-xs text-gray-500">{item.size}</div>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <div className="text-sm font-medium">{formatCurrency(item.dp, currency)}</div>
        <div className="text-xs text-gray-500">{formatPV(item.pv)} PV</div>
      </div>
      {editable && (
        <div className="flex items-center gap-1 shrink-0">
          <QuantityControl value={item.quantity} onChange={(q) => onQty(item.id, q)} />
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </Button>
        </div>
      )}
    </div>
  );
});

// ── MonthSummary (memoized) ───────────────────────────────────────

const MonthSummary = memo(function MonthSummary({
  group, currency, vatPercent,
}: {
  group: MonthGroup; currency: string; vatPercent: number;
}) {
  const vatAmount = group.subtotal * (vatPercent / 100);
  const grandTotal = group.subtotal + vatAmount;

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <TrendingUp className="h-3.5 w-3.5" /> Total PV
        </span>
        <span className="font-semibold text-blue-600">{formatPV(group.totalPV)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <DollarSign className="h-3.5 w-3.5" /> Subtotal
        </span>
        <span className="font-medium">{formatCurrency(group.subtotal, currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <Percent className="h-3.5 w-3.5" /> VAT ({vatPercent}%)
        </span>
        <span className="font-medium">{formatCurrency(vatAmount, currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
        <span className="font-semibold">Grand Total</span>
        <span className="font-bold text-green-600">{formatCurrency(grandTotal, currency)}</span>
      </div>
    </div>
  );
});

// ── MonthCard (memoized) ──────────────────────────────────────────

interface MonthCardProps {
  group: MonthGroup;
  startSn: number;
  currency: string;
  editable: boolean;
  vatPercent: number;
  editingCell: { id: string; field: string } | null;
  onEdit: (id: string, field: string, val: string) => void;
  onBlur: (id: string, field: string, val: string) => void;
  onQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
}

const MonthCard = memo(function MonthCard({
  group, startSn, currency, editable, vatPercent, editingCell,
  onEdit, onBlur, onQty, onDelete,
}: MonthCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-800">{group.label}</span>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            {group.items.length}
          </span>
        </div>
        <div className="text-sm font-semibold text-gray-700">
          {formatCurrency(group.subtotal, currency)}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-gray-400">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-20">Size</TableHead>
                <TableHead className="w-16 text-right">PV</TableHead>
                <TableHead className="w-24 text-right">Price</TableHead>
                {editable && <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  sn={startSn + idx}
                  currency={currency}
                  editable={editable}
                  editingCell={editingCell}
                  onEdit={onEdit}
                  onBlur={onBlur}
                  onQty={onQty}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden p-3 space-y-2">
          {group.items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              sn={startSn + idx}
              currency={currency}
              editable={editable}
              onQty={onQty}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* Per-month summary */}
      <MonthSummary group={group} currency={currency} vatPercent={vatPercent} />
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────

export function PortfolioTable({ items, currency = 'NPR', editable = true, vatPercent = 0 }: PortfolioTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const monthGroups = useMemo(() => groupByMonth(items), [items]);

  const { updateItemLocally, updateItem, deleteItem } = usePortfolioStore();
  const { toast } = useToast();

  const numericFields = useMemo(() => new Set(['pv', 'dp', 'quantity', 'totalPV', 'totalPrice']), []);

  const parseValue = useCallback((field: string, val: string) => {
    return numericFields.has(field) ? (parseFloat(val) || 0) : val;
  }, [numericFields]);

  const handleQty = useCallback((id: string, qty: number) => {
    updateItemLocally(id, { quantity: qty });
    updateItem(id, { quantity: qty });
  }, [updateItemLocally, updateItem]);

  const handleEdit = useCallback((id: string, field: string, val: string) => {
    updateItemLocally(id, { [field]: parseValue(field, val) });
  }, [updateItemLocally, parseValue]);

  const handleBlur = useCallback(async (id: string, field: string, val: string) => {
    setEditingCell(null);
    try { await updateItem(id, { [field]: parseValue(field, val) }); } catch { toast('Update failed', 'error'); }
  }, [updateItem, toast, parseValue]);

  const handleDelete = useCallback(async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await deleteItem(deleteItemId);
      toast('Product removed', 'success');
      setDeleteItemId(null);
    } catch { toast('Remove failed', 'error'); } finally { setIsDeleting(false); }
  }, [deleteItemId, deleteItem, toast]);

  const onDeleteRow = useCallback((id: string) => setDeleteItemId(id), []);

  const snOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (const g of monthGroups) {
      offsets.push(running);
      running += g.items.length;
    }
    return offsets;
  }, [monthGroups]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No products added yet.</p>
        <p className="text-sm text-gray-400 mt-1">Use the button above to add products.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {monthGroups.map((group, i) => (
          <MonthCard
            key={group.monthKey}
            group={group}
            startSn={snOffsets[i] + 1}
            currency={currency}
            editable={editable}
            vatPercent={vatPercent}
            editingCell={editingCell}
            onEdit={handleEdit}
            onBlur={handleBlur}
            onQty={handleQty}
            onDelete={onDeleteRow}
          />
        ))}
      </div>

      <Dialog open={!!deleteItemId} onOpenChange={() => !isDeleting && setDeleteItemId(null)}>
        <DialogContent>
          <DialogClose onClose={() => !isDeleting && setDeleteItemId(null)} />
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
            <DialogDescription>Remove this product from the portfolio?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemId(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
