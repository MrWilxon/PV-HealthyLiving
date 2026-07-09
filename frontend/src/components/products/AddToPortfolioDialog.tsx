'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Portfolio, Product } from '@/types';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useToast } from '@/components/ui/toast';

interface AddToPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function AddToPortfolioDialog({ open, onOpenChange, product }: AddToPortfolioDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const portfolios = usePortfolioStore((s) => s.portfolios);
  const fetchPortfolios = usePortfolioStore((s) => s.fetchPortfolios);
  const addItem = usePortfolioStore((s) => s.addItem);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPortfolios();
      setQuantity(1);
      setSelectedPortfolioId(null);
    }
  }, [open, fetchPortfolios]);

  const handleSubmit = async () => {
    if (!product || !selectedPortfolioId) return;
    setIsSubmitting(true);
    try {
      await addItem(selectedPortfolioId, product.id, quantity, new Date().toISOString().split('T')[0]);
      toast(`Added "${product.name}" to portfolio`, 'success');
      onOpenChange(false);
    } catch {
      toast('Failed to add product to portfolio', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    router.push('/portfolios/new');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Add to Portfolio</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="py-2">
            <p className="text-sm text-gray-500">Adding</p>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">{product.code} &middot; {product.size}</p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Portfolio</label>
            {portfolios.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No portfolios yet</div>
            ) : (
              <div className="max-h-40 overflow-auto space-y-1">
                {portfolios.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPortfolioId(p.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedPortfolioId === p.id
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.items?.length || 0} items &middot; {p.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4" />
            Create new portfolio
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPortfolioId || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
