import { Ms, StatusBadge, fmtDate } from '../common/shared'
import type { Template, TemplateGroup } from '@/types/template'

export default function TemplateListItem({ group, selectedId, onSelect }: {
  group:      TemplateGroup
  selectedId: string | null
  onSelect:   (t: Template) => void
}) {
  const isActive = group.versions.some((v) => v.id === selectedId)

  return (
    <div style={{ borderRadius: 10, border: `1.5px solid ${isActive ? '#0f172a' : '#e2e8f0'}`, overflow: 'hidden', background: '#fff' }}>

      {/* Group header */}
      <div style={{ padding: '12px 14px', background: isActive ? '#0f172a' : '#fff' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#0f172a', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {group.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
            <Ms icon='layers' style={{ fontSize: 13 }} />
            {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Version rows */}
      {group.versions.map((v) => {
        const active = v.id === selectedId
        return (
          <div key={v.id} style={{ borderTop: '1px solid #f1f5f9', background: active ? '#f8fafc' : '#fff', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => onSelect(v)}
              style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Ms icon='subdirectory_arrow_right' style={{ fontSize: 14, color: '#94a3b8' }} />
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#0f172a' : '#64748b' }}>
                v{v.version}
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{fmtDate(v.createdAt)}</span>
              <StatusBadge status={v.status} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
