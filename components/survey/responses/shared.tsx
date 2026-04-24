export const Ms = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className='material-symbols-outlined' style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}>
    {icon}
  </span>
)

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

/**
 * Human-readable labels for backend question-type enum values.
 * Responses arrive with the UPPERCASE wire format (`SINGLE_SELECT`,
 * `MULTI_MEASUREMENT`, …); this dictionary converts them for display.
 */
const QUESTION_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text',
  SINGLE_SELECT: 'Single Choice',
  MULTI_SELECT: 'Multi Select',
  FILE: 'File Upload',
  IMAGE: 'Image',
  GEOLOCATION: 'Geolocation',
  MULTI_MEASUREMENT: 'Multi Measurement',
}

export const fmtQuestionType = (type: string | null | undefined): string => {
  if (!type) return '—'
  return QUESTION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase()
}