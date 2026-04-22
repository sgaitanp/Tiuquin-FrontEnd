'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAssignedSurveys,
  getAllSiteSurveys,
  updateSiteSurveyStatus,
} from '@/services/surveyService';
import { getSiteSurveyFiles } from '@/services/projectService';
import { downloadFile, previewFile } from '@/services/fileService';
import {
  getTemplateById,
  getApprovedTemplates,
} from '@/services/templateService';
import {
  getTemplate,
  createSurvey,
  assignTemplate,
  updateSurvey,
} from '@/actions/surveyFormActions';
import { getProjects } from '@/services/projectService';
import { getUsersByType } from '@/services/userService';
import SurveyList from './SurveyList';
import SurveyForm from './SurveyForm';
import CreateSurveyModal from './CreateSurveyModal';
import EditSurveyModal from './EditSurveyModal';
import AssignTemplateModal from './AssignTemplateModal';
import { fmtDate, fmtTime, STATUS_CFG } from './shared';

function useMaterialSymbols() {
  useEffect(() => {
    const id = 'material-symbols-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';
      document.head.appendChild(link);
    }
  }, []);
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

function SurveyFiles({ surveyId }: { surveyId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSurveyFiles(surveyId)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#94a3b8',
          fontSize: 12,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          sync
        </span>
        Loading files…
      </div>
    );

  if (!files.length)
    return (
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        No files attached to this survey.
      </p>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map((file: any) => {
        const isImage = file.fileType?.startsWith('image/');
        const isPdf = file.fileType === 'application/pdf';
        const fmt = (b: number) =>
          b < 1024 * 1024
            ? `${(b / 1024).toFixed(1)} KB`
            : `${(b / (1024 * 1024)).toFixed(1)} MB`;
        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                color: isPdf ? '#ef4444' : isImage ? '#3b82f6' : '#64748b',
                flexShrink: 0,
              }}
            >
              {isPdf
                ? 'picture_as_pdf'
                : isImage
                  ? 'image'
                  : 'insert_drive_file'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0f172a',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.originalFilename}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {fmt(file.fileSize)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() =>
                  previewFile(file.id).catch(() => alert('Preview failed'))
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 13 }}
                >
                  visibility
                </span>
                Preview
              </button>
              <button
                onClick={() =>
                  downloadFile(file.id, file.originalFilename).catch(() =>
                    alert('Download failed'),
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 6,
                  border: 'none',
                  background: '#0f172a',
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 13, color: '#fff' }}
                >
                  download
                </span>
                Download
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SurveyMapView({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const load = () =>
      new Promise<any>((resolve) => {
        if ((window as any).L) {
          resolve((window as any).L);
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => resolve((window as any).L);
        document.head.appendChild(s);
      });
    load().then((L) => {
      if (!mapRef.current || mapInstance.current) return;
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);
      mapInstance.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .addTo(map)
        .bindPopup(label)
        .openPopup();
    });
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [lat, lng, label]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        ref={mapRef}
        style={{
          height: 240,
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          zIndex: 0,
        }}
      />
      <p
        style={{
          fontSize: 11,
          color: '#64748b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
          location_on
        </span>
        Lat: {lat} · Lng: {lng}
      </p>
    </div>
  );
}

export default function SurveyFormDashboard() {
  useMaterialSymbols();

  const [surveys, setSurveys] = useState<any[] | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [crewMembers, setCrewMembers] = useState<any[]>([]);
  const [platformOperators, setPlatformOperators] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [assigning, setAssigning] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState<any>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [fillingOut, setFillingOut] = useState(false);
  const [role, setRole] = useState('');

  // Fill-out modal: user-resizable via the bottom-right handle.
  const FILL_MODAL_MIN_W = 420;
  const FILL_MODAL_MIN_H = 320;
  const [fillModalSize, setFillModalSize] = useState<{ w: number; h: number }>({
    w: 720,
    h: 700,
  });
  useEffect(() => {
    if (!fillingOut) return;
    setFillModalSize({
      w: Math.min(720, Math.floor(window.innerWidth * 0.95)),
      h: Math.min(700, Math.floor(window.innerHeight * 0.85)),
    });
  }, [fillingOut]);
  const startFillModalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = fillModalSize.w;
    const startH = fillModalSize.h;
    const onMove = (ev: MouseEvent) => {
      const maxW = window.innerWidth - 20;
      const maxH = window.innerHeight - 20;
      const w = Math.min(maxW, Math.max(FILL_MODAL_MIN_W, startW + (ev.clientX - startX)));
      const h = Math.min(maxH, Math.max(FILL_MODAL_MIN_H, startH + (ev.clientY - startY)));
      setFillModalSize({ w, h });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Normalize getAllSiteSurveys shape to match frontend expectations
  const normalizeSurvey = (s: any) => ({
    ...s,
    projectId: s.project?.id ?? s.projectId ?? null,
    projectName: s.project?.name ?? s.projectName ?? null,
    client: s.project?.client ?? s.client ?? null,
    latitude: s.location?.latitude ?? s.latitude ?? null,
    longitude: s.location?.longitude ?? s.longitude ?? null,
  });

  const loadSurveys = useCallback(() => {
    const currentUser = JSON.parse(
      sessionStorage.getItem('currentUser') ?? 'null',
    );
    const userId = currentUser?.id ?? undefined;
    const userRole = currentUser?.type ?? '';
    const canSeeAll = [
      'ADMIN',
      'PROJECT_MANAGER',
      'PLATFORM_OPERATOR',
    ].includes(userRole);
    if (canSeeAll) {
      getAllSiteSurveys()
        .then((data) => setSurveys(data.map(normalizeSurvey)))
        .catch(() => setSurveys([]));
    } else if (userId) {
      getAssignedSurveys(userId)
        .then((data) => setSurveys(data.map(normalizeSurvey)))
        .catch(() => setSurveys([]));
    } else {
      setSurveys([]);
    }
  }, []);

  useEffect(() => {
    const currentUser = JSON.parse(
      sessionStorage.getItem('currentUser') ?? 'null',
    );
    setRole(currentUser?.type ?? '');
    loadSurveys();
  }, []);

  useEffect(() => {
    if (!selected?.templateId) {
      setTemplate(null);
      setTemplateLoading(false);
      return;
    }
    if (template?.id === selected.templateId) return;
    setTemplate(null);
    setTemplateLoading(true);
    getTemplateById(selected.templateId)
      .then(setTemplate)
      .catch(() => {})
      .finally(() => setTemplateLoading(false));
  }, [selected?.id, selected?.templateId]);

  const handleCreated = (s: any) => {
    setSurveys((prev) => [...(prev ?? []), normalizeSurvey(s)]);
    setSelected(normalizeSurvey(s));
  };
  const handleEdited = (s: any) => {
    setSurveys((prev) =>
      (prev ?? []).map((x) => (x.id === s.id ? normalizeSurvey(s) : x)),
    );
    setSelected(normalizeSurvey(s));
  };
  const handleSubmitted = (s: any) => {
    loadSurveys();
    setSelected((prev: any) => ({ ...prev, status: 'PENDING_APPROVAL' }));
  };
  const handleAssigned = async (templateId: string) => {
    await assignTemplate(selected.id, templateId);
    const tmpl = await getTemplateById(templateId);
    setTemplate(tmpl);
    setSurveys((prev) =>
      (prev ?? []).map((s) =>
        s.id === selected.id ? { ...s, templateId, responses: {} } : s,
      ),
    );
    setSelected((prev: any) => ({ ...prev, templateId, responses: {} }));
    setAssigning(null);
  };

  const isManager = ['ADMIN', 'PROJECT_MANAGER', 'PLATFORM_OPERATOR'].includes(
    role,
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: "'Geist','Inter',system-ui,sans-serif",
        color: '#0f172a',
      }}
    >
      <style>{`.material-symbols-outlined{font-display:block}`}</style>

      <SurveyList
        surveys={surveys}
        templates={templates}
        selected={selected}
        search={search}
        statusFilter={statusFilter}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onSelect={setSelected}
        onNew={() => setCreating(true)}
      />

      {/* Right Panel */}
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
                  onClick={() => setChangingStatus(selected)}
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
                      lat={parseFloat(
                        selected.latitude ?? selected.location?.latitude,
                      )}
                      lng={parseFloat(
                        selected.longitude ?? selected.location?.longitude,
                      )}
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
                    {(template.sections ?? []).map((sec: any, si: number) => (
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
                            {sec.questions?.filter((q: any) => !q.isFollowUp)
                              .length ?? 0}{' '}
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
                          {(sec.questions ?? [])
                            .filter((q: any) => !q.isFollowUp)
                            .map((q: any, qi: number) => (
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
                                <div style={{ flex: 1 }}>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      color: '#374151',
                                      margin: 0,
                                    }}
                                  >
                                    {q.questionText}
                                  </p>
                                  {q.options && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 4,
                                        marginTop: 6,
                                      }}
                                    >
                                      {q.options.map((o: any) => (
                                        <span
                                          key={o.id}
                                          style={{
                                            fontSize: 10,
                                            color: '#64748b',
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 4,
                                            padding: '1px 7px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3,
                                          }}
                                        >
                                          {o.text}
                                          {o.followUpQuestionId && (
                                            <Ms
                                              icon="subdirectory_arrow_right"
                                              style={{
                                                fontSize: 11,
                                                color: '#f59e0b',
                                              }}
                                            />
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: '#94a3b8',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    flexShrink: 0,
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {q.type}
                                </span>
                              </div>
                            ))}
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
                      onClick={() => setFillingOut(true)}
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
                      lat={parseFloat(
                        selected.latitude ?? selected.location?.latitude,
                      )}
                      lng={parseFloat(
                        selected.longitude ?? selected.location?.longitude,
                      )}
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

      {creating && (
        <CreateSurveyModal
          projects={projects}
          templates={templates}
          crewMembers={crewMembers}
          platformOperators={platformOperators}
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
        />
      )}
      {editing && (
        <EditSurveyModal
          survey={selected}
          crewMembers={crewMembers}
          platformOperators={platformOperators}
          onClose={() => setEditing(false)}
          onSaved={handleEdited}
        />
      )}
      {assigning && (
        <AssignTemplateModal
          currentTemplateId={assigning.templateId ?? null}
          templates={templates}
          onClose={() => setAssigning(null)}
          onAssign={handleAssigned}
        />
      )}

      {fillingOut && selected && template && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 14,
              width: fillModalSize.w,
              height: fillModalSize.h,
              minWidth: FILL_MODAL_MIN_W,
              minHeight: FILL_MODAL_MIN_H,
              maxWidth: '98vw',
              maxHeight: '98vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {selected.name}
                </h2>
                <p
                  style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}
                >
                  {template.name} · v{template.version}
                </p>
              </div>
              <button
                onClick={() => setFillingOut(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Ms icon="close" style={{ fontSize: 20, color: '#64748b' }} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SurveyForm
                survey={selected}
                template={template}
                onResponsesChange={(next) =>
                  setSelected((p: any) => ({ ...p, responses: next }))
                }
                onSubmitted={(s) => {
                  handleSubmitted(s);
                  setFillingOut(false);
                }}
              />
            </div>
            {/* Resize handle — drag from bottom-right to resize the modal */}
            <div
              onMouseDown={startFillModalResize}
              title="Drag to resize"
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 18,
                height: 18,
                cursor: 'nwse-resize',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: 2,
                color: '#94a3b8',
                background:
                  'linear-gradient(135deg, transparent 0 55%, #cbd5e1 55% 60%, transparent 60% 70%, #cbd5e1 70% 75%, transparent 75% 85%, #cbd5e1 85% 90%, transparent 90%)',
                borderBottomRightRadius: 14,
              }}
            />
          </div>
        </div>
      )}

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
              {changingStatus.name}
            </p>
            <select
              defaultValue={changingStatus.status}
              id="survey-status-select"
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
              {[
                'PLANNED',
                'IN_PROGRESS',
                'PENDING_APPROVAL',
                'APPROVED',
                'CLOSED',
                'REJECTED',
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
              <button
                onClick={() => setChangingStatus(null)}
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
                  const sel = (
                    document.getElementById(
                      'survey-status-select',
                    ) as HTMLSelectElement
                  ).value;
                  setStatusSaving(true);
                  try {
                    await updateSiteSurveyStatus(changingStatus.id, sel);
                    setSurveys((prev) =>
                      (prev ?? []).map((s) =>
                        s.id === changingStatus.id ? { ...s, status: sel } : s,
                      ),
                    );
                    setSelected((prev: any) => ({ ...prev, status: sel }));
                    setChangingStatus(null);
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
    </div>
  );
}
