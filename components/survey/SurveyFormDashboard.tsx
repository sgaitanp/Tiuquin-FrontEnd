'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAssignedSurveys,
  getAllSiteSurveys,
} from '@/services/surveyService';
import { getTemplateById } from '@/services/templateService';
import type { SiteSurvey } from '@/types/project';
import type { Template } from '@/types/template';
import SurveyList from './panels/SurveyList';
import SurveyDetailPanel from './panels/SurveyDetailPanel';
import FillOutSurveyModal from './modals/FillOutSurveyModal';
import ChangeSurveyStatusModal from './modals/ChangeSurveyStatusModal';

/**
 * Raw site-survey shape some endpoints return with a nested `project`
 * block instead of the flat `projectId`/`projectName`/`client` fields.
 * `normalizeSurvey` below reconciles both.
 */
type RawSurvey = SiteSurvey & {
  project?: { id?: string; name?: string; client?: string };
};

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

export default function SurveyFormDashboard() {
  useMaterialSymbols();

  const [surveys, setSurveys] = useState<SiteSurvey[] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<SiteSurvey | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [changingStatus, setChangingStatus] = useState<SiteSurvey | null>(null);
  const [fillingOut, setFillingOut] = useState(false);
  const [role, setRole] = useState('');


  // Normalize getAllSiteSurveys shape to match frontend expectations.
  // Some endpoints return `project` nested; others return the flat
  // `projectId`/`projectName`/`client` fields we expect.
  const normalizeSurvey = (s: SiteSurvey): SiteSurvey => {
    const raw = s as RawSurvey;
    return {
      ...s,
      projectId: raw.project?.id ?? s.projectId ?? undefined,
      projectName: raw.project?.name ?? s.projectName ?? undefined,
      client: raw.project?.client ?? s.client ?? undefined,
      latitude: s.location?.latitude ?? s.latitude ?? null,
      longitude: s.location?.longitude ?? s.longitude ?? null,
    };
  };

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

  const handleSubmitted = () => {
    loadSurveys();
    setSelected((prev) => (prev ? { ...prev, status: 'PENDING_APPROVAL' } : prev));
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
        selected={selected}
        search={search}
        statusFilter={statusFilter}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onSelect={setSelected}
      />

      <SurveyDetailPanel
        selected={selected}
        template={template}
        templateLoading={templateLoading}
        isManager={isManager}
        onChangeStatus={() => setChangingStatus(selected)}
        onFillOut={() => setFillingOut(true)}
      />

      {fillingOut && selected && template && (
        <FillOutSurveyModal
          survey={selected}
          template={template}
          onResponsesChange={(next) =>
            setSelected((p) => (p ? { ...p, responses: next } : p))
          }
          onSubmitted={() => {
            handleSubmitted();
            setFillingOut(false);
          }}
          onClose={() => setFillingOut(false)}
        />
      )}

      {changingStatus && (
        <ChangeSurveyStatusModal
          survey={changingStatus}
          onChanged={(sel) => {
            setSurveys((prev) =>
              (prev ?? []).map((s) =>
                s.id === changingStatus.id ? { ...s, status: sel } : s,
              ),
            );
            setSelected((prev) => (prev ? { ...prev, status: sel } : prev));
          }}
          onClose={() => setChangingStatus(null)}
        />
      )}
    </div>
  );
}
