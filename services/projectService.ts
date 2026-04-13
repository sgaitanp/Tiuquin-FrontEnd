const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

function getToken(): string {
  return sessionStorage.getItem('token') ?? '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getSiteSurveyWorkOrder(siteSurveyId: string) {
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

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
  const projects = await res.json();

  // Normalize siteSurveys shape for the frontend
  return projects.map((p: any) => ({
    ...p,
    siteSurveys: (p.siteSurveys ?? []).map((s: any) => ({
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
      assignedTo: s.assignedTo ?? null,
      workOrder: s.workOrder ?? null,
      responses: s.responses ?? {},
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
    })),
  }));
}

export async function getProjectById(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);
  return res.json();
}

export async function createProject(data: { name: string; client: string }) {
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

export async function createSiteSurvey(projectId: string, survey: any) {
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

  // Step 2 — create site survey
  const ssRes = await fetch(
    `${API_BASE}/projects/${projectId}/work-orders/${workOrder.id}/site-surveys`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
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
      }),
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
