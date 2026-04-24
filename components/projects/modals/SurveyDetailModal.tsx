import type { SiteSurvey } from '@/types/project';
import Modal from '../common/Modal';
import SurveyMapView from '@/components/survey/common/SurveyMapView';
import {
  Ms,
  StatusBadge,
  PriorityBadge,
  SecLabel,
  fmtDate,
  fmtTime,
  initials,
} from '../common/shared';

/**
 * Read-only detail view of a site survey: status + schedule,
 * assigned field crew, work order, location, and contact.
 */
export default function SurveyDetailModal({
  survey,
  onClose,
}: {
  survey: SiteSurvey;
  onClose: () => void;
}) {
  return (
    <Modal
      title={survey.name}
      subtitle={`Site Survey ID: ${survey.id}`}
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
                <span style={{ fontSize: 12, color: '#0f172a' }}>
                  <span style={{ fontWeight: 500 }}>Work Order ID:</span>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {survey.workOrder.number}
                  </span>
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
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
                {survey.location.city}, {survey.location.state}{' '}
                {survey.location.zip}
              </p>
              {(survey.latitude || survey.location.latitude) && (
                <SurveyMapView
                  lat={Number(survey.latitude ?? survey.location.latitude)}
                  lng={Number(survey.longitude ?? survey.location.longitude)}
                  label={survey.name}
                />
              )}
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
