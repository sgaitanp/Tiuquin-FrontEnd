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

const STATUS_MAP: Record<string, string> = {
  IN_DESIGN:   "DRAFT",
  IN_REVISION: "DRAFT",
  APPROVED:    "APPROVED",
}

function mapStatus(status: string): string {
  return STATUS_MAP[status] ?? status
}

// ─── Shape mappers ────────────────────────────────────────────────────────────

function mapSectionsToRequest(sections: any[]) {
  return sections.map((sec: any, si: number) => ({
    id:          sec.id,
    name:        sec.name,
    description: sec.description ?? "",
    order:       sec.order ?? si + 1,
    questions:   (sec.questions ?? []).map((q: any, qi: number) => ({
      id:         q.id,
      text:       q.text,
      type:       q.type?.toUpperCase(),
      order:      q.order ?? qi + 1,
      isFollowUp: q.isFollowUp ?? false,
      ...(q.options ? {
        options: q.options.map((o: any, oi: number) => ({
          id:                 o.id,
          text:               o.text,
          order:              oi + 1,
          followUpQuestionId: o.followUpQuestionId ?? null,
        }))
      } : {}),
    })),
  }))
}

function mapResponseToTemplate(data: any) {
  return {
    id:        data.id,
    groupId:   data.groupId ?? data.id,
    name:      data.name,
    version:   data.version,
    status:    data.status,
    createdAt: data.createdAt,
    sections:  (data.sections ?? []).map((sec: any) => ({
      id:        sec.id,
      name:      sec.name,
      order:     sec.order,
      questions: (sec.questions ?? []).map((q: any) => ({
        id:         q.id,
        text:       q.text,
        type:       q.type?.toLowerCase(),
        order:      q.order,
        isFollowUp: q.followUp ?? q.isFollowUp ?? false,
        options:    q.options ?? null,
      })),
    })),
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createTemplate(template: any) {
  const res = await fetch(`${API_BASE}/templates`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({
      name:        template.name,
      description: template.description ?? "",
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

export async function getTemplates() {
  const res = await fetch(`${API_BASE}/templates`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch templates (${res.status})`)
  const data = await res.json()
  return data.map(mapResponseToTemplate)
}

export async function getApprovedTemplates() {
  const res = await fetch(`${API_BASE}/templates/approved`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch approved templates (${res.status})`)
  const data = await res.json()
  return data.map(mapResponseToTemplate)
}

export async function getTemplateById(id: string) {
  const res = await fetch(`${API_BASE}/templates/${id}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch template (${res.status})`)
  return mapResponseToTemplate(await res.json())
}

export async function updateTemplateStatus(id: string, status: string) {
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