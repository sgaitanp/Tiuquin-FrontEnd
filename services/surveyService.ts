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

export async function getAssignedSurveys(userId: string) {
  const res = await fetch(`${API_BASE}/site-surveys/user/${userId}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch surveys (${res.status})`)
  return res.json()
}

export async function getSiteSurveysWithResponsesByStatus(status: string) {
  const res = await fetch(`${API_BASE}/site-surveys/with-responses/status/${status}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch surveys (${res.status})`)
  return res.json()
}

export async function getSiteSurveyResponses(siteSurveyId: string) {
  const res = await fetch(`${API_BASE}/site-surveys/${siteSurveyId}/responses`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch responses (${res.status})`)
  return res.json()
}

export async function updateSiteSurveyStatus(siteSurveyId: string, status: string) {
  const res = await fetch(`${API_BASE}/site-surveys/${siteSurveyId}/status`, {
    method:  "PATCH",
    headers: authHeaders(),
    body:    JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to update survey status (${res.status}): ${body}`)
  }
  return res.json()
}

export async function submitSurvey(survey: any, template: any, responses: Record<string, any>) {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") ?? "null")

  const mappedResponses = Object.entries(responses).map(([questionId, value]) => {
    if (Array.isArray(value)) return { questionId, selectedDecisionIds: value }
    if (typeof value === "string" && value.match(/^[a-z]-\d+|^a-/)) return { questionId, selectedDecisionId: value }
    return { questionId, inputValue: value }
  })

  const res = await fetch(`${API_BASE}/site-surveys/submit-response`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({
      projectId:    survey.projectId,
      siteSurveyId: survey.id,
      templateId:   survey.templateId,
      workerId:     currentUser?.id ?? null,
      responses:    mappedResponses,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to submit survey (${res.status}): ${body}`)
  }
  return res.json()
}