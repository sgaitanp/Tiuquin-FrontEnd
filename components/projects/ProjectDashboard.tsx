'use client';
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  CSSProperties,
  ReactNode,
  FormEvent,
} from 'react';
import {
  getProjects,
  getProjectById,
  createProject,
  createSiteSurvey,
  getSiteSurveyWorkOrder,
} from '@/services/projectService';
import { getUsersByType } from '@/services/userService';
import { updateSiteSurveyStatus } from '@/services/surveyService';
import { updateProject, updateSurvey } from '@/actions/projectActions';
import LocationMapPicker, {
  LocationMapPickerRef,
} from '@/components/ui/LocationMapPicker';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkOrder {
  id: string;
  number: string;
  description: string;
  priority: string;
  createdBy: string;
  createdAt: string;
}
interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
}
interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
}
interface AssignedTo {
  id: string;
  name: string;
}
interface SiteSurvey {
  id: string;
  name: string;
  status: string;
  scheduledDate: string;
  location: Location;
  contact: Contact;
  workOrder: WorkOrder;
  assignedTo?: AssignedTo;
  templateId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
interface Project {
  id: string;
  name: string;
  client: string;
  siteSurveys: SiteSurvey[];
}
interface User {
  id: string;
  name: string;
}

// ── Enums ─────────────────────────────────────────────────────────────────────
const Priority = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
const SiteSurveyStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
};

// ── Seed data ─────────────────────────────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
const initials = (n: string) =>
  n
    .split(' ')
    .map((x: string) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// ── Platform operators fallback ───────────────────────────────────────────────
const statusCfg: Record<
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
const priorityCfg: Record<
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

// ── Small components ──────────────────────────────────────────────────────────
const Ms = ({ icon, style = {} }: { icon: string; style?: CSSProperties }) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {icon}
  </span>
);

const StatusBadge = ({ status }: { status: string }) => {
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

const PriorityBadge = ({ priority }: { priority: string }) => {
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

const StatCard = ({
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

const SecLabel = ({ icon, label }: { icon: string; label: string }) => (
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
const inp = (hasErr = false): CSSProperties => ({
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

const Lbl = ({ t }: { t: string }) => (
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

const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0' }}>{msg}</p>
  ) : null;

const FooterBtns = ({
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

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({
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

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({
  step,
  steps: stepLabels,
}: {
  step: number;
  steps?: string[];
}) {
  const steps = stepLabels ?? ['Work Order', 'Survey Details'];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 20,
      }}
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: i < steps.length - 1 ? 1 : undefined,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: done ? '#22c55e' : active ? '#0f172a' : '#f1f5f9',
                  color: done || active ? '#fff' : '#94a3b8',
                  transition: 'all .2s',
                }}
              >
                {done ? (
                  <Ms icon="check" style={{ fontSize: 14, color: '#fff' }} />
                ) : (
                  n
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: active ? '#0f172a' : done ? '#22c55e' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: done ? '#22c55e' : '#e2e8f0',
                  margin: '0 10px',
                  transition: 'background .2s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Survey Detail Modal ───────────────────────────────────────────────────────
function SurveyDetailModal({
  survey,
  onClose,
}: {
  survey: SiteSurvey;
  onClose: () => void;
}) {
  return (
    <Modal
      title={survey.name}
      subtitle={survey.id}
      onClose={onClose}
      maxWidth={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <StatusBadge status={survey.status} />
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <Ms
              icon="calendar_month"
              style={{ fontSize: 15, color: '#94a3b8' }}
            />
            {fmtDate(survey.scheduledDate)} · {fmtTime(survey.scheduledDate)}
          </span>
        </div>

        {survey.assignedTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              border: '1px solid #eff6ff',
              background: '#f0f9ff',
              padding: '10px 14px',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#1d4ed8',
                flexShrink: 0,
              }}
            >
              {initials(survey.assignedTo.name)}
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Assigned Field Crew
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                {survey.assignedTo.name}
              </p>
            </div>
            <Ms
              icon="engineering"
              style={{ fontSize: 18, color: '#93c5fd', marginLeft: 'auto' }}
            />
          </div>
        )}

        <div
          style={{
            borderRadius: 10,
            border: '1px solid #f1f5f9',
            background: '#f8fafc',
            padding: 16,
          }}
        >
          <SecLabel icon="assignment" label="Work Order" />
          {survey.workOrder ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  {survey.workOrder.number}
                </span>
                <PriorityBadge priority={survey.workOrder.priority} />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: '#374151',
                  margin: '0 0 10px',
                  lineHeight: 1.5,
                }}
              >
                {survey.workOrder.description}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  color: '#64748b',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Ms
                    icon="person"
                    style={{ fontSize: 14, color: '#94a3b8' }}
                  />
                  {survey.workOrder.createdBy}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Ms
                    icon="schedule"
                    style={{ fontSize: 14, color: '#94a3b8' }}
                  />
                  {fmtDate(survey.workOrder.createdAt)}
                </span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
              No work order set
            </p>
          )}
        </div>

        <div
          style={{
            borderRadius: 10,
            border: '1px solid #f1f5f9',
            background: '#f8fafc',
            padding: 16,
          }}
        >
          <SecLabel icon="location_on" label="Location" />
          {survey.location ? (
            <>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0f172a',
                  margin: '0 0 4px',
                }}
              >
                {survey.location.address}
              </p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                {survey.location.city}, {survey.location.state}{' '}
                {survey.location.zip}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
              No location set
            </p>
          )}
        </div>

        <div
          style={{
            borderRadius: 10,
            border: '1px solid #f1f5f9',
            background: '#f8fafc',
            padding: 16,
          }}
        >
          <SecLabel icon="contact_page" label="Contact" />
          {survey.contact ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  {initials(survey.contact.name)}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    {survey.contact.name}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    {survey.contact.role}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  <Ms icon="phone" style={{ fontSize: 14, color: '#94a3b8' }} />
                  {survey.contact.phone}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  <Ms icon="mail" style={{ fontSize: 14, color: '#94a3b8' }} />
                  {survey.contact.email}
                </span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
              No contact set
            </p>
          )}
        </div>
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}
      >
        <button
          onClick={onClose}
          style={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#fff',
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// ── Add Survey Wizard (2 steps) ───────────────────────────────────────────────
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

function AddSurveyWizard({
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
  onAdded: (projectId: string, survey: Omit<SiteSurvey, 'id'>) => void;
}) {
  const [step, setStep] = useState(1);
  const [wo, setWo] = useState<Record<string, string>>({
    ...EMPTY_WO,
    number: generateWONumber(),
  });
  const [woErr, setWoErr] = useState<Record<string, string>>({});
  const [srv, setSrv] = useState<Record<string, string>>(EMPTY_SRV);
  const [srvErr, setSrvErr] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const mapPickerRef = useRef<LocationMapPickerRef>(null);

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
    } catch (err) {
      setTemplates([]);
    } finally {
      setLoadingTpl(false);
    }
    setStep(3);
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const crew = fieldCrewMembers.find((m) => m.id === srv.assignedTo) || {
      id: srv.assignedTo,
      name: srv.assignedTo,
    };
    onAdded(project.id, {
      name: srv.name,
      status: srv.status,
      scheduledDate: srv.scheduledDate,
      assignedTo: crew,
      templateId: templateId || null,
      latitude: lat,
      longitude: lng,
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
    } as Omit<SiteSurvey, 'id'>);
    onClose();
  };

  const stepTitles = ['Work Order', 'Survey Details', 'Template'];
  const stepSubtitles = [
    `A work order is required before creating a survey for ${project.name}`,
    'Work order ready. Fill in the survey details.',
    'Optionally assign an approved template to this survey.',
  ];

  return (
    <Modal
      title={`Step ${step} — ${stepTitles[step - 1]}`}
      subtitle={stepSubtitles[step - 1]}
      onClose={onClose}
    >
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
          onSubmit={handleSubmit}
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
              {templates.map((t: any) => (
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
            submitLabel="Create Survey"
          />
        </form>
      )}
    </Modal>
  );
}

// ── Simple modals (New/Edit Project, Edit Survey) ─────────────────────────────
function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (data: { name: string; client: string }) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({ name: '', client: '' });
  const [e, setE] = useState<Record<string, string>>({});
  const s = (k: string, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: '' }));
  };
  const sub = (ev: FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (!f.name.trim()) err.name = 'Required';
    if (!f.client.trim()) err.client = 'Required';
    if (Object.keys(err).length) {
      setE(err);
      return;
    }
    onCreated({ name: f.name, client: f.client });
    onClose();
  };
  return (
    <Modal
      title="New Project"
      subtitle="Create a project. Add surveys afterwards."
      onClose={onClose}
      maxWidth={420}
    >
      <form
        onSubmit={sub}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <Lbl t="Project Name" />
          <input
            value={f.name}
            onChange={(ev) => s('name', ev.target.value)}
            placeholder="e.g. Downtown Solar Array"
            style={inp(!!e.name)}
          />
          <Err msg={e.name} />
        </div>
        <div>
          <Lbl t="Client" />
          <input
            value={f.client}
            onChange={(ev) => s('client', ev.target.value)}
            placeholder="e.g. Helios Energy Corp"
            style={inp(!!e.client)}
          />
          <Err msg={e.client} />
        </div>
        <FooterBtns onCancel={onClose} submitLabel="Create Project" />
      </form>
    </Modal>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    name: project.name,
    client: project.client,
  });
  const [e, setE] = useState<Record<string, string>>({});
  const s = (k: string, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: '' }));
  };
  const sub = (ev: FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (!f.name.trim()) err.name = 'Required';
    if (!f.client.trim()) err.client = 'Required';
    if (Object.keys(err).length) {
      setE(err);
      return;
    }
    onSaved({ ...project, name: f.name, client: f.client });
    onClose();
  };
  return (
    <Modal
      title="Edit Project"
      subtitle={`Updating ${project.name}`}
      onClose={onClose}
      maxWidth={420}
    >
      <form
        onSubmit={sub}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <Lbl t="Project Name" />
          <input
            value={f.name}
            onChange={(ev) => s('name', ev.target.value)}
            style={inp(!!e.name)}
          />
          <Err msg={e.name} />
        </div>
        <div>
          <Lbl t="Client" />
          <input
            value={f.client}
            onChange={(ev) => s('client', ev.target.value)}
            style={inp(!!e.client)}
          />
          <Err msg={e.client} />
        </div>
        <FooterBtns onCancel={onClose} submitLabel="Save Changes" />
      </form>
    </Modal>
  );
}

function EditSurveyModal({
  survey,
  platformOperators,
  fieldCrewMembers,
  onClose,
  onSaved,
}: {
  survey: SiteSurvey;
  platformOperators: User[];
  fieldCrewMembers: User[];
  onClose: () => void;
  onSaved: (s: SiteSurvey) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    name: survey.name,
    status: survey.status,
    scheduledDate: survey.scheduledDate,
    assignedTo: survey.assignedTo?.id || '',
    address: survey.location.address,
    city: survey.location.city,
    state: survey.location.state,
    zip: survey.location.zip,
    contactName: survey.contact.name,
    contactRole: survey.contact.role,
    contactPhone: survey.contact.phone,
    contactEmail: survey.contact.email,
    woNumber: survey.workOrder.number,
    woDesc: survey.workOrder.description,
    woPriority: survey.workOrder.priority,
    woCreatedBy: survey.workOrder.createdBy,
  });
  const [e, setE] = useState<Record<string, string>>({});
  const s = (k: string, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: '' }));
  };
  const sub = (ev: FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    Object.keys(f).forEach((k) => {
      if (!f[k] || !f[k].toString().trim()) err[k] = 'Required';
    });
    if (Object.keys(err).length) {
      setE(err);
      return;
    }
    const crew =
      fieldCrewMembers.find((m) => m.id === f.assignedTo) || survey.assignedTo;
    onSaved({
      ...survey,
      name: f.name,
      status: f.status,
      scheduledDate: f.scheduledDate,
      assignedTo: crew,
      location: {
        address: f.address,
        city: f.city,
        state: f.state,
        zip: f.zip,
      },
      contact: {
        name: f.contactName,
        role: f.contactRole,
        phone: f.contactPhone,
        email: f.contactEmail,
      },
      workOrder: {
        ...survey.workOrder,
        number: f.woNumber,
        description: f.woDesc,
        priority: f.woPriority,
        createdBy: f.woCreatedBy,
      },
    });
    onClose();
  };
  return (
    <Modal
      title="Edit Site Survey"
      subtitle={`${survey.name} · ${survey.id}`}
      onClose={onClose}
    >
      <form
        onSubmit={sub}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <div>
            <Lbl t="Survey Name" />
            <input
              value={f.name}
              onChange={(ev) => s('name', ev.target.value)}
              style={inp(!!e.name)}
            />
            <Err msg={e.name} />
          </div>
          <div>
            <Lbl t="Status" />
            <select
              value={f.status}
              onChange={(ev) => s('status', ev.target.value)}
              style={inp(!!e.status)}
            >
              {Object.keys(SiteSurveyStatus).map((st) => (
                <option key={st} value={st}>
                  {fmtStatus(st)}
                </option>
              ))}
            </select>
            <Err msg={e.status} />
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <div>
            <Lbl t="Scheduled Date & Time" />
            <input
              type="datetime-local"
              value={f.scheduledDate}
              onChange={(ev) => s('scheduledDate', ev.target.value)}
              style={inp(!!e.scheduledDate)}
            />
            <Err msg={e.scheduledDate} />
          </div>
          <div>
            <Lbl t="Assigned To" />
            <select
              value={f.assignedTo}
              onChange={(ev) => s('assignedTo', ev.target.value)}
              style={inp(!!e.assignedTo)}
            >
              <option value="">Select crew member…</option>
              {fieldCrewMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Err msg={e.assignedTo} />
          </div>
        </div>
        <SecLabel icon="assignment" label="Work Order" />
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <div>
            <Lbl t="WO Number" />
            <input
              value={f.woNumber}
              onChange={(ev) => s('woNumber', ev.target.value)}
              style={inp(!!e.woNumber)}
            />
            <Err msg={e.woNumber} />
          </div>
          <div>
            <Lbl t="Priority" />
            <select
              value={f.woPriority}
              onChange={(ev) => s('woPriority', ev.target.value)}
              style={inp(!!e.woPriority)}
            >
              {Object.keys(Priority).map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <Err msg={e.woPriority} />
          </div>
        </div>
        <div>
          <Lbl t="WO Description" />
          <input
            value={f.woDesc}
            onChange={(ev) => s('woDesc', ev.target.value)}
            style={inp(!!e.woDesc)}
          />
          <Err msg={e.woDesc} />
        </div>
        <div>
          <Lbl t="Created By" />
          <select
            value={f.woCreatedBy}
            onChange={(ev) => s('woCreatedBy', ev.target.value)}
            style={inp(!!e.woCreatedBy)}
          >
            <option value="">Select operator…</option>
            {platformOperators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
          <Err msg={e.woCreatedBy} />
        </div>
        <SecLabel icon="location_on" label="Location" />
        <div>
          <Lbl t="Address" />
          <input
            value={f.address}
            onChange={(ev) => s('address', ev.target.value)}
            style={inp(!!e.address)}
          />
          <Err msg={e.address} />
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
              value={f.city}
              onChange={(ev) => s('city', ev.target.value)}
              style={inp(!!e.city)}
            />
            <Err msg={e.city} />
          </div>
          <div>
            <Lbl t="State" />
            <input
              value={f.state}
              onChange={(ev) => s('state', ev.target.value)}
              style={inp(!!e.state)}
            />
            <Err msg={e.state} />
          </div>
          <div>
            <Lbl t="ZIP" />
            <input
              value={f.zip}
              onChange={(ev) => s('zip', ev.target.value)}
              style={inp(!!e.zip)}
            />
            <Err msg={e.zip} />
          </div>
        </div>
        <SecLabel icon="contact_page" label="Contact" />
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <div>
            <Lbl t="Name" />
            <input
              value={f.contactName}
              onChange={(ev) => s('contactName', ev.target.value)}
              style={inp(!!e.contactName)}
            />
            <Err msg={e.contactName} />
          </div>
          <div>
            <Lbl t="Role" />
            <input
              value={f.contactRole}
              onChange={(ev) => s('contactRole', ev.target.value)}
              style={inp(!!e.contactRole)}
            />
            <Err msg={e.contactRole} />
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <div>
            <Lbl t="Phone" />
            <input
              value={f.contactPhone}
              onChange={(ev) => s('contactPhone', ev.target.value)}
              style={inp(!!e.contactPhone)}
            />
            <Err msg={e.contactPhone} />
          </div>
          <div>
            <Lbl t="Email" />
            <input
              type="email"
              value={f.contactEmail}
              onChange={(ev) => s('contactEmail', ev.target.value)}
              style={inp(!!e.contactEmail)}
            />
            <Err msg={e.contactEmail} />
          </div>
        </div>
        <FooterBtns onCancel={onClose} submitLabel="Save Changes" />
      </form>
    </Modal>
  );
}

// ── Project Row ───────────────────────────────────────────────────────────────
function ChangeStatusModal({
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
            onChange={(e) => setStatus(e.target.value)}
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

function ProjectRow({
  project,
  onViewSurvey,
  onAddSurvey,
  onEditProject,
  onEditSurvey,
  onChangeStatus,
  platformOperators,
  openMenu,
  setOpenMenu,
}: {
  project: Project;
  onViewSurvey: (s: SiteSurvey) => void;
  onAddSurvey: (p: Project) => void;
  onEditProject: (p: Project) => void;
  onEditSurvey: (s: SiteSurvey) => void;
  onChangeStatus: (s: SiteSurvey) => void;
  platformOperators: User[];
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    project.siteSurveys.forEach((s: SiteSurvey) => {
      c[s.status] = (c[s.status] || 0) + 1;
    });
    return c;
  }, [project.siteSurveys]);
  const btn: CSSProperties = {
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#fff',
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    color: '#374151',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };
  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        style={{
          borderBottom: '1px solid #f1f5f9',
          cursor: 'pointer',
          background: '#fff',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        <td style={{ padding: '14px 8px 14px 20px', width: 36 }}>
          <Ms
            icon={expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
            style={{ fontSize: 20, color: '#94a3b8' }}
          />
        </td>
        <td style={{ padding: '14px 16px' }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: '#0f172a',
              margin: 0,
            }}
          >
            {project.name}
          </p>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#94a3b8',
              margin: 0,
            }}
          >
            {project.id}
          </p>
        </td>
        <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
          {project.client}
        </td>
        <td style={{ padding: '14px 16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ms icon="checklist" style={{ fontSize: 16, color: '#94a3b8' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {project.siteSurveys.length}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>surveys</span>
          </span>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.keys(counts).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
            {!project.siteSurveys.length && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                No surveys yet
              </span>
            )}
          </div>
        </td>
        <td
          style={{ padding: '14px 20px 14px 16px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'flex-end',
            }}
          >
            <button onClick={() => onAddSurvey(project)} style={btn}>
              <Ms icon="add" style={{ fontSize: 14 }} />
              Add Survey
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(openMenu === project.id ? null : project.id);
                }}
                style={{ ...btn, padding: '4px 8px' }}
              >
                ⋯
              </button>
              {openMenu === project.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 34,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    zIndex: 20,
                    minWidth: 140,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#f8fafc')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '')
                    }
                    onClick={() => {
                      setExpanded(true);
                      setOpenMenu(null);
                    }}
                  >
                    View surveys
                  </div>
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#f8fafc')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '')
                    }
                    onClick={() => {
                      onEditProject(project);
                      setOpenMenu(null);
                    }}
                  >
                    Edit project
                  </div>
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      color: '#dc2626',
                      borderTop: '1px solid #f1f5f9',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#fef2f2')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '')
                    }
                  >
                    Archive
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
      {expanded &&
        project.siteSurveys.map((s: SiteSurvey) => (
          <tr
            key={s.id}
            style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}
          >
            <td style={{ padding: '10px 8px 10px 20px' }} />
            <td style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ms
                  icon="subdirectory_arrow_right"
                  style={{ fontSize: 16, color: '#cbd5e1' }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    {s.name}
                  </p>
                  <p
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: '#94a3b8',
                      margin: 0,
                    }}
                  >
                    {s.id}
                  </p>
                </div>
              </div>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.location ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      color: '#64748b',
                    }}
                  >
                    <Ms
                      icon="location_on"
                      style={{ fontSize: 14, color: '#94a3b8' }}
                    />
                    {s.location.city}, {s.location.state}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                )}
                {s.workOrder ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: '#94a3b8',
                    }}
                  >
                    <Ms
                      icon="assignment"
                      style={{ fontSize: 13, color: '#94a3b8' }}
                    />
                    {s.workOrder.number} ·{' '}
                    <PriorityBadge priority={s.workOrder.priority} />
                  </span>
                ) : null}
              </div>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  <Ms
                    icon="calendar_month"
                    style={{ fontSize: 14, color: '#94a3b8' }}
                  />
                  {fmtDate(s.scheduledDate)}
                </span>
                {s.assignedTo && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: '#64748b',
                    }}
                  >
                    <Ms
                      icon="engineering"
                      style={{ fontSize: 13, color: '#94a3b8' }}
                    />
                    {s.assignedTo.name}
                  </span>
                )}
              </div>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <StatusBadge status={s.status} />
            </td>
            <td style={{ padding: '10px 20px 10px 16px', textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', gap: 6 }}>
                {s.status === 'PLANNED' && (
                  <button onClick={() => onEditSurvey(s)} style={btn}>
                    <Ms icon="edit" style={{ fontSize: 13 }} /> Edit
                  </button>
                )}
                <button onClick={() => onChangeStatus(s)} style={btn}>
                  <Ms icon="swap_horiz" style={{ fontSize: 13 }} /> Status
                </button>
                <button onClick={() => onViewSurvey(s)} style={btn}>
                  <Ms icon="open_in_new" style={{ fontSize: 13 }} /> View
                </button>
              </div>
            </td>
          </tr>
        ))}
      {expanded && !project.siteSurveys.length && (
        <tr style={{ background: '#fafafa' }}>
          <td
            colSpan={6}
            style={{
              textAlign: 'center',
              padding: '14px',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            No site surveys yet — add one above.
          </td>
        </tr>
      )}
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [platformOperators, setPlatformOperators] = useState<User[]>([]);
  const [fieldCrewMembers, setFieldCrewMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detailSurvey, setDetailSurvey] = useState<SiteSurvey | null>(null);
  const [addTarget, setAddTarget] = useState<Project | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editSurvey, setEditSurvey] = useState<SiteSurvey | null>(null);
  const [changingStatus, setChangingStatus] = useState<SiteSurvey | null>(null);

  useEffect(() => {
    getProjects()
      .then((data: Project[]) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  const openAddSurvey = async (project: Project) => {
    if (!platformOperators.length) {
      getUsersByType('PLATFORM_OPERATOR')
        .then(setPlatformOperators)
        .catch(() => {});
    }
    if (!fieldCrewMembers.length) {
      getUsersByType('FIELD_CREW_MEMBER')
        .then(setFieldCrewMembers)
        .catch(() => {});
    }
    setAddTarget(project);
  };

  const handleProjectCreated = async ({
    name,
    client,
  }: {
    name: string;
    client: string;
  }) => {
    const project: Project = await createProject({ name, client });
    setProjects((prev) => [project, ...(prev || [])]);
  };

  const handleProjectSaved = async (updated: Project) => {
    const project: Project = await updateProject(updated.id, updated);
    setProjects((prev) =>
      (prev || []).map((p: Project) => (p.id === project.id ? project : p)),
    );
    setEditProject(null);
  };

  const handleAddSurvey = async (
    projectId: string,
    survey: Omit<SiteSurvey, 'id'>,
  ) => {
    const newSurvey: SiteSurvey = await createSiteSurvey(projectId, survey);
    setProjects((prev) =>
      (prev || []).map((p: Project) =>
        p.id === projectId
          ? { ...p, siteSurveys: [...p.siteSurveys, newSurvey] }
          : p,
      ),
    );
    setAddTarget(null);
  };

  const handleSurveySaved = async (updated: SiteSurvey) => {
    const project = (projects || []).find((p: Project) =>
      p.siteSurveys.some((s: SiteSurvey) => s.id === updated.id),
    );
    if (!project) return;
    const survey: SiteSurvey = await updateSurvey(
      project.id,
      updated.id,
      updated,
    );
    setProjects((prev) =>
      (prev || []).map((p: Project) => ({
        ...p,
        siteSurveys: p.siteSurveys.map((s: SiteSurvey) =>
          s.id === survey.id ? survey : s,
        ),
      })),
    );
    setEditSurvey(null);
  };

  const stats = useMemo(() => {
    const all = (projects || []).flatMap((p: Project) => p.siteSurveys);
    return {
      projects: (projects || []).length,
      surveys: all.length,
      inProgress: all.filter((s: SiteSurvey) => s.status === 'IN_PROGRESS')
        .length,
      pending: all.filter((s: SiteSurvey) => s.status === 'PENDING_APPROVAL')
        .length,
    };
  }, [projects]);

  const filtered = useMemo(
    () =>
      (projects || []).filter((p: Project) => {
        const q = search.toLowerCase();
        return (
          (!q ||
            p.name.toLowerCase().includes(q) ||
            p.client.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)) &&
          (statusFilter === 'ALL' ||
            p.siteSurveys.some((s: SiteSurvey) => s.status === statusFilter))
        );
      }),
    [projects, search, statusFilter],
  );

  const selSt: CSSProperties = {
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#fff',
    padding: '6px 10px',
    fontSize: 12,
    color: '#374151',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  if (projects === null)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0f172a',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Loading projects…
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Geist','Inter',system-ui,sans-serif",
        color: '#0f172a',
        padding: '32px 24px',
      }}
      onClick={() => setOpenMenu(null)}
    >
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Project Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Track projects and their site surveys
            </p>
          </div>
          <button
            onClick={() => setNewProjOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 8,
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Ms icon="add" style={{ fontSize: 18, color: '#fff' }} />
            New Project
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: 14,
          }}
        >
          <StatCard
            title="Projects"
            value={stats.projects}
            icon="folder_open"
            description="total projects"
          />
          <StatCard
            title="Surveys"
            value={stats.surveys}
            icon="checklist"
            description="across all projects"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon="pending_actions"
            description="currently active"
          />
          <StatCard
            title="Awaiting"
            value={stats.pending}
            icon="rate_review"
            description="pending approval"
          />
        </div>

        <div
          style={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            background: '#fff',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              padding: '14px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>All Projects</span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginLeft: 'auto',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                  }}
                >
                  <Ms
                    icon="search"
                    style={{ fontSize: 17, color: '#94a3b8' }}
                  />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search project or client…"
                  style={{ ...selSt, paddingLeft: 30, width: 210 }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...selSt, width: 160 }}
              >
                <option value="ALL">All Statuses</option>
                {Object.keys(SiteSurveyStatus).map((s) => (
                  <option key={s} value={s}>
                    {fmtStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {[
                    '',
                    'Project',
                    'Client',
                    'Surveys',
                    'Survey Status',
                    'Actions',
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: i === 0 ? '12px 8px 12px 20px' : '12px 16px',
                        textAlign: i === 5 ? 'right' : 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#94a3b8',
                        paddingRight: i === 5 ? '20px' : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '48px 0',
                        color: '#94a3b8',
                        fontSize: 13,
                      }}
                    >
                      No projects match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p: Project) => (
                    <ProjectRow
                      key={p.id}
                      project={p}
                      onViewSurvey={async (s: SiteSurvey) => {
                        const workOrder = await getSiteSurveyWorkOrder(s.id);
                        setDetailSurvey({ ...s, workOrder });
                      }}
                      onAddSurvey={openAddSurvey}
                      onEditProject={setEditProject}
                      onEditSurvey={setEditSurvey}
                      onChangeStatus={setChangingStatus}
                      platformOperators={platformOperators}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              Showing{' '}
              <strong style={{ color: '#374151' }}>{filtered.length}</strong> of{' '}
              <strong style={{ color: '#374151' }}>{projects.length}</strong>{' '}
              projects
            </p>
          </div>
        </div>
      </div>

      {detailSurvey && (
        <SurveyDetailModal
          survey={detailSurvey}
          onClose={() => setDetailSurvey(null)}
        />
      )}
      {addTarget && (
        <AddSurveyWizard
          project={addTarget}
          platformOperators={platformOperators}
          fieldCrewMembers={fieldCrewMembers}
          onClose={() => setAddTarget(null)}
          onAdded={handleAddSurvey}
        />
      )}
      {newProjOpen && (
        <NewProjectModal
          onClose={() => setNewProjOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSaved={handleProjectSaved}
        />
      )}
      {editSurvey && (
        <EditSurveyModal
          survey={editSurvey}
          platformOperators={platformOperators}
          fieldCrewMembers={fieldCrewMembers}
          onClose={() => setEditSurvey(null)}
          onSaved={handleSurveySaved}
        />
      )}
      {changingStatus && (
        <ChangeStatusModal
          survey={changingStatus}
          onClose={() => setChangingStatus(null)}
          onChanged={(updated) => {
            setProjects((prev) =>
              (prev || []).map((p) => ({
                ...p,
                siteSurveys: p.siteSurveys.map((s) =>
                  s.id === updated.id ? { ...s, status: updated.status } : s,
                ),
              })),
            );
            setChangingStatus(null);
          }}
        />
      )}
    </div>
  );
}
