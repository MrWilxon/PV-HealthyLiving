'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Star, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, formatPV } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (field !== sortBy) {
    return <span className="ml-1 text-gray-300">↕</span>;
  }
  return sortOrder === 'asc' ? (
    <ArrowUp className="inline h-3 w-3 ml-1" />
  ) : (
    <ArrowDown className="inline h-3 w-3 ml-1" />
  );
}

export function ProductTable({ products, onEdit, onDuplicate }: ProductTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { deleteProduct, toggleFavorite, sortBy, sortOrder, setSort } = useProductStore();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, 'asc');
    }
  };

  const SortableHeader = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:bg-gray-50 select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      {children}
      <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
    </TableHead>
  );

  return (
    <>
      <div className="rounded-lg border bg-white">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="code">Code</SortableHeader>
                <SortableHeader field="name">Name</SortableHeader>
                <SortableHeader field="size">Size</SortableHeader>
                <SortableHeader field="pv" className="text-right">PV</SortableHeader>
                <SortableHeader field="dp" className="text-right">DP (NPR)</SortableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell className="text-right">
                      {product.pv !== null ? formatPV(product.pv) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.dp)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(product.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              product.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                            }`}
                          />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDuplicate(product)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden divide-y">
          {products.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No products found</div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-gray-500 font-mono">{product.code}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        product.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">{product.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span>PV: {product.pv !== null ? formatPV(product.pv) : '-'}</span>
                    <span className="font-medium">{formatCurrency(product.dp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDuplicate(product)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
