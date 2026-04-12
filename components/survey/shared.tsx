// Shared constants, types and helpers used across the survey folder

export const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PLANNED:          { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Planned"          },
  IN_PROGRESS:      { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "In Progress"      },
  PENDING_APPROVAL: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Pending Approval" },
  APPROVED:         { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Approved"         },
  CLOSED:           { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Closed"           },
  REJECTED:         { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Rejected"         },
  not_started:      { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Not Started"      },
}

export const STATUSES = ["PLANNED", "IN_PROGRESS", "PENDING_APPROVAL", "APPROVED", "CLOSED", "REJECTED"]

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"

export const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""

export const inp = (err = false) => ({
  width: "100%", boxSizing: "border-box" as const, borderRadius: 8,
  border: `1px solid ${err ? "#ef4444" : "#e2e8f0"}`, padding: "9px 12px",
  fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#fff",
})

export function completionOf(template: any, responses: any) {
  if (!template || !responses) return 0
  const primary = template.sections.flatMap((s: any) => s.questions.filter((q: any) => !q.isFollowUp))
  if (!primary.length) return 0
  const answered = primary.filter((q: any) => {
    const v = responses[q.id]
    if (!v) return false
    if (Array.isArray(v)) return v.length > 0
    return String(v).trim().length > 0
  }).length
  return Math.round((answered / primary.length) * 100)
}