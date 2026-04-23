import { Ms } from '../common/shared'
import type { Template, TemplateGroup } from '@/types/template'
import TemplateListItem from './TemplateListItem'

export default function TemplateList({ groups, selectedId, search, onSearch, onSelect, onNew }: {
  groups:     TemplateGroup[]
  selectedId: string | null
  search:     string
  onSearch:   (v: string) => void
  onSelect:   (t: Template) => void
  onNew:      () => void
}) {
  const filtered = groups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Templates</h1>
          <button onClick={onNew} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Ms icon='add' style={{ fontSize: 15, color: '#fff' }} />New
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Ms icon='search' style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94a3b8' }} />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder='Search templates…'
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Ms icon='search_off' style={{ fontSize: 32, color: '#e2e8f0', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No templates found</p>
          </div>
        )}
        {filtered.map(g => (
          <TemplateListItem key={g.groupId} group={g} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {groups.reduce((a, g) => a + g.versions.length, 0)} version{groups.reduce((a, g) => a + g.versions.length, 0) !== 1 ? 's' : ''} across {groups.length} template{groups.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}