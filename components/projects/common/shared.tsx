import type { CSSProperties } from 'react';
import type { User as FullUser } from '@/types/user';

/**
 * Local user alias for places that only need `{id, name}` — mainly
 * the platformOperators / fieldCrewMembers dropdowns in the add-survey
 * wizard and the project row.
 */
export type User = Pick<FullUser, 'id' | 'name'>;

// ── Formatters ────────────────────────────────────────────────────────────────

export const fmtStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const initials = (n: string) =>
  n
    .split(' ')
    .map((x: string) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// ── Visual config ─────────────────────────────────────────────────────────────

export const statusCfg: Record<
  string,
  { bg: string; color: string; border: string; dot: string; pulse: boolean }
> = {
  PLANNED: {
    bg: '#f8fafc',
    color: '#475569',
    border: '#e2e8f0',
    dot: '#94a3b8',
    pulse: false,
  },
  IN_PROGRESS: {
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
    dot: '#3b82f6',
    pulse: true,
  },
  PENDING_APPROVAL: {
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
    dot: '#f59e0b',
    pulse: true,
  },
  APPROVED: {
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    dot: '#22c55e',
    pulse: false,
  },
  CLOSED: {
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#e2e8f0',
    dot: '#cbd5e1',
    pulse: false,
  },
  REJECTED: {
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
    pulse: false,
  },
};

export const priorityCfg: Record<
  string,
  { bg: string; color: string; border: string; icon: string }
> = {
  HIGH: {
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    icon: 'keyboard_double_arrow_up',
  },
  MEDIUM: {
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
    icon: 'drag_handle',
  },
  LOW: {
    bg: '#f8fafc',
    color: '#475569',
    border: '#e2e8f0',
    icon: 'keyboard_double_arrow_down',
  },
};

// ── Presentational primitives ─────────────────────────────────────────────────

export const Ms = ({
  icon,
  style = {},
}: {
  icon: string;
  style?: CSSProperties;
}) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {icon}
  </span>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const c = statusCfg[status] || statusCfg.PLANNED;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 6,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
          animation: c.pulse ? 'pulse 1.4s ease-in-out infinite' : 'none',
        }}
      />
      {fmtStatus(status)}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
  const c = priorityCfg[priority] || priorityCfg.MEDIUM;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 6,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <Ms icon={c.icon} style={{ fontSize: 14, color: c.color }} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
};

export const StatCard = ({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
}) => (
  <div
    style={{
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      background: '#fff',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div>
        <p
          style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0 }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0f172a',
            margin: '4px 0 2px',
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {description}
        </p>
      </div>
      <Ms icon={icon} style={{ fontSize: 22, color: '#94a3b8' }} />
    </div>
  </div>
);

export const SecLabel = ({ icon, label }: { icon: string; label: string }) => (
  <p
    style={{
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#94a3b8',
      margin: '0 0 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <Ms icon={icon} style={{ fontSize: 14, color: '#94a3b8' }} />
    {label}
  </p>
);

// ── Form helpers ──────────────────────────────────────────────────────────────

export const inp = (hasErr = false): CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 8,
  border: `1px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`,
  background: '#fff',
  padding: '8px 12px',
  fontSize: 13,
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
});

export const Lbl = ({ t }: { t: string }) => (
  <label
    style={{
      display: 'block',
      fontSize: 12,
      fontWeight: 500,
      color: '#374151',
      marginBottom: 5,
    }}
  >
    {t}
  </label>
);

export const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0' }}>{msg}</p>
  ) : null;

export const FooterBtns = ({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel,
  backLabel,
  onBack,
}: {
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel: string;
  backLabel?: string;
  onBack?: () => void;
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      paddingTop: 8,
    }}
  >
    {onBack ? (
      <button
        type="button"
        onClick={onBack}
        style={{
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          background: '#fff',
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Ms icon="arrow_back" style={{ fontSize: 15 }} />
        {backLabel || 'Back'}
      </button>
    ) : (
      <button
        type="button"
        onClick={onCancel}
        style={{
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          background: '#fff',
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          color: '#374151',
        }}
      >
        {cancelLabel}
      </button>
    )}
    <button
      type="submit"
      style={{
        borderRadius: 8,
        border: 'none',
        background: '#0f172a',
        color: '#fff',
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {submitLabel}
      {submitLabel === 'Next' && (
        <Ms icon="arrow_forward" style={{ fontSize: 15, color: '#fff' }} />
      )}
    </button>
  </div>
);
