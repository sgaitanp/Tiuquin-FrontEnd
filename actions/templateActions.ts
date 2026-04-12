'use server'

import fs   from 'fs'
import path from 'path'

const TEMPLATES_PATH = path.join(process.cwd(), 'templates.json')

function readTemplates(): any[] {
  if (!fs.existsSync(TEMPLATES_PATH)) return []
  return JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf-8'))
}
function writeTemplates(data: any[]) {
  fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllTemplates() {
  return readTemplates()
}

// Returns templates grouped by groupId for the list view
export async function getTemplateGroups() {
  const templates = readTemplates()
  const groups: Record<string, any[]> = {}
  for (const t of templates) {
    if (!groups[t.groupId]) groups[t.groupId] = []
    groups[t.groupId].push(t)
  }
  return Object.values(groups).map(versions => ({
    groupId:  versions[0].groupId,
    name:     versions[0].name,
    versions: versions.sort((a, b) =>
      parseFloat(b.version) - parseFloat(a.version)
    ),
  }))
}

export async function getTemplate(id: string) {
  return readTemplates().find((t: any) => t.id === id) ?? null
}

// Only APPROVED — used by AssignTemplateModal
export async function getApprovedTemplates() {
  return readTemplates().filter((t: any) => t.status === 'APPROVED')
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTemplate(data: { name: string }) {
  const templates = readTemplates()
  const groupId   = `grp-${Date.now()}`
  const newTemplate = {
    id:        `template-${Date.now()}`,
    groupId,
    name:      data.name,
    version:   '1.0',
    status:    'IN_DESIGN',
    createdAt: new Date().toISOString(),
    sections:  [],
  }
  templates.push(newTemplate)
  writeTemplates(templates)
  return newTemplate
}

// Creates a new version from the latest in the group
export async function createNewVersion(groupId: string) {
  const templates = readTemplates()
  const group     = templates.filter((t: any) => t.groupId === groupId)
  const latest    = group.sort((a: any, b: any) =>
    parseFloat(b.version) - parseFloat(a.version)
  )[0]
  if (!latest) throw new Error('Group not found')

  const nextVersion = (parseFloat(latest.version) + 1).toFixed(1)
  const newTemplate = {
    ...JSON.parse(JSON.stringify(latest)), // deep clone sections
    id:        `template-${Date.now()}`,
    version:   nextVersion,
    status:    'IN_DESIGN',
    createdAt: new Date().toISOString(),
  }
  templates.push(newTemplate)
  writeTemplates(templates)
  return newTemplate
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateTemplateSections(id: string, sections: any[]) {
  const templates = readTemplates()
  const idx       = templates.findIndex((t: any) => t.id === id)
  if (idx === -1) throw new Error('Template not found')
  if (templates[idx].status === 'APPROVED') throw new Error('Cannot edit an approved template')
  templates[idx].sections = sections
  writeTemplates(templates)
  return templates[idx]
}

export async function updateTemplateStatus(id: string, status: 'IN_DESIGN' | 'IN_REVISION' | 'APPROVED') {
  const templates = readTemplates()
  const idx       = templates.findIndex((t: any) => t.id === id)
  if (idx === -1) throw new Error('Template not found')
  templates[idx].status = status
  writeTemplates(templates)
  return templates[idx]
}

export async function updateTemplateName(id: string, name: string) {
  const templates = readTemplates()
  const idx       = templates.findIndex((t: any) => t.id === id)
  if (idx === -1) throw new Error('Template not found')
  if (templates[idx].status === 'APPROVED') throw new Error('Cannot edit an approved template')
  // Update name across the group
  const groupId = templates[idx].groupId
  templates.forEach((t: any) => { if (t.groupId === groupId) t.name = name })
  writeTemplates(templates)
  return templates[idx]
}

// ── Delete ────────────────────────────────────────────────────────────────────

// Deletes a single version — only allowed if IN_DESIGN or IN_REVISION
export async function deleteTemplateVersion(id: string) {
  const templates = readTemplates()
  const target    = templates.find((t: any) => t.id === id)
  if (!target) throw new Error('Template not found')
  if (target.status === 'APPROVED') throw new Error('Cannot delete an approved template version')

  const remaining = templates.filter((t: any) => t.id !== id)
  writeTemplates(remaining)

  // Return whether the whole group is now gone
  const groupStillExists = remaining.some((t: any) => t.groupId === target.groupId)
  return { deletedId: id, groupId: target.groupId, groupStillExists }
}

// Deletes the entire group — only if no APPROVED versions exist
export async function deleteTemplateGroup(groupId: string) {
  const templates = readTemplates()
  const group     = templates.filter((t: any) => t.groupId === groupId)
  if (group.some((t: any) => t.status === 'APPROVED')) {
    throw new Error('Cannot delete a group that has an approved version')
  }
  writeTemplates(templates.filter((t: any) => t.groupId !== groupId))
  return { deletedGroupId: groupId }
}