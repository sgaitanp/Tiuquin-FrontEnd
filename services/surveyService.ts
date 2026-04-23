import type { SiteSurvey, SiteSurveyStatus } from '@/types/project';
import type {
  GeoValue,
  MultiMeasurementValue,
  QuestionValue,
  ResponseDetail,
} from '@/types/response';
import type { Template } from '@/types/template';

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

export async function getAllSiteSurveys(): Promise<SiteSurvey[]> {
  const res = await fetch(`${API_BASE}/site-surveys`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch all surveys (${res.status})`);
  return res.json();
}

export async function getAssignedSurveys(
  userId: string,
): Promise<SiteSurvey[]> {
  const res = await fetch(`${API_BASE}/site-surveys/user/${userId}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch surveys (${res.status})`);
  return res.json();
}

export async function getSiteSurveysWithResponses(): Promise<SiteSurvey[]> {
  const res = await fetch(`${API_BASE}/site-surveys/with-responses`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok)
    throw new Error(`Failed to fetch surveys with responses (${res.status})`);
  return res.json();
}

export async function getSiteSurveysWithResponsesByStatus(
  status: SiteSurveyStatus,
): Promise<SiteSurvey[]> {
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

export async function getSiteSurveyResponses(
  siteSurveyId: string,
): Promise<ResponseDetail[]> {
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
  status: SiteSurveyStatus,
): Promise<SiteSurvey> {
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

// Shape the backend expects for each answer in the `response` JSON blob.
interface ResponseEntryDTO {
  id: string;
  questionId: string;
  inputValue: string | null;
  selectedDecisionId: string | null;
  selectedDecisionIds: string[] | null;
  latitude: number | null;
  longitude: number | null;
  hasFile: boolean;
  referenceX?: number | null;
  referenceY?: number | null;
  measurements?: {
    x: number;
    y: number;
    value: number;
    order: number;
  }[];
}

// Narrowing helpers for the QuestionValue union. The union has no
// tag field, so we branch on runtime shape — order matters
// (`File[]` check must come before the generic `string[]` array check).
function isFileArray(v: QuestionValue): v is File[] {
  return Array.isArray(v) && v.length > 0 && v[0] instanceof File;
}
function isMultiMeasurement(v: QuestionValue): v is MultiMeasurementValue {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    ('measurements' in v || 'referenceX' in v || 'file' in v)
  );
}
function isGeo(v: QuestionValue): v is GeoValue {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    'latitude' in v &&
    'longitude' in v
  );
}

export async function submitSurvey(
  survey: SiteSurvey,
  _template: Template,
  responses: Record<string, QuestionValue>,
) {
  const currentUser = JSON.parse(
    sessionStorage.getItem('currentUser') ?? 'null',
  );

  const mappedResponses: ResponseEntryDTO[] = Object.entries(responses).map(
    ([questionId, value]) => {
      const id = crypto.randomUUID();
      const base = {
        id,
        questionId,
        inputValue: null,
        selectedDecisionId: null,
        selectedDecisionIds: null,
        latitude: null,
        longitude: null,
        hasFile: false,
      } as const;

      if (isFileArray(value)) {
        return { ...base, hasFile: true };
      }
      if (isMultiMeasurement(value)) {
        return {
          ...base,
          referenceX: typeof value.referenceX === 'number' ? value.referenceX : null,
          referenceY: typeof value.referenceY === 'number' ? value.referenceY : null,
          measurements: value.measurements.map((m, i) => ({
            x: m.x,
            y: m.y,
            value: m.value,
            order: typeof m.order === 'number' ? m.order : i,
          })),
          hasFile: value.file instanceof File,
        };
      }
      if (isGeo(value)) {
        return { ...base, latitude: value.latitude, longitude: value.longitude };
      }
      if (Array.isArray(value)) {
        // string[] — multi_select
        return { ...base, selectedDecisionIds: value };
      }
      // string — text / single_select
      return { ...base, inputValue: value };
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
    const files: File[] = isFileArray(value)
      ? value
      : isMultiMeasurement(value) && value.file instanceof File
        ? [value.file]
        : [];
    files.forEach((file) => formData.append(responseEntry.id, file));
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
