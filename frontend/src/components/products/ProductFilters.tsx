'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    minPv: string;
    maxPv: string;
    minPrice: string;
    maxPrice: string;
    favorite: boolean;
    size: string;
    hasPv: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterChange: (filters: Record<string, string | boolean>) => void;
  onSearch: (query: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  searchQuery?: string;
}

export function ProductFilters({
  filters,
  sortBy,
  sortOrder,
  onFilterChange,
  onSearch,
  onSortChange,
  searchQuery = '',
}: ProductFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    onSearch(value);
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      minPv: '',
      maxPv: '',
      minPrice: '',
      maxPrice: '',
      favorite: false,
      size: '',
      hasPv: '',
    });
    onSearch('');
    onSortChange('name', 'asc');
  };

  const hasActiveFilters =
    filters.minPv ||
    filters.maxPv ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.favorite ||
    filters.size ||
    filters.hasPv ||
    sortBy !== 'name' ||
    sortOrder !== 'asc';

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by code, name, or size..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {localSearch && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onFilterChange({ favorite: !filters.favorite })}>
          {filters.favorite ? '★ Favorites' : '☆ All'}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <Label className="text-xs">PV Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPv}
              onChange={(e) => onFilterChange({ minPv: e.target.value })}
              className="w-full sm:w-24"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPv}
              onChange={(e) => onFilterChange({ maxPv: e.target.value })}
              className="w-full sm:w-24"
            />
          </div>
        </div>

        <div className="space-y-2 w-full sm:w-auto">
          <Label className="text-xs">Price Range (NPR)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onFilterChange({ minPrice: e.target.value })}
              className="w-full sm:w-24"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
              className="w-full sm:w-24"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
