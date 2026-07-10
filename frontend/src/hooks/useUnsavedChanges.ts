'use client';

import { useEffect, useCallback } from 'react';

export function useUnsavedChanges(hasUnsaved: boolean) {
  useEffect(() => {
    if (!hasUnsaved) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  useEffect(() => {
    if (!hasUnsaved) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href]');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      if (!window.confirm('You have unsaved changes. Leave anyway?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsaved]);

  const confirmLeave = useCallback(() => {
    if (!hasUnsaved) return true;
    return window.confirm('You have unsaved changes. Leave anyway?');
  }, [hasUnsaved]);

  return { confirmLeave };
}
