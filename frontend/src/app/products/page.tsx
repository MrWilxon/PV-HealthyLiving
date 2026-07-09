'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Product, ProductFormData } from '@/types';
import { useProductStore } from '@/stores/useProductStore';

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [duplicatingProduct, setDuplicatingProduct] = React.useState<Product | null>(null);

  const products = useProductStore((s) => s.products);
  const isLoading = useProductStore((s) => s.isLoading);
  const filters = useProductStore((s) => s.filters);
  const sortBy = useProductStore((s) => s.sortBy);
  const sortOrder = useProductStore((s) => s.sortOrder);
  const page = useProductStore((s) => s.page);
  const totalPages = useProductStore((s) => s.totalPages);
  const total = useProductStore((s) => s.total);
  const searchQuery = useProductStore((s) => s.searchQuery);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const searchProducts = useProductStore((s) => s.searchProducts);
  const clearSearch = useProductStore((s) => s.clearSearch);
  const createProduct = useProductStore((s) => s.createProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const setFilters = useProductStore((s) => s.setFilters);
  const setPage = useProductStore((s) => s.setPage);
  const setSort = useProductStore((s) => s.setSort);

  const filtersKey = useMemo(
    () => JSON.stringify(filters),
    [filters.minPv, filters.maxPv, filters.minPrice, filters.maxPrice, filters.favorite, filters.size, filters.hasPv]
  );

  useEffect(() => {
    if (!searchQuery) {
      fetchProducts();
    }
  }, [filtersKey, page, searchQuery, sortBy, sortOrder]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      await searchProducts(query);
    } else {
      clearSearch();
    }
  }, [searchProducts, clearSearch]);

  const handleSubmit = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else if (duplicatingProduct) {
      await createProduct({ ...data, code: `${data.code}-COPY` });
    } else {
      await createProduct(data);
    }
    setEditingProduct(null);
    setDuplicatingProduct(null);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDuplicatingProduct(null);
    setIsFormOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    setDuplicatingProduct(product);
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500">{total} products</p>
          </div>
          <Button onClick={() => { setEditingProduct(null); setDuplicatingProduct(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <ProductFilters
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={setFilters}
          onSearch={handleSearch}
          onSortChange={setSort}
          searchQuery={searchQuery}
        />

        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing results for "<strong>{searchQuery}</strong>"</span>
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
          </div>
        ) : (
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
          />
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="min-h-[44px]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <ProductForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          product={editingProduct}
          onSubmit={handleSubmit}
        />
      </div>
    </MainLayout>
  );
}
