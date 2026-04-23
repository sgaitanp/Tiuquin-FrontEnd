'use client';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  getProjects,
  createProject,
  createSiteSurvey,
  getSiteSurveyWorkOrder,
} from '@/services/projectService';
import { getUsersByType } from '@/services/userService';
import {
  SiteSurveyStatus,
  type Project,
  type SiteSurvey,
} from '@/types/project';
import { Ms, StatCard, fmtStatus, type User } from './common/shared';
import ProjectRow from './panels/ProjectRow';
import AddSurveyWizard from './modals/AddSurveyWizard';
import SurveyDetailModal from './modals/SurveyDetailModal';
import NewProjectModal from './modals/NewProjectModal';
import ChangeStatusModal from './modals/ChangeStatusModal';

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
                        setDetailSurvey({ ...s, workOrder: workOrder ?? s.workOrder });
                      }}
                      onAddSurvey={openAddSurvey}
                      onChangeStatus={setChangingStatus}
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
