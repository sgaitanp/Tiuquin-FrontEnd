"use server"

import fs   from "fs"
import path from "path"

const DB_PATH      = path.join(process.cwd(), "db.json")
const SURVEYS_PATH = path.join(process.cwd(), "surveys.json")

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
}
function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8")
}
function readSurveys(): any[] {
  if (!fs.existsSync(SURVEYS_PATH)) return []
  return JSON.parse(fs.readFileSync(SURVEYS_PATH, "utf-8"))
}
function writeSurveys(data: any[]) {
  fs.writeFileSync(SURVEYS_PATH, JSON.stringify(data, null, 2), "utf-8")
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`)
  const projects = await res.json()

  // Normalize siteSurveys to match the shape the frontend expects
  return projects.map((p: any) => ({
    ...p,
    siteSurveys: (p.siteSurveys ?? []).map((s: any) => ({
      id:            s.id,
      name:          s.name ?? '',
      status:        s.status ?? 'PLANNED',
      scheduledDate: s.scheduledDate ?? null,
      location:      s.location      ?? null,
      contact:       s.contact       ?? null,
      projectId:     p.id,
      projectName:   p.name,
      client:        p.client,
      templateId:    s.templateId    ?? null,
      assignedTo:    s.assignedTo    ?? null,
      workOrder:     s.workOrder     ?? null,
      responses:     s.responses     ?? {},
    })),
  }))
}

export async function getPlatformOperators() {
  const res = await fetch(`${API_BASE}/users/type/PLATFORM_OPERATOR`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

export async function getFieldCrewMembers() {
  const res = await fetch(`${API_BASE}/users/type/FIELD_CREW_MEMBER`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1"

export async function createProject(data: { name: string; client: string }) {
  const res = await fetch(`${API_BASE}/projects`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ...data, siteSurveys: [] }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to create project (${res.status}): ${body}`)
  }
  return res.json()
}

export async function updateProject(id: string, data: any) {
  const db  = readDB()
  const idx = db.projects.findIndex((p: any) => p.id === id)
  if (idx === -1) throw new Error("Project not found")
  db.projects[idx] = { ...db.projects[idx], ...data, id }
  writeDB(db)
  const surveys = readSurveys().filter((s: any) => s.projectId === id)
  return { ...db.projects[idx], siteSurveys: surveys }
}

// ── Surveys (written to surveys.json) ────────────────────────────────────────

export async function addSurvey(projectId: string, survey: any) {
  // Step 1 — create the work order
  const woRes = await fetch(`${API_BASE}/workOrders`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      number:      survey.workOrder.number,
      description: survey.workOrder.description ?? null,
      priority:    survey.workOrder.priority,
      createdBy:   survey.workOrder.createdBy,
      createdAt:   survey.workOrder.createdAt ?? new Date().toISOString(),
    }),
  })
  if (!woRes.ok) {
    const body = await woRes.text().catch(() => "")
    throw new Error(`Failed to create work order (${woRes.status}): ${body}`)
  }
  const workOrder = await woRes.json()

  // Step 2 — create the site survey under that project + work order
  const ssRes = await fetch(`${API_BASE}/projects/${projectId}/work-orders/${workOrder.id}/site-surveys`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      name:          survey.name,
      status:        survey.status ?? "PLANNED",
      scheduledDate: survey.scheduledDate,
      location:      survey.location,
      contact:       survey.contact,
    }),
  })
  if (!ssRes.ok) {
    const body = await ssRes.text().catch(() => "")
    throw new Error(`Failed to create site survey (${ssRes.status}): ${body}`)
  }
  const siteSurvey = await ssRes.json()

  // Step 3 — assign field crew member to the site survey if provided
  if (survey.assignedTo?.id) {
    const assignRes = await fetch(`${API_BASE}/site-surveys/${siteSurvey.id}/assign-user/${survey.assignedTo.id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (!assignRes.ok) {
      const body = await assignRes.text().catch(() => "")
      throw new Error(`Failed to assign user (${assignRes.status}): ${body}`)
    }
  }

  // Return merged shape the frontend expects
  return {
    ...siteSurvey,
    projectId,
    workOrder:  { ...workOrder },
    assignedTo: survey.assignedTo ?? null,
    templateId: null,
    responses:  {},
  }
}

export async function updateSurvey(projectId: string, surveyId: string, data: any) {
  const surveys = readSurveys()
  const idx     = surveys.findIndex((s: any) => s.id === surveyId)
  if (idx === -1) throw new Error("Survey not found")
  if (surveys[idx].status !== "PLANNED") throw new Error("Only planned surveys can be edited")

  surveys[idx] = { ...surveys[idx], ...data, id: surveyId, projectId }
  writeSurveys(surveys)
  return surveys[idx]
}