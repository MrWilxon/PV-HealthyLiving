'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Calendar, ArrowLeft, X, Loader2, Minus, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, formatPV } from '@/lib/utils';
import { api } from '@/lib/api';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product, itemDate: string, quantity: number) => void;
  selectedProductIds?: string[];
  currency?: string;
}

export function AddProductDialog({ open, onOpenChange, onSelect, selectedProductIds = [], currency = 'NPR' }: AddProductDialogProps) {
  const [step, setStep] = useState<'date' | 'products'>('date');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const products = await api.products.search(q);
      setResults(products);
      const newQuantities: Record<string, number> = {};
      products.forEach(p => { newQuantities[p.id] = 1; });
      setQuantities(prev => ({ ...prev, ...newQuantities }));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, search]);

  const handleDateConfirm = () => {
    setStep('products');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const handleProductSelect = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onSelect(product, selectedDate, qty);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleBack = () => {
    setStep('date');
    setQuery('');
    setResults([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('date');
      setQuery('');
      setResults([]);
      setQuantities({});
    }, 200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative z-50 w-full max-w-2xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 shrink-0">
            {step === 'products' && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {step === 'date' ? 'Select Purchase Date' : 'Add Products'}
              </h2>
              {step === 'products' && (
                <p className="text-sm text-gray-500">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' 
                  })}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {step === 'date' ? (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate" className="text-base">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-lg h-12"
                    autoFocus
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleDateConfirm} className="w-full h-12 text-base">
                    Continue to Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Search Bar */}
                <div className="p-4 border-b bg-white shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      ref={inputRef}
                      placeholder="Search by name or code..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-11 h-12 text-base"
                      aria-label="Search products"
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                  {query.trim().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Search className="h-12 w-12 mb-3" />
                      <p className="text-base">Type to search products</p>
                      <p className="text-sm">Search by product name or code</p>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="divide-y">
                      {results.map((product) => {
                        const isAlreadyAdded = selectedProductIds.includes(product.id);
                        const qty = quantities[product.id] || 1;
                        return (
                          <div
                            key={product.id}
                            className={`px-4 py-4 ${isAlreadyAdded ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-base">{product.name}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{product.code}</span>
                                  <span>{product.size}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {product.pv !== null ? (
                                  <div className="text-sm font-medium text-blue-600">PV: {formatPV(product.pv)}</div>
                                ) : (
                                  <div className="text-sm text-gray-400">PV: N/A</div>
                                )}
                                <div className="text-base font-semibold text-gray-900 mt-0.5">
                                  {formatCurrency(product.dp, currency)}
                                </div>
                              </div>
                            </div>
                            
                            {isAlreadyAdded ? (
                              <div className="text-xs text-gray-500 mt-2">Already in portfolio</div>
                            ) : (
                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">Quantity:</span>
                                  <div className="flex items-center border rounded-lg">
                                    <button
                                      onClick={() => handleQuantityChange(product.id, -1)}
                                      disabled={qty <= 1}
                                      className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-medium">{qty}</span>
                                    <button
                                      onClick={() => handleQuantityChange(product.id, 1)}
                                      className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleProductSelect(product)}
                                  className="gap-1.5"
                                >
                                  <Check className="h-4 w-4" />
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p className="text-base">No products found</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
