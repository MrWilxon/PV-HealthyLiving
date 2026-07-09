'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '32px' }}>💥</span>
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '8px',
          }}>
            Application Error
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '24px',
            maxWidth: '400px',
          }}>
            A critical error occurred. Please refresh the page or try again later.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#111827',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
