import type { ReactNode } from 'react';

/**
 * Shared modal shell used by every modal in the projects dashboard.
 * Provides the dimmed backdrop, the centred card, and a sticky
 * header with title/subtitle + close button.
 */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 520,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 61,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth,
          margin: '0 16px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: '#0f172a',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}
