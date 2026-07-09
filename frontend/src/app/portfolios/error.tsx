'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PortfoliosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portfolios error:', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
      <h2 className="text-lg font-semibold text-gray-900">Failed to load portfolios</h2>
      <p className="text-sm text-gray-500">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset} variant="outline" size="sm">
        Try Again
      </Button>
    </div>
  );
}
