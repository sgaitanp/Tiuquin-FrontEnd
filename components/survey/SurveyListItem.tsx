import { STATUS_CFG, completionOf, fmtDate } from "./shared"

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

export default function SurveyListItem({ survey, template, active, onClick }: { survey: any; template: any; active: boolean; onClick: () => void }) {
  const pct = completionOf(template, survey.responses)

  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: active ? "1.5px solid #0f172a" : "1px solid #e2e8f0", background: active ? "#0f172a" : "#fff", transition: "all .15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: active ? "#fff" : "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{survey.name}</p>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{survey.projectName}</p>
        </div>
        <StatusBadge status={survey.status} />
      </div>
      {survey.assignedTo    && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", marginTop: 5 }}><Ms icon="engineering"    style={{ fontSize: 13 }} />{survey.assignedTo.name}</div>}
      {survey.scheduledDate && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", marginTop: 3 }}><Ms icon="calendar_month" style={{ fontSize: 13 }} />{fmtDate(survey.scheduledDate)}</div>}
      <div style={{ marginTop: 8 }}>
        {template
          ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 9999, background: active ? "#334155" : "#f1f5f9", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, background: pct === 100 ? "#22c55e" : active ? "#94a3b8" : "#0f172a", transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#94a3b8" : "#64748b", flexShrink: 0 }}>{pct}%</span>
            </div>
          : survey.templateId
            ? <span style={{ fontSize: 10, color: active ? "#64748b" : "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Ms icon="description" style={{ fontSize: 12 }} />Template ID: {survey.templateId}</span>
            : <span style={{ fontSize: 10, color: active ? "#64748b" : "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Ms icon="note_add" style={{ fontSize: 12 }} />No template assigned</span>
        }
      </div>
    </button>
  )
}