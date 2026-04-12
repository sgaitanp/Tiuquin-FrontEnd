const Ms = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1, verticalAlign: "middle", ...style }}>{icon}</span>
)

export default function MultiSelectQuestion({ question, value = [], onChange }: { question: any; value: string[]; onChange: (v: string[]) => void }) {
  const sel    = Array.isArray(value) ? value : []
  const toggle = (id: string) => sel.includes(id) ? onChange(sel.filter(x => x !== id)) : onChange([...sel, id])

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {question.options.map((opt: any) => {
        const on = sel.includes(opt.id)
        return (
          <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1.5px solid ${on ? "#0f172a" : "#e2e8f0"}`, background: on ? "#0f172a" : "#fff", color: on ? "#fff" : "#374151", padding: "7px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${on ? "#fff" : "#cbd5e1"}`, background: on ? "#fff" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {on && <Ms icon="check" style={{ fontSize: 11, color: "#0f172a" }} />}
            </div>
            {opt.text}
          </button>
        )
      })}
    </div>
  )
}