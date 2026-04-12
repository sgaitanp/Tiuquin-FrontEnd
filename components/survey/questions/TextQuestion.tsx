export default function TextQuestion({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your answer…"
      style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, border: "1px solid #e2e8f0", padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#fff" }}
      onFocus={e => (e.target.style.borderColor = "#0f172a")}
      onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
    />
  )
}