export const Ms = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className='material-symbols-outlined' style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}>
    {icon}
  </span>
)

export const STATUS_CFG = {
  IN_DESIGN:   { label: 'In Design',   bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: 'edit_note'      },
  IN_REVISION: { label: 'In Revision', bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'rate_review'    },
  APPROVED:    { label: 'Approved',    bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', icon: 'check_circle'   },
} as const

export type TemplateStatus = keyof typeof STATUS_CFG

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status as TemplateStatus] ?? STATUS_CFG.IN_DESIGN
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.color, padding: '2px 8px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      <Ms icon={c.icon} style={{ fontSize: 13, color: c.color }} />
      {c.label}
    </span>
  )
}

export const QUESTION_TYPES = ['text', 'single_select', 'multi_select', 'file', 'geolocation', 'multi_measurement'] as const
export type QuestionType = typeof QUESTION_TYPES[number]

export const TYPE_CFG: Record<string, { label: string; icon: string; color: string }> = {
  text:              { label: 'Text',             icon: 'short_text',           color: '#6366f1' },
  single_select:     { label: 'Single Choice',    icon: 'radio_button_checked', color: '#8b5cf6' },
  multi_select:      { label: 'Multi Select',     icon: 'checklist',            color: '#0ea5e9' },
  file:              { label: 'File Upload',      icon: 'upload_file',          color: '#f59e0b' },
  geolocation:       { label: 'Geolocation',      icon: 'location_on',          color: '#10b981' },
  multi_measurement: { label: 'Multi Measurement', icon: 'scatter_plot',        color: '#db2777' },
}

export const ACCEPTED_FILE_TYPES = ['image', 'pdf', 'doc', 'excel', 'video', 'audio'] as const
export type AcceptedFileType = typeof ACCEPTED_FILE_TYPES[number]

export const FILE_TYPE_CFG: Record<AcceptedFileType, { label: string; icon: string; color: string }> = {
  image: { label: 'Image', icon: 'image',          color: '#0ea5e9' },
  pdf:   { label: 'PDF',   icon: 'picture_as_pdf', color: '#ef4444' },
  doc:   { label: 'Doc',   icon: 'article',        color: '#2563eb' },
  excel: { label: 'Excel', icon: 'table_chart',    color: '#16a34a' },
  video: { label: 'Video', icon: 'videocam',       color: '#8b5cf6' },
  audio: { label: 'Audio', icon: 'graphic_eq',     color: '#f59e0b' },
}

export const inp = (err = false): React.CSSProperties => ({
  width: '100%', boxSizing: 'border-box', borderRadius: 8,
  border: `1px solid ${err ? '#ef4444' : '#e2e8f0'}`, padding: '9px 12px',
  fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'inherit', background: '#fff',
})

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })