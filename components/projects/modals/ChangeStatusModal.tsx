import { useState, type FormEvent } from 'react';
import { SiteSurveyStatus, type SiteSurvey } from '@/types/project';
import { updateSiteSurveyStatus } from '@/services/surveyService';
import Modal from '../common/Modal';
import { Lbl, FooterBtns, inp, fmtStatus } from '../common/shared';

/**
 * Change a site survey's status. Persists the change remotely, then
 * hands the updated survey back via `onChanged` so the parent can
 * update its list + selection caches.
 */
export default function ChangeStatusModal({
  survey,
  onClose,
  onChanged,
}: {
  survey: SiteSurvey;
  onClose: () => void;
  onChanged: (s: SiteSurvey) => void;
}) {
  const [status, setStatus] = useState(survey.status);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === survey.status) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await updateSiteSurveyStatus(survey.id, status);
      onChanged({ ...survey, status: updated.status ?? status });
      onClose();
    } catch {
      setErr('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title="Change Status"
      subtitle={`${survey.name}`}
      onClose={onClose}
      maxWidth={400}
    >
      <form
        onSubmit={submit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <Lbl t="New Status" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SiteSurveyStatus)}
            style={inp(false)}
          >
            {Object.keys(SiteSurveyStatus).map((s) => (
              <option key={s} value={s}>
                {fmtStatus(s)}
              </option>
            ))}
          </select>
        </div>
        {err && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{err}</p>
        )}
        <FooterBtns
          onCancel={onClose}
          submitLabel={saving ? 'Saving…' : 'Update Status'}
        />
      </form>
    </Modal>
  );
}
