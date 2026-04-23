import type {
  Project,
  SiteSurvey,
  WorkOrder,
} from '@/types/project';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('token') ?? '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getSiteSurveyFiles(siteSurveyId: string) {
  const res = await fetch(`${API_BASE}/site-surveys/${siteSurveyId}/files`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok)
    throw new Error(`Failed to fetch site survey files (${res.status})`);
  return res.json();
}

export async function getSiteSurveyWorkOrder(
  siteSurveyId: string,
): Promise<WorkOrder | null> {
  const res = await fetch(
    `${API_BASE}/site-surveys/${siteSurveyId}/work-order`,
    {
      headers: authHeaders(),
      cache: 'no-store',
    },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
  const projects: Project[] = await res.json();

  // Normalize siteSurveys shape for the frontend
  return projects.map((p) => ({
    ...p,
    siteSurveys: (p.siteSurveys ?? []).map((s) => ({
      id: s.id,
      name: s.name ?? '',
      status: s.status ?? 'PLANNED',
      scheduledDate: s.scheduledDate ?? null,
      location: s.location ?? null,
      contact: s.contact ?? null,
      projectId: p.id,
      projectName: p.name,
      client: p.client,
      templateId: s.templateId ?? null,
      assignedTo: s.assignedTo ?? undefined,
      workOrder: s.workOrder ?? null,
      responses: s.responses ?? {},
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
    })),
  }));
}

export async function getProjectById(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);
  return res.json();
}

export async function createProject(data: {
  name: string;
  client: string;
}): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, siteSurveys: [] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to create project (${res.status}): ${body}`);
  }
  return res.json();
}

export async function createSiteSurvey(
  projectId: string,
  survey: Omit<SiteSurvey, 'id' | 'workOrder'> & {
    workOrder: Omit<WorkOrder, 'id'>;
    files?: File[];
  },
): Promise<SiteSurvey> {
  // Step 1 — create work order
  const woRes = await fetch(`${API_BASE}/workOrders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      number: survey.workOrder.number,
      description: survey.workOrder.description ?? null,
      priority: survey.workOrder.priority,
      createdBy: survey.workOrder.createdBy,
      createdAt: survey.workOrder.createdAt ?? new Date().toISOString(),
    }),
  });
  if (!woRes.ok) {
    const body = await woRes.text().catch(() => '');
    throw new Error(`Failed to create work order (${woRes.status}): ${body}`);
  }
  const workOrder = await woRes.json();

  // Step 2 — create site survey (multipart with optional files)
  const siteSurveyData = {
    name: survey.name,
    status: survey.status ?? 'PLANNED',
    scheduledDate: survey.scheduledDate,
    location: {
      ...survey.location,
      latitude: survey.latitude ?? null,
      longitude: survey.longitude ?? null,
    },
    contact: survey.contact,
    templateId: survey.templateId ?? null,
  };

  const formData = new FormData();
  formData.append(
    'siteSurvey',
    new Blob([JSON.stringify(siteSurveyData)], { type: 'application/json' }),
  );

  const surveyFiles: File[] = survey.files ?? [];
  surveyFiles.forEach((file) => {
    const key = crypto.randomUUID();
    formData.append(key, file);
  });

  const ssRes = await fetch(
    `${API_BASE}/projects/${projectId}/work-orders/${workOrder.id}/site-surveys`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    },
  );
  if (!ssRes.ok) {
    const body = await ssRes.text().catch(() => '');
    throw new Error(`Failed to create site survey (${ssRes.status}): ${body}`);
  }
  const siteSurvey = await ssRes.json();

  // Step 3 — assign user if provided
  if (survey.assignedTo?.id) {
    const assignRes = await fetch(
      `${API_BASE}/site-surveys/${siteSurvey.id}/assign-user/${survey.assignedTo.id}`,
      {
        method: 'POST',
        headers: authHeaders(),
      },
    );
    if (!assignRes.ok) {
      const body = await assignRes.text().catch(() => '');
      throw new Error(`Failed to assign user (${assignRes.status}): ${body}`);
    }
  }

  return {
    ...siteSurvey,
    projectId,
    workOrder: { ...workOrder },
    assignedTo: survey.assignedTo ?? null,
    templateId: null,
    responses: {},
  };
}
