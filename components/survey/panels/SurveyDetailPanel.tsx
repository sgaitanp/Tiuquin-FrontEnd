'use client';

import SurveyFiles from '../common/SurveyFiles';
import SurveyMapView from '../common/SurveyMapView';
import { fmtDate, STATUS_CFG } from '../common/shared';
import { TYPE_CFG } from '@/components/templates/common/shared';
import type { SiteSurvey } from '@/types/project';
import type { Option, Question, QuestionType, Template } from '@/types/template';

function QuestionTypePill({ type }: { type: string }) {
  const cfg = TYPE_CFG[type as QuestionType];
  if (!cfg) {
    return (
      <span style={{ fontSize: 10, color: '#94a3b8', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px', flexShrink: 0, fontFamily: 'monospace' }}>
        {type}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}33`, borderRadius: 5, padding: '1px 7px', flexShrink: 0, fontWeight: 500 }}>
      <Ms icon={cfg.icon} style={{ fontSize: 11, color: cfg.color }} />
      {cfg.label}
    </span>
  );
}

const Ms = ({
  icon,
  style = {},
}: {
  icon: string;
  style?: React.CSSProperties;
}) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {icon}
  </span>
);

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.not_started;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
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
      {c.label}
    </span>
  );
}

/**
 * Right-hand panel of the survey dashboard.
 *
 * Renders three mutually-exclusive states depending on the selection
 * and the viewer's role:
 *   1. nothing selected → empty state
 *   2. a manager views a survey → full detail view with template outline
 *   3. a crew member views a survey → same detail view + "Fill Out" button
 *
 * All mutating actions are surfaced via `onChangeStatus` / `onFillOut`
 * callbacks — the panel itself is read-only.
 */
export default function SurveyDetailPanel({
  selected,
  template,
  templateLoading,
  isManager,
  onChangeStatus,
  onFillOut,
}: {
  selected: SiteSurvey | null;
  template: Template | null;
  templateLoading: boolean;
  isManager: boolean;
  onChangeStatus: () => void;
  onFillOut: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Empty state */}
      {!selected && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
          }}
        >
          <Ms icon="assignment" style={{ fontSize: 48, color: '#e2e8f0' }} />
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#64748b',
              margin: 0,
            }}
          >
            Select a survey
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Pick one from the list
          </p>
        </div>
      )}

      {/* Manager detail view with map */}
      {selected && isManager && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    margin: '0 0 4px',
                  }}
                >
                  {selected.projectName} · {selected.client}
                </p>
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
                    {selected.name}
                  </h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  {selected.scheduledDate && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ms
                        icon="calendar_month"
                        style={{ fontSize: 14, color: '#94a3b8' }}
                      />
                      {fmtDate(selected.scheduledDate)}
                    </span>
                  )}
                  {selected.assignedTo && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ms
                        icon="engineering"
                        style={{ fontSize: 14, color: '#94a3b8' }}
                      />
                      {selected.assignedTo.name}
                    </span>
                  )}
                  {selected.templateId && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ms
                        icon="description"
                        style={{ fontSize: 14, color: '#94a3b8' }}
                      />
                      Template: {selected.templateId}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onChangeStatus}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 7,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#374151',
                  flexShrink: 0,
                }}
              >
                <Ms icon="swap_horiz" style={{ fontSize: 14 }} />
                Change Status
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Location info */}
            {selected.location && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ms
                    icon="location_on"
                    style={{ fontSize: 16, color: '#64748b' }}
                  />
                  Location
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: '#374151',
                    margin: '0 0 12px',
                  }}
                >
                  {[
                    selected.location.address,
                    selected.location.city,
                    selected.location.state,
                    selected.location.zip,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>

                {/* Map */}
                {(selected.latitude || selected.location?.latitude) && (
                  <SurveyMapView
                    lat={Number(selected.latitude ?? selected.location?.latitude)}
                    lng={Number(selected.longitude ?? selected.location?.longitude)}
                    label={selected.name}
                  />
                )}
              </div>
            )}

            {/* Contact info */}
            {selected.contact && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ms
                    icon="contact_page"
                    style={{ fontSize: 16, color: '#64748b' }}
                  />
                  Contact
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 13,
                    color: '#374151',
                  }}
                >
                  <span>
                    <strong style={{ color: '#64748b' }}>Name:</strong>{' '}
                    {selected.contact.name}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Role:</strong>{' '}
                    {selected.contact.role}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Phone:</strong>{' '}
                    {selected.contact.phone}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Email:</strong>{' '}
                    {selected.contact.email}
                  </span>
                </div>
              </div>
            )}

            {/* Attached files */}
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: '0 0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ms
                  icon="attach_file"
                  style={{ fontSize: 16, color: '#64748b' }}
                />
                Attached Files
              </p>
              <SurveyFiles surveyId={selected.id} />
            </div>

            {/* Template info */}
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: '0 0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ms
                  icon="description"
                  style={{ fontSize: 16, color: '#64748b' }}
                />
                Template
              </p>
              {templateLoading ? (
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Loading template…
                </p>
              ) : template ? (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {/* Template header */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: 0,
                      }}
                    >
                      {template.name}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        background: '#f1f5f9',
                        borderRadius: 5,
                        padding: '1px 7px',
                      }}
                    >
                      v{template.version}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#15803d',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 5,
                        padding: '1px 7px',
                      }}
                    >
                      {template.status}
                    </span>
                  </div>
                  {/* Sections */}
                  {(template.sections ?? []).map((sec, si) => (
                    <div
                      key={sec.id ?? si}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      {/* Section header */}
                      <div
                        style={{
                          padding: '10px 16px',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#fff',
                            }}
                          >
                            {si + 1}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0f172a',
                            margin: 0,
                          }}
                        >
                          {sec.name}
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            marginLeft: 'auto',
                          }}
                        >
                          {sec.questions?.filter((q) => !q.followUp).length ?? 0}{' '}
                          questions
                        </span>
                      </div>
                      {/* Questions */}
                      <div
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {(() => {
                          const qs = sec.questions ?? [];
                          const byId = new Map<string, Question>(qs.map((qq) => [qq.id, qq]));
                          const topLevel = qs.filter((qq) => !qq.followUp);
                          return topLevel.map((q, qi) => (
                            <div
                              key={q.id ?? qi}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: '#f8fafc',
                                border: '1px solid #f1f5f9',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#94a3b8',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                {qi + 1}.
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: '#374151',
                                    margin: 0,
                                  }}
                                >
                                  {q.questionText}
                                </p>
                                {q.options && q.options.length > 0 && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                      marginTop: 6,
                                    }}
                                  >
                                    {q.options.map((o: Option) => {
                                      const followUp = o.followUpQuestionId ? byId.get(o.followUpQuestionId) : null;
                                      return (
                                        <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          <span
                                            style={{
                                              fontSize: 10,
                                              color: '#64748b',
                                              background: '#fff',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: 4,
                                              padding: '2px 7px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 4,
                                              alignSelf: 'flex-start',
                                            }}
                                          >
                                            {o.text}
                                            {followUp && (
                                              <Ms icon="subdirectory_arrow_right" style={{ fontSize: 11, color: '#f59e0b' }} />
                                            )}
                                          </span>
                                          {followUp && (
                                            <div
                                              style={{
                                                marginLeft: 18,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 8,
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                background: '#fffbeb',
                                                border: '1px solid #fde68a',
                                              }}
                                            >
                                              <Ms icon="subdirectory_arrow_right" style={{ fontSize: 13, color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 11, color: '#78350f', margin: 0 }}>
                                                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 9, marginRight: 6 }}>Follow-up</span>
                                                  {followUp.questionText}
                                                </p>
                                                {followUp.options && followUp.options.length > 0 && (
                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                                    {followUp.options.map((fo) => (
                                                      <span key={fo.id} style={{ fontSize: 10, color: '#78350f', background: '#fff', border: '1px solid #fde68a', borderRadius: 4, padding: '1px 6px' }}>
                                                        {fo.text}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                              <QuestionTypePill type={followUp.type} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <QuestionTypePill type={q.type} />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  No template assigned to this survey.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Field crew — same detail view as manager + Fill Out button */}
      {selected && !isManager && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    margin: '0 0 4px',
                  }}
                >
                  {selected.projectName}
                </p>
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
                    {selected.name}
                  </h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  {selected.scheduledDate && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ms
                        icon="calendar_month"
                        style={{ fontSize: 14, color: '#94a3b8' }}
                      />
                      {fmtDate(selected.scheduledDate)}
                    </span>
                  )}
                  {selected.templateId && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ms
                        icon="description"
                        style={{ fontSize: 14, color: '#94a3b8' }}
                      />
                      Template ID: {selected.templateId}
                    </span>
                  )}
                </div>
              </div>
              {template &&
                !['PENDING_APPROVAL', 'CLOSED', 'REJECTED'].includes(
                  selected.status,
                ) && (
                  <button
                    onClick={onFillOut}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 8,
                      border: 'none',
                      background: '#0f172a',
                      color: '#fff',
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Ms
                      icon="edit_note"
                      style={{ fontSize: 16, color: '#fff' }}
                    />
                    Fill Out Survey
                  </button>
                )}
              {['PENDING_APPROVAL', 'CLOSED', 'REJECTED'].includes(
                selected.status,
              ) && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    padding: '8px 14px',
                    flexShrink: 0,
                  }}
                >
                  Survey submitted
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {selected.location && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ms
                    icon="location_on"
                    style={{ fontSize: 16, color: '#64748b' }}
                  />
                  Location
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: '#374151',
                    margin: '0 0 12px',
                  }}
                >
                  {[
                    selected.location.address,
                    selected.location.city,
                    selected.location.state,
                    selected.location.zip,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {(selected.latitude || selected.location?.latitude) && (
                  <SurveyMapView
                    lat={Number(selected.latitude ?? selected.location?.latitude)}
                    lng={Number(selected.longitude ?? selected.location?.longitude)}
                    label={selected.name}
                  />
                )}
              </div>
            )}

            {selected.contact && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ms
                    icon="contact_page"
                    style={{ fontSize: 16, color: '#64748b' }}
                  />
                  Contact
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 13,
                    color: '#374151',
                  }}
                >
                  <span>
                    <strong style={{ color: '#64748b' }}>Name:</strong>{' '}
                    {selected.contact.name}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Role:</strong>{' '}
                    {selected.contact.role}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Phone:</strong>{' '}
                    {selected.contact.phone}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Email:</strong>{' '}
                    {selected.contact.email}
                  </span>
                </div>
              </div>
            )}

            {/* Attached files */}
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: '0 0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ms
                  icon="attach_file"
                  style={{ fontSize: 16, color: '#64748b' }}
                />
                Attached Files
              </p>
              <SurveyFiles surveyId={selected.id} />
            </div>

            {!selected.templateId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: '#fef9c3',
                  border: '1px solid #fde047',
                }}
              >
                <Ms
                  icon="warning"
                  style={{ fontSize: 18, color: '#b45309' }}
                />
                <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                  No template assigned. Contact your project manager.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
