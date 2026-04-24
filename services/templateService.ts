import {
  ACCEPTED_FILE_TYPE_FROM_WIRE,
  ACCEPTED_FILE_TYPE_TO_WIRE,
  QUESTION_TYPE_FROM_WIRE,
  QUESTION_TYPE_TO_WIRE,
  type AcceptedFileTypeWire,
  type Option,
  type Question,
  type QuestionTypeWire,
  type Section,
  type Template,
  type TemplateStatus,
} from "@/types/template"
import { getToken } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

function authHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getToken()}`,
  }
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
  type: QuestionTypeWire
  order: number
  followUp: boolean
  acceptedFileType?: AcceptedFileTypeWire
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
      type:         QUESTION_TYPE_TO_WIRE[q.type],
      order:        q.order ?? qi + 1,
      followUp:     q.followUp ?? false,
      ...(q.acceptedFileType
        ? { acceptedFileType: ACCEPTED_FILE_TYPE_TO_WIRE[q.acceptedFileType] }
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
//
// Multi-measurement fields are declared in a couple of variants we
// accept from the backend (camelCase, alt names, snake_case). Values
// are resolved by `pickMultiMeasurement` below so downstream callers
// always see `requiredReadings` / `referencePointLabel` / `measurementUnit`.
interface QuestionResponse {
  id: string
  questionText: string
  type: QuestionTypeWire
  order: number
  followUp?: boolean
  acceptedFileType?: AcceptedFileTypeWire | null
  options?: Option[] | null
  requiredReadings?: number | null
  required_readings?: number | null
  referencePointLabel?: string | null
  referenceLabel?: string | null
  reference_point_label?: string | null
  measurementUnit?: string | null
  measurement_unit?: string | null
}

function pickMultiMeasurement(q: QuestionResponse) {
  return {
    requiredReadings: q.requiredReadings ?? q.required_readings ?? null,
    referencePointLabel:
      q.referencePointLabel ?? q.referenceLabel ?? q.reference_point_label ?? null,
    measurementUnit: q.measurementUnit ?? q.measurement_unit ?? null,
  }
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
      questions: (sec.questions ?? []).map((q): Question => {
        const type = QUESTION_TYPE_FROM_WIRE[q.type]
        return {
          id:               q.id,
          questionText:     q.questionText,
          type,
          order:            q.order,
          followUp:         q.followUp ?? false,
          acceptedFileType: q.acceptedFileType
            ? ACCEPTED_FILE_TYPE_FROM_WIRE[q.acceptedFileType]
            : null,
          options:          q.options ?? null,
          ...(type === 'multi_measurement' ? pickMultiMeasurement(q) : {}),
        }
      }),
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
      status:      template.status,
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
