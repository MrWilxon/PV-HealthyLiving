'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useUnsavedChanges(hasUnsaved: boolean) {
  const router = useRouter();
  const pathname = usePathname();

  // Warn before closing tab/browser
  useEffect(() => {
    if (!hasUnsaved) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  // Intercept browser back/forward
  useEffect(() => {
    if (!hasUnsaved) return;

    const handlePopState = (e: PopStateEvent) => {
      if (window.confirm('You have unsaved changes. Leave anyway?')) {
        // Allow navigation
      } else {
        e.preventDefault();
        window.history.pushState(null, '', pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsaved, pathname]);

  // Intercept Next.js router navigation
  const confirmLeave = useCallback(() => {
    if (!hasUnsaved) return true;
    return window.confirm('You have unsaved changes. Leave anyway?');
  }, [hasUnsaved]);

  return { confirmLeave };
}
