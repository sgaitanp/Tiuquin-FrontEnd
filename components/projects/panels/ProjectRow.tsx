import { useMemo, useState, type CSSProperties } from 'react';
import type { Project, SiteSurvey } from '@/types/project';
import {
  Ms,
  StatusBadge,
  PriorityBadge,
  fmtDate,
} from '../common/shared';

/**
 * One row in the projects table. Collapsed by default, expands to
 * show the project's site surveys in a sub-table with per-survey
 * status/view actions.
 */
export default function ProjectRow({
  project,
  onViewSurvey,
  onAddSurvey,
  onChangeStatus,
  openMenu,
  setOpenMenu,
}: {
  project: Project;
  onViewSurvey: (s: SiteSurvey) => void;
  onAddSurvey: (p: Project) => void;
  onChangeStatus: (s: SiteSurvey) => void;
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
