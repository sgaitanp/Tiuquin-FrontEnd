"use server"

import fs   from "fs"
import path from "path"

const SURVEYS_PATH   = path.join(process.cwd(), "surveys.json")
const DB_PATH        = path.join(process.cwd(), "db.json")
const TEMPLATES_PATH = path.join(process.cwd(), "templates.json")

function readSurveys(): any[] {
  if (!fs.existsSync(SURVEYS_PATH)) return []
  return JSON.parse(fs.readFileSync(SURVEYS_PATH, "utf-8"))
}
function writeSurveys(data: any[]) {
  fs.writeFileSync(SURVEYS_PATH, JSON.stringify(data, null, 2), "utf-8")
}
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
}

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1"

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllSurveys() {
  return readSurveys()
}

export async function getAssignedSurveys(userId: string) {
  const res = await fetch(`${API_BASE}/site-surveys/user/${userId}`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

export async function getSurvey(id: string) {
  return readSurveys().find((s: any) => s.id === id) ?? null
}

function readTemplates(): any[] {
  if (!fs.existsSync(TEMPLATES_PATH)) return []
  return JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf-8'))
}

export async function getTemplates() {
  return readTemplates().filter((t: any) => t.status === 'APPROVED')
}

export async function getTemplate(id: string) {
  return readTemplates().find((t: any) => t.id === id) ?? null
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createSurvey(data: {
  name:          string
  projectId:     string
  templateId:    string | null
  assignedTo:    { id: string; name: string } | null
  scheduledDate: string | null
  status:        string
  workOrder: {
    number:      string
    priority:    "HIGH" | "MEDIUM" | "LOW"
    description: string
    createdBy:   string
  }
}) {
  const surveys = readSurveys()
  const db      = readDB()

  const project = (db.projects ?? []).find((p: any) => p.id === data.projectId)
  if (!project) throw new Error("Project not found")

  // Auto-generate SS-NNN and WO-NNN ids
  const ssMax = surveys.reduce((a: number, s: any) => Math.max(a, parseInt(s.id.replace("SS-", ""), 10)), 0)
  const woMax = surveys.reduce((a: number, s: any) => {
    if (!s.workOrder?.id) return a
    return Math.max(a, parseInt(s.workOrder.id.replace("WO-", ""), 10))
  }, 0)

  const newSurvey = {
    id:            `SS-${String(ssMax + 1).padStart(3, "0")}`,
    name:          data.name,
    status:        data.status,
    scheduledDate: data.scheduledDate ?? null,
    projectId:     data.projectId,
    projectName:   project.name,
    client:        project.client,
    templateId:    data.templateId ?? null,
    responses:     {},
    location:      null,
    contact:       null,
    assignedTo:    data.assignedTo ?? null,
    workOrder: {
      id:          `WO-${String(woMax + 1).padStart(3, "0")}`,
      number:      data.workOrder.number,
      priority:    data.workOrder.priority,
      description: data.workOrder.description,
      createdBy:   data.workOrder.createdBy,
      createdAt:   new Date().toISOString(),
    },
  }

  surveys.push(newSurvey)
  writeSurveys(surveys)
  return newSurvey
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function saveSurveyResponses(surveyId: string, responses: Record<string, any>) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")
  surveys[idx].responses = { ...surveys[idx].responses, ...responses }
  writeSurveys(surveys)
  return surveys[idx].responses
}

export async function updateSurvey(surveyId: string, data: any) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")
  if (surveys[idx].status !== "PLANNED") throw new Error("Only planned surveys can be edited")
  surveys[idx] = { ...surveys[idx], ...data, id: surveyId }
  writeSurveys(surveys)
  return surveys[idx]
}

export async function assignTemplate(surveyId: string, templateId: string) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")
  if (surveys[idx].status !== "APPROVED") throw new Error("Template can only be assigned to an approved survey")
  surveys[idx].templateId = templateId
  surveys[idx].responses  = {}
  writeSurveys(surveys)
  return surveys[idx]
}

export async function updateSurveyStatus(surveyId: string, status: string) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")
  surveys[idx].status = status
  writeSurveys(surveys)
  return surveys[idx]
}

// ── Submit ────────────────────────────────────────────────────────────────────

const RESPONSES_PATH = path.join(process.cwd(), "responses.json")

function readResponses(): any[] {
  if (!fs.existsSync(RESPONSES_PATH)) return []
  return JSON.parse(fs.readFileSync(RESPONSES_PATH, "utf-8"))
}
function writeResponses(data: any[]) {
  fs.writeFileSync(RESPONSES_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export async function submitSurvey(surveyId: string, responses: Record<string, any>) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")

  const survey = surveys[idx]

  // Save latest responses to survey
  survey.responses = { ...survey.responses, ...responses }
  survey.status    = "PENDING_APPROVAL"
  surveys[idx]     = survey
  writeSurveys(surveys)

  // Write response record to responses.json
  const allResponses = readResponses()
  const resMax = allResponses.reduce((a: number, r: any) => {
    return Math.max(a, parseInt(r.id.replace("RES-", ""), 10))
  }, 0)

  const newResponse = {
    id:           `RES-${String(resMax + 1).padStart(3, "0")}`,
    siteSurveyId: surveyId,
    projectId:    survey.projectId,
    templateId:   survey.templateId,
    workerId:     survey.assignedTo?.id ?? null,
    submittedAt:  new Date().toISOString(),
    responses:    Object.entries(responses).map(([questionId, value]) => {
      if (Array.isArray(value)) return { questionId, selectedDecisionIds: value }
      if (typeof value === "string" && value.startsWith("a-")) return { questionId, selectedDecisionId: value }
      return { questionId, inputValue: value }
    }),
  }

  allResponses.push(newResponse)
  writeResponses(allResponses)

  return { survey: surveys[idx], response: newResponse }
}