import { STATUS_CFG, STATUSES } from "./shared"
import SurveyListItem from "./SurveyListItem"

const Ms = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1, verticalAlign: "middle", ...style }}>{icon}</span>
)

const selSt = { borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", padding: "5px 10px", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties

export default function SurveyList({ surveys, templates, selected, search, statusFilter, onSearch, onStatusFilter, onSelect, onNew }: {
  surveys:       any[] | null
  templates:     any[]
  selected:      any
  search:        string
  statusFilter:  string
  onSearch:      (v: string) => void
  onStatusFilter:(v: string) => void
  onSelect:      (s: any) => void
  onNew:         () => void
}) {
  const filtered = surveys === null ? [] : surveys.filter(s => {
    const q = search.toLowerCase()
    return (statusFilter === "ALL" || s.status === statusFilter) &&
      (!q || s.name.toLowerCase().includes(q) || s.projectName.toLowerCase().includes(q) || (s.assignedTo?.name || "").toLowerCase().includes(q))
  })

  return (
    <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Site Surveys</h1>
          <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Ms icon="add" style={{ fontSize: 15, color: "#fff" }} />New
          </button>
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Ms icon="search" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#94a3b8" }} />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search surveys…"
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#0f172a", outline: "none", fontFamily: "inherit" }} />
        </div>
        <select value={statusFilter} onChange={e => onStatusFilter(e.target.value)} style={{ ...selSt, width: "100%" }}>
          <option value="ALL">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {surveys === null && <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 20 }}>Loading…</p>}
        {surveys !== null && filtered.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Ms icon="search_off" style={{ fontSize: 32, color: "#e2e8f0", display: "block", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>No surveys found</p>
          </div>
        )}
        {filtered.map(s => {
          return <SurveyListItem key={s.id} survey={s} template={null} active={selected?.id === s.id} onClick={() => onSelect(s)} />
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{filtered.length} of {(surveys || []).length} survey{(surveys || []).length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  )
}