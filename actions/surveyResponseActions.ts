'use server'

import fs   from 'fs'
import path from 'path'

const RESPONSES_PATH = path.join(process.cwd(), 'responses.json')
const SURVEYS_PATH   = path.join(process.cwd(), 'surveys.json')
const TEMPLATES_PATH = path.join(process.cwd(), 'templates.json')
const DB_PATH        = path.join(process.cwd(), 'db.json')

function read(p: string) { return JSON.parse(fs.readFileSync(p, 'utf-8')) }

function readResponses(): any[] {
  if (!fs.existsSync(RESPONSES_PATH)) return []
  return read(RESPONSES_PATH)
}

function readTemplates(): any[] {
  if (!fs.existsSync(TEMPLATES_PATH)) return []
  return read(TEMPLATES_PATH)
}

// ── Summary list — enough to render the left panel ────────────────────────────

export async function getResponseSummaries() {
  const responses = readResponses()
  if (!responses.length) return []

  const surveys   = fs.existsSync(SURVEYS_PATH)   ? read(SURVEYS_PATH)   : []
  const db        = fs.existsSync(DB_PATH)         ? read(DB_PATH)        : {}

  return responses.map((r: any) => {
    const survey = surveys.find((s: any) => s.id === r.siteSurveyId)
    const worker = (db.users ?? []).find((u: any) => u.id === r.workerId)
    return {
      id:           r.id,
      siteSurveyId: r.siteSurveyId,
      surveyName:   survey?.name        ?? r.siteSurveyId,
      projectName:  survey?.projectName ?? '—',
      client:       survey?.client      ?? '—',
      workerName:   worker?.name        ?? r.workerId ?? '—',
      submittedAt:  r.submittedAt,
      templateId:   r.templateId,
      totalAnswers: Array.isArray(r.responses) ? r.responses.length : 0,
    }
  })
}

// ── Detail — enriched with resolved answer text ───────────────────────────────

export async function getResponseDetail(id: string) {
  const responses = readResponses()
  const entry     = responses.find((r: any) => r.id === id)
  if (!entry) return null

  const surveys   = fs.existsSync(SURVEYS_PATH)   ? read(SURVEYS_PATH)   : []
  const db        = fs.existsSync(DB_PATH)         ? read(DB_PATH)        : {}
  const templates = readTemplates()

  const survey   = surveys.find((s: any) => s.id === entry.siteSurveyId)
  const template = templates.find((t: any) => t.id === entry.templateId)
  const worker   = (db.users ?? []).find((u: any) => u.id === entry.workerId)

  // Build answer lookup: questionId → answer record
  const answerMap: Record<string, any> = {}
  for (const r of (entry.responses ?? [])) {
    answerMap[r.questionId] = r
  }

  // Resolve display value for an answer record + question
  function resolveDisplay(q: any, ans: any): string {
    if (!ans) return ''

    // Plain text / file input
    if (ans.inputValue !== undefined && ans.inputValue !== null) {
      return String(ans.inputValue)
    }

    // Geolocation
    if (
      typeof ans.latitude === 'number' &&
      typeof ans.longitude === 'number'
    ) {
      return `${ans.latitude}, ${ans.longitude}`
    }

    // Single select
    if (ans.selectedDecisionId) {
      const opt = (q.options ?? []).find((o: any) => o.id === ans.selectedDecisionId)
      return opt?.text ?? ans.selectedDecisionId
    }

    // Multi select (array)
    if (Array.isArray(ans.selectedDecisionIds)) {
      return ans.selectedDecisionIds
        .map((sid: string) => {
          const opt = (q.options ?? []).find((o: any) => o.id === sid)
          return opt?.text ?? sid
        })
        .join(', ')
    }

    // Fallback: survey.responses format (direct value)
    if (ans.value !== undefined) return String(ans.value)

    return ''
  }

  const sections = (template?.sections ?? []).map((sec: any) => ({
    ...sec,
    questions: sec.questions
      .filter((q: any) => answerMap[q.id] !== undefined)
      .map((q: any) => {
        const ans = answerMap[q.id]
        return { ...q, answer: ans, displayValue: resolveDisplay(q, ans) }
      }),
  })).filter((sec: any) => sec.questions.length > 0)

  return {
    ...entry,
    surveyName:  survey?.name        ?? entry.siteSurveyId,
    projectName: survey?.projectName ?? '—',
    client:      survey?.client      ?? '—',
    workerName:  worker?.name        ?? entry.workerId ?? '—',
    templateName: template?.name     ?? entry.templateId,
    sections,
  }
}

// ── getAllResponses (raw) ─────────────────────────────────────────────────────

export async function getAllResponses() {
  return readResponses()
}