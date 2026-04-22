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

export async function getAllSiteSurveys() {
  const res = await fetch(`${API_BASE}/site-surveys`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch all surveys (${res.status})`);
  return res.json();
}

export async function getAssignedSurveys(userId: string) {
  const res = await fetch(`${API_BASE}/site-surveys/user/${userId}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch surveys (${res.status})`);
  return res.json();
}

export async function getSiteSurveysWithResponses() {
  const res = await fetch(`${API_BASE}/site-surveys/with-responses`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok)
    throw new Error(`Failed to fetch surveys with responses (${res.status})`);
  return res.json();
}

export async function getSiteSurveysWithResponsesByStatus(status: string) {
  const res = await fetch(
    `${API_BASE}/site-surveys/with-responses/status/${status}`,
    {
      headers: authHeaders(),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch surveys (${res.status})`);
  return res.json();
}

export async function getSiteSurveyResponses(siteSurveyId: string) {
  const res = await fetch(
    `${API_BASE}/site-surveys/${siteSurveyId}/responses`,
    {
      headers: authHeaders(),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch responses (${res.status})`);
  return res.json();
}

export async function updateSiteSurveyStatus(
  siteSurveyId: string,
  status: string,
) {
  const res = await fetch(`${API_BASE}/site-surveys/${siteSurveyId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to update survey status (${res.status}): ${body}`);
  }
  return res.json();
}

export async function submitSurvey(
  survey: any,
  template: any,
  responses: Record<string, any>,
) {
  const currentUser = JSON.parse(
    sessionStorage.getItem('currentUser') ?? 'null',
  );

  const mappedResponses = Object.entries(responses).map(
    ([questionId, value]) => {
      const id = crypto.randomUUID();
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value[0] instanceof File
      ) {
        return {
          id,
          questionId,
          inputValue: null,
          selectedDecisionId: null,
          selectedDecisionIds: null,
          latitude: null,
          longitude: null,
          hasFile: true,
        };
      }
      if (value instanceof File) {
        return {
          id,
          questionId,
          inputValue: null,
          selectedDecisionId: null,
          selectedDecisionIds: null,
          latitude: null,
          longitude: null,
          hasFile: true,
        };
      }
      if (Array.isArray(value)) {
        return {
          id,
          questionId,
          selectedDecisionIds: value,
          selectedDecisionId: null,
          inputValue: null,
          latitude: null,
          longitude: null,
          hasFile: false,
        };
      }
      if (
        value &&
        typeof value === 'object' &&
        (typeof (value as any).referenceX === 'number' ||
          Array.isArray((value as any).measurements) ||
          (value as any).file instanceof File)
      ) {
        const v = value as any;
        return {
          id,
          questionId,
          referenceX: typeof v.referenceX === 'number' ? v.referenceX : null,
          referenceY: typeof v.referenceY === 'number' ? v.referenceY : null,
          measurements: Array.isArray(v.measurements)
            ? v.measurements.map((m: any, i: number) => ({
                x: m.x,
                y: m.y,
                value: m.value,
                order: typeof m.order === 'number' ? m.order : i,
              }))
            : [],
          inputValue: null,
          selectedDecisionId: null,
          selectedDecisionIds: null,
          latitude: null,
          longitude: null,
          hasFile: v.file instanceof File,
        };
      }
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as any).latitude === 'number' &&
        typeof (value as any).longitude === 'number'
      ) {
        return {
          id,
          questionId,
          inputValue: null,
          selectedDecisionId: null,
          selectedDecisionIds: null,
          latitude: (value as any).latitude,
          longitude: (value as any).longitude,
          hasFile: false,
        };
      }
      return {
        id,
        questionId,
        inputValue: value,
        selectedDecisionId: null,
        selectedDecisionIds: null,
        latitude: null,
        longitude: null,
        hasFile: false,
      };
    },
  );

  const submission = {
    projectId: survey.projectId,
    siteSurveyId: survey.id,
    templateId: survey.templateId,
    workerId: currentUser?.id ?? null,
    responses: mappedResponses,
  };

  const formData = new FormData();
  formData.append(
    'response',
    new Blob([JSON.stringify(submission)], { type: 'application/json' }),
  );

  // Attach files keyed by their response id
  Object.entries(responses).forEach(([questionId, value]) => {
    const responseEntry = mappedResponses.find(
      (r) => r.questionId === questionId,
    );
    if (!responseEntry) return;
    const files = Array.isArray(value)
      ? value
      : value instanceof File
        ? [value]
        : value && typeof value === 'object' && (value as any).file instanceof File
          ? [(value as any).file]
          : [];
    files.forEach((file: any) => {
      if (file instanceof File) formData.append(responseEntry.id, file);
    });
  });

  const res = await fetch(`${API_BASE}/site-surveys/submit-response`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to submit survey (${res.status}): ${body}`);
  }
  return res.json();
}
