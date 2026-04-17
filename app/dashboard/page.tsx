'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; type: string } | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem('currentUser') ?? 'null',
      );
      setUser(stored);
    } catch {}
  }, []);

  const fmtRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: "'Geist','Inter',system-ui,sans-serif",
        color: '#0f172a',
        gap: 12,
        textAlign: 'center',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: '#fff' }}
        >
          waving_hand
        </span>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
        Welcome to Tiuquin{user?.name ? `, ${user.name}` : ''}
      </h1>
      {user?.type && (
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          You are logged in as <strong>{fmtRole(user.type)}</strong>
        </p>
      )}
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 360 }}>
        Use the sidebar to navigate to your section.
      </p>
    </div>
  );
}
