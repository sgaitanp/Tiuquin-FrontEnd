import { useRef, useState, type FormEvent } from 'react';
import {
  Priority,
  SiteSurveyStatus,
  type Project,
  type SiteSurvey,
} from '@/types/project';
import type { Template } from '@/types/template';
import LocationMapPicker, {
  type LocationMapPickerRef,
} from '@/components/ui/LocationMapPicker';
import Modal from '../common/Modal';
import StepIndicator from '../common/StepIndicator';
import {
  Ms,
  Lbl,
  Err,
  FooterBtns,
  SecLabel,
  inp,
  fmtStatus,
  type User,
} from '../common/shared';

function generateWONumber(): string {
  const year = new Date().getFullYear();
  const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `WO-${year}-${uid}`;
}

const EMPTY_WO = { number: '', description: '', priority: '', createdBy: '' };
const EMPTY_SRV = {
  name: '',
  status: '',
  scheduledDate: '',
  assignedTo: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  contactName: '',
  contactRole: '',
  contactPhone: '',
  contactEmail: '',
};

/**
 * Four-step wizard for adding a site survey to a project:
 *   1. Work Order — required before anything else
 *   2. Survey Details + Location + Contact
 *   3. Template (optional)
 *   4. Files (optional)
 *
 * Submits the full payload to `onAdded(projectId, survey)`, which
 * the parent routes to `projectService.createSiteSurvey`.
 */
export default function AddSurveyWizard({
  project,
  platformOperators,
  fieldCrewMembers,
  onClose,
  onAdded,
}: {
  project: Project;
  platformOperators: User[];
  fieldCrewMembers: User[];
  onClose: () => void;
  onAdded: (projectId: string, survey: Omit<SiteSurvey, 'id'>) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [wo, setWo] = useState<Record<string, string>>({
    ...EMPTY_WO,
    number: generateWONumber(),
  });
  const [woErr, setWoErr] = useState<Record<string, string>>({});
  const [srv, setSrv] = useState<Record<string, string>>(EMPTY_SRV);
  const [srvErr, setSrvErr] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const mapPickerRef = useRef<LocationMapPickerRef>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setW = (k: string, v: string) => {
    setWo((f) => ({ ...f, [k]: v }));
    setWoErr((e) => ({ ...e, [k]: '' }));
  };
  const setS = (k: string, v: string) => {
    setSrv((f) => ({ ...f, [k]: v }));
    setSrvErr((e) => ({ ...e, [k]: '' }));
  };

  const validateWo = () => {
    const e: Record<string, string> = {};
    if (!wo.number.trim()) e.number = 'Required';
    if (!wo.description.trim()) e.description = 'Required';
    if (!wo.priority) e.priority = 'Required';
    if (!wo.createdBy.trim()) e.createdBy = 'Required';
    setWoErr(e);
    return !Object.keys(e).length;
  };
  const validateSrv = () => {
    const e: Record<string, string> = {};
    Object.keys(EMPTY_SRV).forEach((k) => {
      if (!srv[k].trim()) e[k] = 'Required';
    });
    setSrvErr(e);
    return !Object.keys(e).length;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (validateWo()) setStep(2);
  };
  const handleNextStep2 = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateSrv()) return;
    setLoadingTpl(true);
    try {
      const { getApprovedTemplates } =
        await import('@/services/templateService');
      const templates = await getApprovedTemplates();
      setTemplates(templates);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTpl(false);
    }
    setStep(3);
  };

  const stepTitles = ['Work Order', 'Survey Details', 'Template', 'Files'];
  const stepSubtitles = [
    `A work order is required before creating a survey for ${project.name}`,
    'Work order ready. Fill in the survey details.',
    'Optionally assign an approved template to this survey.',
    'Optionally attach files to this site survey.',
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const crew = fieldCrewMembers.find((m) => m.id === srv.assignedTo) || {
      id: srv.assignedTo,
      name: srv.assignedTo,
    };
    const payload = {
      name: srv.name,
      status: srv.status,
      scheduledDate: srv.scheduledDate,
      assignedTo: crew,
      templateId: templateId || null,
      latitude: lat,
      longitude: lng,
      files,
      location: {
        address: srv.address,
        city: srv.city,
        state: srv.state,
        zip: srv.zip,
      },
      contact: {
        name: srv.contactName,
        role: srv.contactRole,
        phone: srv.contactPhone,
        email: srv.contactEmail,
      },
      workOrder: {
        id: '',
        number: wo.number,
        description: wo.description,
        priority: wo.priority,
        createdBy: wo.createdBy,
        createdAt: new Date().toISOString(),
      },
    } as Omit<SiteSurvey, 'id'>;

    setSaving(true);
    setSaveError(null);
    try {
      await onAdded(project.id, payload);
      onClose();
    } catch (err) {
      setSaving(false);
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to create site survey. Please try again.',
      );
    }
  };

  if (saving) {
    return (
      <Modal
        title="Creating site survey…"
        subtitle="This may take a few seconds. Please keep this window open."
        onClose={() => {}}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '48px 24px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0f172a',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p
            style={{
              fontSize: 13,
              color: '#64748b',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Saving work order, site survey
            {files.length > 0 ? ` and ${files.length} file${files.length === 1 ? '' : 's'}` : ''}
            …
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Step ${step} — ${stepTitles[step - 1]}`}
      subtitle={stepSubtitles[step - 1]}
      onClose={onClose}
    >
      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: 12,
          }}
        >
          <Ms icon="error" style={{ fontSize: 16, color: '#dc2626' }} />
          <span>{saveError}</span>
        </div>
      )}
      <StepIndicator step={step} steps={stepTitles} />

      {step === 1 && (
        <form
          onSubmit={handleNext}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <Lbl t="WO Number" />
              <input
                value={wo.number}
                onChange={(e) => setW('number', e.target.value)}
                placeholder="WO-2025-0011"
                style={inp(!!woErr.number)}
              />
              <Err msg={woErr.number} />
            </div>
            <div>
              <Lbl t="Priority" />
              <select
                value={wo.priority}
                onChange={(e) => setW('priority', e.target.value)}
                style={inp(!!woErr.priority)}
              >
                <option value="">Select…</option>
                {Object.keys(Priority).map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <Err msg={woErr.priority} />
            </div>
          </div>
          <div>
            <Lbl t="Description" />
            <input
              value={wo.description}
              onChange={(e) => setW('description', e.target.value)}
              placeholder="Describe the work…"
              style={inp(!!woErr.description)}
            />
            <Err msg={woErr.description} />
          </div>
          <div>
            <Lbl t="Created By" />
            <select
              value={wo.createdBy}
              onChange={(e) => setW('createdBy', e.target.value)}
              style={inp(!!woErr.createdBy)}
            >
              <option value="">Select operator…</option>
              {platformOperators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <Err msg={woErr.createdBy} />
          </div>
          <FooterBtns onCancel={onClose} submitLabel="Next" />
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={handleNextStep2}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <Lbl t="Survey Name" />
              <input
                value={srv.name}
                onChange={(e) => setS('name', e.target.value)}
                placeholder="e.g. Rooftop Assessment"
                style={inp(!!srvErr.name)}
              />
              <Err msg={srvErr.name} />
            </div>
            <div>
              <Lbl t="Status" />
              <select
                value={srv.status}
                onChange={(e) => setS('status', e.target.value)}
                style={inp(!!srvErr.status)}
              >
                <option value="">Select…</option>
                {Object.keys(SiteSurveyStatus).map((s) => (
                  <option key={s} value={s}>
                    {fmtStatus(s)}
                  </option>
                ))}
              </select>
              <Err msg={srvErr.status} />
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <Lbl t="Scheduled Date & Time" />
              <input
                type="datetime-local"
                value={srv.scheduledDate}
                onChange={(e) => setS('scheduledDate', e.target.value)}
                style={inp(!!srvErr.scheduledDate)}
              />
              <Err msg={srvErr.scheduledDate} />
            </div>
            <div>
              <Lbl t="Assigned To" />
              <select
                value={srv.assignedTo}
                onChange={(e) => setS('assignedTo', e.target.value)}
                style={inp(!!srvErr.assignedTo)}
              >
                <option value="">Select crew member…</option>
                {fieldCrewMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <Err msg={srvErr.assignedTo} />
            </div>
          </div>

          <div>
            <SecLabel icon="location_on" label="Location" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <Lbl t="Address" />
                <input
                  value={srv.address}
                  onChange={(e) => setS('address', e.target.value)}
                  placeholder="123 Main St"
                  style={inp(!!srvErr.address)}
                />
                <Err msg={srvErr.address} />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <Lbl t="City" />
                  <input
                    value={srv.city}
                    onChange={(e) => setS('city', e.target.value)}
                    style={inp(!!srvErr.city)}
                  />
                  <Err msg={srvErr.city} />
                </div>
                <div>
                  <Lbl t="State" />
                  <input
                    value={srv.state}
                    onChange={(e) => setS('state', e.target.value)}
                    style={inp(!!srvErr.state)}
                  />
                  <Err msg={srvErr.state} />
                </div>
                <div>
                  <Lbl t="ZIP" />
                  <input
                    value={srv.zip}
                    onChange={(e) => setS('zip', e.target.value)}
                    style={inp(!!srvErr.zip)}
                  />
                  <Err msg={srvErr.zip} />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      mapPickerRef.current?.searchAddress(
                        [srv.address, srv.city, srv.state, srv.zip]
                          .filter(Boolean)
                          .join(', '),
                      )
                    }
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      background: '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ms
                      icon="location_on"
                      style={{ fontSize: 16, color: '#fff' }}
                    />{' '}
                    Find on Map
                  </button>
                </div>
                <LocationMapPicker
                  ref={mapPickerRef}
                  initialLat={lat ?? undefined}
                  initialLng={lng ?? undefined}
                  onPick={(la, ln) => {
                    setLat(la);
                    setLng(ln);
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <SecLabel icon="contact_page" label="Contact" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <Lbl t="Name" />
                  <input
                    value={srv.contactName}
                    onChange={(e) => setS('contactName', e.target.value)}
                    style={inp(!!srvErr.contactName)}
                  />
                  <Err msg={srvErr.contactName} />
                </div>
                <div>
                  <Lbl t="Role" />
                  <input
                    value={srv.contactRole}
                    onChange={(e) => setS('contactRole', e.target.value)}
                    style={inp(!!srvErr.contactRole)}
                  />
                  <Err msg={srvErr.contactRole} />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <Lbl t="Phone" />
                  <input
                    value={srv.contactPhone}
                    onChange={(e) => setS('contactPhone', e.target.value)}
                    style={inp(!!srvErr.contactPhone)}
                  />
                  <Err msg={srvErr.contactPhone} />
                </div>
                <div>
                  <Lbl t="Email" />
                  <input
                    type="email"
                    value={srv.contactEmail}
                    onChange={(e) => setS('contactEmail', e.target.value)}
                    style={inp(!!srvErr.contactEmail)}
                  />
                  <Err msg={srvErr.contactEmail} />
                </div>
              </div>
            </div>
          </div>
          <FooterBtns
            onBack={() => setStep(1)}
            backLabel="Back"
            submitLabel={loadingTpl ? 'Loading…' : 'Next'}
          />
        </form>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(4);
          }}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <Lbl t="Template (optional)" />
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={inp(false)}
            >
              <option value="">No template — assign later</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — v{t.version}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                No approved templates available.
              </p>
            )}
          </div>
          <FooterBtns
            onBack={() => setStep(2)}
            backLabel="Back"
            submitLabel="Next"
          />
        </form>
      )}

      {step === 4 && (
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <SecLabel icon="attach_file" label="Attachments (optional)" />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: 10,
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fafafa',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = '#0f172a')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0')
              }
            >
              <Ms
                icon="upload_file"
                style={{
                  fontSize: 28,
                  color: '#94a3b8',
                  display: 'block',
                  margin: '0 auto 6px',
                }}
              />
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Click to upload files
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                PDF, PNG, JPG, or any document
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...picked]);
                  e.target.value = '';
                }}
              />
            </div>
            {files.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {files.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      padding: '8px 12px',
                      background: '#fff',
                    }}
                  >
                    <Ms
                      icon="description"
                      style={{ fontSize: 16, color: '#64748b' }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: '#374151',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <Ms icon="close" style={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <FooterBtns
            onBack={() => setStep(3)}
            backLabel="Back"
            submitLabel="Create Survey"
          />
        </form>
      )}
    </Modal>
  );
}
