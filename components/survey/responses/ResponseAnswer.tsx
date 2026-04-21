import { Ms } from './shared'

export default function ResponseAnswer({ question }: { question: any }) {
  const { type, displayValue } = question

  if (type === 'geolocation' && displayValue) {
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayValue)}`}
        target='_blank'
        rel='noopener noreferrer'
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0f766e', textDecoration: 'none', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 10px' }}>
        <Ms icon='location_on' style={{ fontSize: 14, color: '#10b981' }} />
        {displayValue}
      </a>
    )
  }

  if (type === 'file' && displayValue) {
    const filename = displayValue.split('/').pop()
    return (
      <a href={displayValue} target='_blank' rel='noopener noreferrer'
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1d4ed8', textDecoration: 'none', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px' }}>
        <Ms icon='attach_file' style={{ fontSize: 14, color: '#1d4ed8' }} />
        {filename}
      </a>
    )
  }

  if ((type === 'multi_select' || type === 'single_select') && displayValue) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '4px 10px', fontSize: 13, color: '#15803d', fontWeight: 500 }}>
        <Ms icon={type === 'single_select' ? 'radio_button_checked' : 'check_circle'} style={{ fontSize: 14, color: '#22c55e' }} />
        {displayValue}
      </span>
    )
  }

  return (
    <p style={{ margin: 0, fontSize: 13, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '8px 12px', lineHeight: 1.5 }}>
      {displayValue || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No answer</span>}
    </p>
  )
}