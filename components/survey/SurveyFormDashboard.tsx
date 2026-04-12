"use client"

import { useState, useEffect, useCallback } from "react"
import { getAssignedSurveys } from "@/services/surveyService"
import { getTemplateById, getApprovedTemplates } from "@/services/templateService"
import { getTemplate, createSurvey, assignTemplate, updateSurvey } from "@/actions/surveyFormActions"
import { getProjects } from "@/services/projectService"
import { getUsersByType } from "@/services/userService"
import SurveyList          from "./SurveyList"
import SurveyForm          from "./SurveyForm"
import CreateSurveyModal   from "./CreateSurveyModal"
import EditSurveyModal     from "./EditSurveyModal"
import AssignTemplateModal from "./AssignTemplateModal"
import { fmtDate, fmtTime, STATUS_CFG } from "./shared"

function useMaterialSymbols() {
  useEffect(() => {
    const id = "material-symbols-font"
    if (!document.getElementById(id)) {
      const link = document.createElement("link")
      link.id = id; link.rel = "stylesheet"
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
      document.head.appendChild(link)
    }
  }, [])
}

const Ms = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1, verticalAlign: "middle", ...style }}>{icon}</span>
)

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.not_started
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.color, padding: "2px 8px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  )
}

export default function SurveyFormDashboard() {
  useMaterialSymbols()

  const [surveys,      setSurveys]      = useState<any[] | null>(null)
  const [templates,    setTemplates]    = useState<any[]>([])
  const [projects,     setProjects]     = useState<any[]>([])
  const [crewMembers,       setCrewMembers]       = useState<any[]>([])
  const [platformOperators, setPlatformOperators] = useState<any[]>([])
  const [search,       setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selected,     setSelected]     = useState<any>(null)
  const [template,        setTemplate]        = useState<any>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [assigning,    setAssigning]    = useState<any>(null)
  const [creating,     setCreating]     = useState(false)
  const [editing,      setEditing]      = useState(false)

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") ?? "null")
    const userId = currentUser?.id ?? undefined

    if (userId) {
      getAssignedSurveys(userId).then(setSurveys).catch(() => setSurveys([]))
    } else {
      setSurveys([])
    }
  }, [])

  useEffect(() => {
    if (!selected?.templateId) { setTemplate(null); setTemplateLoading(false); return }
    if (template?.id === selected.templateId) return
    setTemplate(null)
    setTemplateLoading(true)
    getTemplateById(selected.templateId)
      .then(setTemplate)
      .catch(() => {})
      .finally(() => setTemplateLoading(false))
  }, [selected?.id, selected?.templateId])

  const handleCreated   = (s: any) => { setSurveys(prev => [...(prev ?? []), s]); setSelected(s) }
  const handleEdited    = (s: any) => { setSurveys(prev => (prev ?? []).map(x => x.id === s.id ? s : x)); setSelected(s) }
  const handleSubmitted = (s: any) => { setSurveys(prev => (prev ?? []).map(x => x.id === s.id ? s : x)); setSelected(s) }
  const handleAssigned = async (templateId: string) => {
    await assignTemplate(selected.id, templateId)
    const tmpl = await getTemplateById(templateId)
    setTemplate(tmpl)
    setSurveys(prev => (prev ?? []).map(s => s.id === selected.id ? { ...s, templateId, responses: {} } : s))
    setSelected((prev: any) => ({ ...prev, templateId, responses: {} }))
    setAssigning(null)
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "'Geist','Inter',system-ui,sans-serif", color: "#0f172a" }}>
      <style>{`.material-symbols-outlined{font-display:block}`}</style>

      <SurveyList
        surveys={surveys}
        templates={templates}
        selected={selected}
        search={search}
        statusFilter={statusFilter}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onSelect={setSelected}
        onNew={() => setCreating(true)}
      />

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Empty state */}
        {!selected && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <Ms icon="assignment" style={{ fontSize: 48, color: "#e2e8f0" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#64748b", margin: 0 }}>Select a survey</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Or create a new one with the <strong>New</strong> button</p>
          </div>
        )}

        {/* Loading template */}
        {selected && selected.templateId && templateLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
            <Ms icon="sync" style={{ fontSize: 22, color: "#94a3b8" }} />
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Loading template…</p>
          </div>
        )}

        {/* No template assigned */}
        {selected && !selected.templateId && !templateLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ms icon="note_add" style={{ fontSize: 28, color: "#94a3b8" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0 }}>No template assigned</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>This survey has no template. Contact your project manager.</p>
          </div>
        )}

        {/* Survey form */}
        {selected && template && !templateLoading && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 24px", borderBottom: "1px solid #f1f5f9", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8", marginRight: "auto" }}>
                {template.sections.flatMap((s: any) => s.questions.filter((q: any) => !q.isFollowUp)).filter((q: any) => { const v = selected.responses?.[q.id]; if (!v) return false; if (Array.isArray(v)) return v.length > 0; return String(v).trim().length > 0 }).length}
                /{template.sections.flatMap((s: any) => s.questions.filter((q: any) => !q.isFollowUp)).length} questions answered
              </span>
              {selected.status === "PLANNED" && (
                <button onClick={() => setEditing(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151" }}>
                  <Ms icon="edit" style={{ fontSize: 14 }} />Edit
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <SurveyForm survey={selected} template={template} onResponsesChange={next => setSelected((p: any) => ({ ...p, responses: next }))} onSubmitted={handleSubmitted} />
            </div>
          </div>
        )}
      </div>

      {creating  && <CreateSurveyModal projects={projects} templates={templates} crewMembers={crewMembers} platformOperators={platformOperators} onClose={() => setCreating(false)} onCreated={handleCreated} />}
      {editing   && <EditSurveyModal   survey={selected}   crewMembers={crewMembers} platformOperators={platformOperators} onClose={() => setEditing(false)} onSaved={handleEdited} />}
      {assigning && <AssignTemplateModal currentTemplateId={assigning.templateId ?? null} templates={templates} onClose={() => setAssigning(null)} onAssign={handleAssigned} />}
    </div>
  )
}