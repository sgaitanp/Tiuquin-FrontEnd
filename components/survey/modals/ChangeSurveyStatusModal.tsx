'use client';

import { useState } from 'react';
import { updateSiteSurveyStatus } from '@/services/surveyService';
import type { SiteSurvey, SiteSurveyStatus } from '@/types/project';

const STATUS_OPTIONS: SiteSurveyStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
  'CLOSED',
  'REJECTED',
];

/**
 * Small modal for changing a site survey's status. Owns the save
 * state internally and calls `onChanged` with the new status so the
 * parent can update its own list/selected-survey caches.
 */
export default function ChangeSurveyStatusModal({
  survey,
  onChanged,
  onClose,
}: {
  survey: SiteSurvey;
  onChanged: (newStatus: SiteSurveyStatus) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<SiteSurveyStatus>(survey.status);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await updateSiteSurveyStatus(survey.id, status);
      onChanged(status);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
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
          {survey.name}
        </p>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SiteSurveyStatus)}
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
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
            disabled={saving}
            onClick={submit}
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
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
