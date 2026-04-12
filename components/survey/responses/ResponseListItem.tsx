import { Ms, fmtDate } from './shared'

export default function ResponseListItem({ summary, active, onClick }: {
  summary: any
  active:  boolean
  onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: active ? '1.5px solid #0f172a' : '1px solid #e2e8f0', background: active ? '#0f172a' : '#fff', transition: 'all .15s' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {summary.surveyName}
      </p>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {summary.projectName}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
        <Ms icon='engineering' style={{ fontSize: 13 }} />
        {summary.workerName}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: active ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Ms icon='calendar_month' style={{ fontSize: 12 }} />
          {fmtDate(summary.submittedAt)}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, background: active ? '#1e293b' : '#f1f5f9', color: active ? '#94a3b8' : '#64748b', borderRadius: 20, padding: '2px 8px' }}>
          {summary.totalAnswers} answers
        </span>
      </div>
    </button>
  )
}