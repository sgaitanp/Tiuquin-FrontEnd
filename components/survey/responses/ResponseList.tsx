import { Ms } from './shared'
import ResponseListItem from './ResponseListItem'

export default function ResponseList({ summaries, selected, search, onSearch, onSelect }: {
  summaries: any[] | null
  selected:  any
  search:    string
  onSearch:  (v: string) => void
  onSelect:  (s: any) => void
}) {
  const filtered = (summaries ?? []).filter(s => {
    const q = search.toLowerCase()
    return !q
      || s.surveyName.toLowerCase().includes(q)
      || s.projectName.toLowerCase().includes(q)
      || s.workerName.toLowerCase().includes(q)
  })

  return (
    <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Survey Responses</h1>
        <div style={{ position: 'relative' }}>
          <Ms icon='search' style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder='Search…'
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {summaries === null && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>Loading…</p>
        )}
        {summaries !== null && filtered.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Ms icon='search_off' style={{ fontSize: 32, color: '#e2e8f0', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No responses found</p>
          </div>
        )}
        {filtered.map(s => (
          <ResponseListItem
            key={s.id}
            summary={s}
            active={selected?.id === s.id}
            onClick={() => onSelect(s)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {filtered.length} of {(summaries ?? []).length} response{(summaries ?? []).length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}