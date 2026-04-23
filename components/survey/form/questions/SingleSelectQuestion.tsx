import type { Question } from '@/types/template'

export default function SingleSelectQuestion({ question, value = '', onChange }: {
  question: Question
  value:    string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(question.options ?? []).map((opt) => {
        const on = value === opt.id
        return (
          <button key={opt.id} type='button' onClick={() => onChange(on ? '' : opt.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, border: `1.5px solid ${on ? '#0f172a' : '#e2e8f0'}`, background: on ? '#0f172a' : '#fff', color: on ? '#fff' : '#374151', padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' }}>
            {/* Radio circle */}
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${on ? '#fff' : '#cbd5e1'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {on && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
            </div>
            {opt.text}
          </button>
        )
      })}
    </div>
  )
}