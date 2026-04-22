import { useState, useMemo, useCallback, useEffect } from "react"
import { submitSurvey } from "@/services/surveyService"
import { STATUS_CFG, completionOf } from "./shared"
import TextQuestion             from "./questions/TextQuestion"
import SingleSelectQuestion     from "./questions/SingleSelectQuestion"
import MultiSelectQuestion      from "./questions/MultiSelectQuestion"
import FileQuestion             from "./questions/FileQuestion"
import GeoLocationQuestion      from "./questions/GeoLocationQuestion"
import MultiMeasurementQuestion from "./questions/MultiMeasurementQuestion"

// A question is "answered" if its value satisfies the type's shape.
// For multi_measurement, the question is needed to enforce requiredReadings.
const isAnswered = (v: any, q?: any) => {
  if (v === null || v === undefined) return false
  if (q?.type === 'multi_measurement') {
    const need = Math.max(1, q.requiredReadings ?? 1)
    return v.file instanceof File
      && typeof v.referenceX === 'number'
      && typeof v.referenceY === 'number'
      && Array.isArray(v.measurements)
      && v.measurements.length >= need
  }
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object')
    return typeof v.latitude === 'number' && typeof v.longitude === 'number'
  return String(v).trim().length > 0
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

export default function SurveyForm({ survey, template, onResponsesChange, onSubmitted }: { survey: any; template: any; onResponsesChange?: (r: any) => void; onSubmitted?: (survey: any) => void }) {
  const [responses,     setResponses] = useState<Record<string, any>>(survey.responses || {})
  const [activeSection, setSection]  = useState<string>(template.sections[0]?.id)
  const [saving,        setSaving]   = useState(false)
  const [submitted,     setSubmitted] = useState(false)

  // Lock form only after it has been submitted (status moves to PENDING_APPROVAL or beyond)
  const isLocked = submitted || ['PENDING_APPROVAL', 'CLOSED', 'REJECTED'].includes(survey.status)

  const triggeredFollowUps = useMemo(() => {
    const ids = new Set<string>()
    template.sections.forEach((sec: any) => sec.questions.forEach((q: any) => {
      if (q.type === "multi_select" && q.options) {
        const sel: string[] = responses[q.id] || []
        q.options.forEach((opt: any) => { if (opt.followUpQuestionId && sel.includes(opt.id)) ids.add(opt.followUpQuestionId) })
      }
      if (q.type === "single_select" && q.options) {
        const sel: string = responses[q.id] || ""
        q.options.forEach((opt: any) => {
          if (opt.followUpQuestionId && sel === opt.id) ids.add(opt.followUpQuestionId)
        })
      }
    }))
    return ids
  }, [responses, template])

  const setAnswer = useCallback((qId: string, value: any) => {
    if (isLocked) return
    setResponses(prev => ({ ...prev, [qId]: value }))
  }, [isLocked])

  useEffect(() => {
    onResponsesChange?.(responses)
  }, [responses])

  const pct        = completionOf(template, responses)
  const currentSec = template.sections.find((s: any) => s.id === activeSection)
  const secDone    = (sec: any) => sec.questions.filter((q: any) => !q.isFollowUp).every((q: any) => isAnswered(responses[q.id], q))

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{survey.projectName} · {survey.id}</p>
              <StatusBadge status={survey.status} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{survey.name}</h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{template.name} · v{template.version}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", borderRadius: 20, padding: "4px 10px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 60, height: 6, borderRadius: 9999, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#22c55e" : "#0f172a", borderRadius: 9999, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
          {template.sections.map((sec: any, i: number) => {
            const done = secDone(sec); const active = sec.id === activeSection
            return (
              <button key={sec.id} onClick={() => setSection(sec.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: active ? "#0f172a" : done ? "#bbf7d0" : "#e2e8f0", background: active ? "#0f172a" : done ? "#f0fdf4" : "#fff", color: active ? "#fff" : done ? "#15803d" : "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: active ? "#334155" : done ? "#22c55e" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done ? <Ms icon="check" style={{ fontSize: 11, color: "#fff" }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#fff" : "#94a3b8" }}>{i + 1}</span>}
                </div>
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{sec.name.split(" - ")[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Questions */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {currentSec && (
          <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{currentSec.name.split(" - ")[0]}</h3>
              {currentSec.name.includes(" - ") && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{currentSec.name.split(" - ")[1]}</p>}
            </div>

            {currentSec.questions.map((q: any) => {
              if (q.isFollowUp && !triggeredFollowUps.has(q.id)) return null
              const isFollowUp = q.isFollowUp && triggeredFollowUps.has(q.id)
              return (
                <div key={q.id} style={{ padding: isFollowUp ? "14px 16px" : 0, borderRadius: isFollowUp ? 10 : 0, border: isFollowUp ? "1px solid #fde68a" : "none", background: isFollowUp ? "#fffbeb" : "transparent", marginLeft: isFollowUp ? 16 : 0 }}>
                  {isFollowUp && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}><Ms icon="subdirectory_arrow_right" style={{ fontSize: 14, color: "#f59e0b" }} /><span style={{ fontSize: 10, fontWeight: 600, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>Follow-up</span></div>}
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>{q.questionText}{!q.isFollowUp && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}</label>
                  {q.type === "text"          && <TextQuestion         value={responses[q.id]}       onChange={v => setAnswer(q.id, v)} />}
                  {q.type === "single_select" && <SingleSelectQuestion question={q} value={responses[q.id] || ''} onChange={v => setAnswer(q.id, v)} />}
                  {q.type === "multi_select"  && <MultiSelectQuestion  question={q} value={responses[q.id] || []} onChange={v => setAnswer(q.id, v)} />}
                  {q.type === "file"          && <FileQuestion         value={responses[q.id] || []} onChange={v => setAnswer(q.id, v)} acceptedFileType={q.acceptedFileType} />}
                  {q.type === "geolocation"   && <GeoLocationQuestion  value={responses[q.id] ?? null} onChange={v => setAnswer(q.id, v)} />}
                  {q.type === "multi_measurement" && <MultiMeasurementQuestion question={q} value={responses[q.id] ?? null} onChange={v => setAnswer(q.id, v)} />}
                </div>
              )
            })}

            {/* Prev / Next / Submit */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
              {isLocked ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                  <Ms icon="check_circle" style={{ fontSize: 16, color: "#16a34a" }} />
                  Survey submitted — responses are locked
                </div>
              ) : (
                (() => {
                  const idx  = template.sections.findIndex((s: any) => s.id === activeSection)
                  const prev = template.sections[idx - 1]
                  const next = template.sections[idx + 1]
                  return (
                    <>
                      <div>{prev && <button onClick={() => setSection(prev.id)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151" }}><Ms icon="arrow_back" style={{ fontSize: 15 }} />Previous</button>}</div>
                      <div>
                        {next && <button onClick={() => setSection(next.id)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none", background: "#0f172a", padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#fff" }}>Next<Ms icon="arrow_forward" style={{ fontSize: 15, color: "#fff" }} /></button>}
                        {!next && (
                          <button
                            onClick={async () => {
                              setSaving(true)
                              try {
                                const result = await submitSurvey(survey, template, responses)
                                setSubmitted(true)
                                onResponsesChange?.(responses)
                                onSubmitted?.(result.submission ?? result)
                              } catch(e) {
                                console.error(e)
                              } finally {
                                setSaving(false)
                              }
                            }}
                            disabled={saving}
                            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none", background: "#22c55e", padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                            <Ms icon="check_circle" style={{ fontSize: 16, color: "#fff" }} />{saving ? "Submitting…" : "Submit Survey"}
                          </button>
                        )}
                      </div>
                    </>
                  )
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}