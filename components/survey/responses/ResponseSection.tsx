import { Ms } from './shared'

function QuestionCard({ qa }: { qa: any }) {
  const displayValue = qa.selectedOptionText ?? qa.inputValue ?? '—'

  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0, lineHeight: 1.4 }}>{qa.questionText}</p>
        <span style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 6px', flexShrink: 0, fontFamily: 'monospace' }}>
          {qa.questionType}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ms icon='check_circle' style={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }} />
        <p style={{ fontSize: 14, color: '#0f172a', margin: 0, fontWeight: 500 }}>{displayValue}</p>
      </div>
    </div>
  )
}

export default function ResponseSection({ section, index }: { section: any; index: number }) {
  const questionAnswers = section.questionAnswers ?? []
  const [title, subtitle] = (section.sectionName ?? '').includes(' - ')
    ? (section.sectionName ?? '').split(' - ')
    : [section.sectionName ?? `Section ${index + 1}`, null]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{index + 1}</span>
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 38 }}>
        {questionAnswers.map((qa: any) => (
          <QuestionCard key={qa.questionId} qa={qa} />
        ))}
        {questionAnswers.length === 0 && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No answers in this section.</p>
        )}
      </div>
    </div>
  )
}