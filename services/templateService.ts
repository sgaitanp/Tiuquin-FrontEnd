import type {
  AcceptedFileType,
  Option,
  Question,
  QuestionType,
  Section,
  Template,
  TemplateStatus,
} from "@/types/template"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

function getToken(): string {
  return sessionStorage.getItem("token") ?? ""
}

function authHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getToken()}`,
  }
}

// ─── Status mapping ───────────────────────────────────────────────────────────

// The backend only knows DRAFT and APPROVED, so both IN_DESIGN and
// IN_REVISION collapse to DRAFT on send.
const STATUS_MAP: Record<TemplateStatus, string> = {
  IN_DESIGN:   "DRAFT",
  IN_REVISION: "DRAFT",
  APPROVED:    "APPROVED",
}

function mapStatus(status: TemplateStatus): string {
  return STATUS_MAP[status] ?? status
}

// ─── Shape mappers ────────────────────────────────────────────────────────────

// Shape of a section as the backend expects it on POST/PATCH.
interface SectionRequest {
  id: string
  name: string
  description: string
  order: number
  questions: QuestionRequest[]
}

interface QuestionRequest {
  id: string
  questionText: string
  type: string
  order: number
  isFollowUp: boolean
  acceptedFileType?: string
  requiredReadings?: number | null
  referencePointLabel?: string | null
  measurementUnit?: string | null
  options?: OptionRequest[]
}

interface OptionRequest {
  id: string
  text: string
  order: number
  followUpQuestionId: string | null
}

function mapSectionsToRequest(sections: Section[]): SectionRequest[] {
  return sections.map((sec, si) => ({
    id:          sec.id,
    name:        sec.name,
    description: sec.description ?? "",
    order:       sec.order ?? si + 1,
    questions:   (sec.questions ?? []).map((q, qi) => ({
      id:           q.id,
      questionText: q.questionText,
      type:         q.type.toUpperCase(),
      order:        q.order ?? qi + 1,
      isFollowUp:   q.isFollowUp ?? false,
      ...(q.acceptedFileType
        ? { acceptedFileType: q.acceptedFileType.toUpperCase() }
        : {}),
      ...(q.type === 'multi_measurement' ? {
        requiredReadings:    q.requiredReadings,
        referencePointLabel: q.referencePointLabel,
        measurementUnit:     q.measurementUnit,
      } : {}),
      ...(q.options ? {
        options: q.options.map((o, oi) => ({
          id:                 o.id,
          text:               o.text,
          order:              oi + 1,
          followUpQuestionId: o.followUpQuestionId ?? null,
        }))
      } : {}),
    })),
  }))
}

// Raw question shape as it arrives from the backend (wire format).
// `type` / `acceptedFileType` are UPPERCASE here and get normalised to
// lowercase before the frontend sees them.
interface QuestionResponse {
  id: string
  questionText: string
  type: string
  order: number
  isFollowUp?: boolean
  followUp?: boolean
  acceptedFileType?: string | null
  options?: Option[] | null
  requiredReadings?: number | null
  referencePointLabel?: string | null
  measurementUnit?: string | null
}

interface SectionResponse {
  id: string
  name: string
  order: number
  description?: string
  questions?: QuestionResponse[]
}

interface TemplateResponse {
  id: string
  groupId?: string
  name: string
  version: string
  status: TemplateStatus
  createdAt: string
  sections?: SectionResponse[]
}

function mapResponseToTemplate(data: TemplateResponse): Template {
  return {
    id:        data.id,
    groupId:   data.groupId ?? data.id,
    name:      data.name,
    version:   data.version,
    status:    data.status,
    createdAt: data.createdAt,
    sections:  (data.sections ?? []).map((sec): Section => ({
      id:        sec.id,
      name:      sec.name,
      order:     sec.order,
      questions: (sec.questions ?? []).map((q): Question => ({
        id:               q.id,
        questionText:     q.questionText,
        type:             q.type.toLowerCase() as QuestionType,
        order:            q.order,
        isFollowUp:       q.followUp ?? q.isFollowUp ?? false,
        acceptedFileType: q.acceptedFileType
          ? (q.acceptedFileType.toLowerCase() as AcceptedFileType)
          : null,
        options:          q.options ?? null,
        ...(q.type.toLowerCase() === 'multi_measurement' ? {
          requiredReadings:    q.requiredReadings ?? null,
          referencePointLabel: q.referencePointLabel ?? null,
          measurementUnit:     q.measurementUnit ?? null,
        } : {}),
      })),
    })),
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createTemplate(template: Partial<Template> & { name: string; status: TemplateStatus }): Promise<Template> {
  const res = await fetch(`${API_BASE}/templates`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({
      name:        template.name,
      description: "",
      version:     template.version ?? "1.0",
      status:      mapStatus(template.status),
      createdAt:   template.createdAt ?? new Date().toISOString(),
      sections:    mapSectionsToRequest(template.sections ?? []),
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to create template (${res.status}): ${body}`)
  }
  return mapResponseToTemplate(await res.json())
}

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/templates`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch templates (${res.status})`)
  const data: TemplateResponse[] = await res.json()
  return data.map(mapResponseToTemplate)
}

export async function getApprovedTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/templates/approved`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch approved templates (${res.status})`)
  const data: TemplateResponse[] = await res.json()
  return data.map(mapResponseToTemplate)
}

export async function getTemplateById(id: string): Promise<Template> {
  const res = await fetch(`${API_BASE}/templates/${id}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch template (${res.status})`)
  return mapResponseToTemplate(await res.json())
}

export async function updateTemplateStatus(id: string, status: TemplateStatus): Promise<Template> {
  const res = await fetch(`${API_BASE}/templates/${id}/status`, {
    method:  "PATCH",
    headers: authHeaders(),
    body:    JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to update template status (${res.status}): ${body}`)
  }
  return mapResponseToTemplate(await res.json())
}
