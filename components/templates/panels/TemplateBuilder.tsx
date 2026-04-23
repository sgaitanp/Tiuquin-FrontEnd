import { useState } from 'react';
import { Ms, StatusBadge, STATUS_CFG, fmtDate } from '../common/shared';
import SectionCard from './SectionCard';
import { updateTemplateStatus } from '@/services/templateService';
import type { Section, Template, TemplateStatus } from '@/types/template';

const STATUS_TRANSITIONS: Record<TemplateStatus, TemplateStatus[]> = {
  IN_DESIGN: ['IN_REVISION'],
  IN_REVISION: ['IN_DESIGN', 'APPROVED'],
  APPROVED: [],
};

const STATUS_LABELS: Record<string, string> = {
  IN_REVISION: 'Send to Revision',
  IN_DESIGN: 'Back to Design',
  APPROVED: 'Approve',
};

export default function TemplateBuilder({
  template,
  onUpdated,
}: {
  template: Template;
  onUpdated: (t: Template) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<TemplateStatus>('IN_DESIGN');
  const [statusSaving, setStatusSaving] = useState(false);

  const sections: Section[] = template.sections ?? [];

  const changeStatus = async (status: TemplateStatus) => {
    setSaving(true);
    try {
      const updated = await updateTemplateStatus(template.id, status);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  const transitions = STATUS_TRANSITIONS[template.status] ?? [];

  return (
    <>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px 16px',
            borderBottom: '1px solid #f1f5f9',
            background: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  {template.name}
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    background: '#f1f5f9',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontWeight: 500,
                  }}
                >
                  v{template.version}
                </span>
                <StatusBadge status={template.status} />
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                Created {fmtDate(template.createdAt)} · {sections.length}{' '}
                section{sections.length !== 1 ? 's' : ''} ·{' '}
                {sections.reduce(
                  (a, s) => a + s.questions.length,
                  0,
                )}{' '}
                questions
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {/* Status transitions */}
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: 8,
                    border: `1px solid ${STATUS_CFG[s].border}`,
                    background: STATUS_CFG[s].bg,
                    color: STATUS_CFG[s].color,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: saving ? 'default' : 'pointer',
                  }}
                >
                  <Ms
                    icon={STATUS_CFG[s].icon}
                    style={{ fontSize: 15, color: STATUS_CFG[s].color }}
                  />
                  {STATUS_LABELS[s]}
                </button>
              ))}

              {/* Change Status */}
              <button
                onClick={() => {
                  setNewStatus(
                    template.status === 'APPROVED' ? 'IN_DESIGN' : 'APPROVED',
                  );
                  setChangingStatus(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#374151',
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Ms icon="swap_horiz" style={{ fontSize: 15 }} />
                Change Status
              </button>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 840,
          }}
        >
          {sections.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <Ms
                icon="view_agenda"
                style={{
                  fontSize: 48,
                  color: '#e2e8f0',
                  display: 'block',
                  margin: '0 auto 12px',
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748b',
                  margin: '0 0 4px',
                }}
              >
                No sections yet
              </p>
            </div>
          )}

          {sections.map((sec, i) => (
            <SectionCard
              key={sec.id}
              section={sec}
              index={i}
              readOnly={true}
              onUpdate={() => {}}
              onDelete={() => {}}
              onEditQuestion={() => {}}
            />
          ))}
        </div>
      </div>

      {changingStatus && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 28,
              width: 380,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              Change Status
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 20px' }}>
              {template.name} · v{template.version}
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TemplateStatus)}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                padding: '8px 10px',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: 16,
              }}
            >
              {(['IN_DESIGN', 'IN_REVISION', 'APPROVED'] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_CFG[s].label}
                </option>
              ))}
            </select>
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
              <button
                onClick={() => setChangingStatus(false)}
                style={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                disabled={statusSaving}
                onClick={async () => {
                  setStatusSaving(true);
                  try {
                    const updated = await updateTemplateStatus(
                      template.id,
                      newStatus,
                    );
                    onUpdated(updated);
                    setChangingStatus(false);
                  } finally {
                    setStatusSaving(false);
                  }
                }}
                style={{
                  borderRadius: 8,
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {statusSaving ? 'Saving…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
