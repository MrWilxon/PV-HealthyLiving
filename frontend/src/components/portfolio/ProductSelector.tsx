'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Calendar } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, formatPV } from '@/lib/utils';
import { api } from '@/lib/api';

interface ProductSelectorProps {
  onSelect: (product: Product, itemDate: string) => void;
  selectedProductIds?: string[];
  currency?: string;
}

export function ProductSelector({ onSelect, selectedProductIds = [], currency = 'NPR' }: ProductSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const products = await api.products.search(q);
      setResults(products);
      setIsOpen(true);
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

  useEffect(() => {
    const handleOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const handleSelect = (product: Product) => {
    onSelect(product, itemDate);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder="Search products to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="pl-10"
            aria-label="Search products to add"
            aria-expanded={showDropdown}
            role="combobox"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="h-4 w-4 text-gray-400 hidden sm:block" />
          <Input
            type="date"
            value={itemDate}
            onChange={(e) => setItemDate(e.target.value)}
            className="w-[150px] sm:w-[170px]"
            aria-label="Purchase date"
          />
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-80 overflow-auto" role="listbox">
          {results.length > 0 ? (
            results.map((product) => {
              const isAlreadyAdded = selectedProductIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  disabled={isAlreadyAdded}
                  role="option"
                  aria-selected={false}
                  aria-disabled={isAlreadyAdded}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${
                    isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-mono">{product.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.size}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      {product.pv !== null ? (
                        <div className="text-sm text-gray-600">PV: {formatPV(product.pv)}</div>
                      ) : (
                        <div className="text-sm text-gray-400">PV: N/A</div>
                      )}
                      <div className="font-medium">{formatCurrency(product.dp, currency)}</div>
                    </div>
                  </div>
                  {isAlreadyAdded && (
                    <div className="text-xs text-gray-400 mt-1">Already added to portfolio</div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">No products found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
