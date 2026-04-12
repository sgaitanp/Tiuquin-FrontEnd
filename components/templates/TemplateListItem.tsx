import { useState } from 'react'
import { Ms, StatusBadge, fmtDate } from './shared'
import { deleteTemplateVersion, deleteTemplateGroup } from '@/actions/templateActions'

export default function TemplateListItem({ group, selectedId, onSelect, onDeleted }: {
  group:      any
  selectedId: string | null
  onSelect:   (t: any) => void
  onDeleted:  (groupId: string, deletedVersionId?: string) => void
}) {
  const isActive       = group.versions.some((v: any) => v.id === selectedId)
  const hasApproved    = group.versions.some((v: any) => v.status === 'APPROVED')
  const canDeleteGroup = !hasApproved

  const [confirmGroup,   setConfirmGroup]   = useState(false)
  const [confirmVersion, setConfirmVersion] = useState<string | null>(null)

  const handleDeleteVersion = async (id: string) => {
    await deleteTemplateVersion(id)
    setConfirmVersion(null)
    onDeleted(group.groupId, id)
  }

  const handleDeleteGroup = async () => {
    await deleteTemplateGroup(group.groupId)
    setConfirmGroup(false)
    onDeleted(group.groupId)
  }

  return (
    <div style={{ borderRadius: 10, border: `1.5px solid ${isActive ? '#0f172a' : '#e2e8f0'}`, overflow: 'hidden', background: '#fff' }}>

      {/* Group header */}
      <div style={{ padding: '12px 14px', background: isActive ? '#0f172a' : '#fff', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#0f172a', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {group.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
            <Ms icon='layers' style={{ fontSize: 13 }} />
            {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Delete group button */}
        {canDeleteGroup && (
          confirmGroup ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Delete all?</span>
              <button onClick={handleDeleteGroup}
                style={{ fontSize: 10, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
                Yes
              </button>
              <button onClick={() => setConfirmGroup(false)}
                style={{ fontSize: 10, background: 'none', border: '1px solid #94a3b8', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', color: '#94a3b8' }}>
                No
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmGroup(true)} title='Delete template'
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
              <Ms icon='delete_outline' style={{ fontSize: 16, color: isActive ? '#94a3b8' : '#ef4444' }} />
            </button>
          )
        )}
      </div>

      {/* Version rows */}
      {group.versions.map((v: any) => {
        const active      = v.id === selectedId
        const canDelete   = v.status === 'IN_DESIGN' || v.status === 'IN_REVISION'
        const confirming  = confirmVersion === v.id

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

            {/* Delete version */}
            {canDelete && (
              confirming ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Sure?</span>
                  <button onClick={() => handleDeleteVersion(v.id)}
                    style={{ fontSize: 10, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
                    Yes
                  </button>
                  <button onClick={() => setConfirmVersion(null)}
                    style={{ fontSize: 10, background: 'none', border: '1px solid #94a3b8', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', color: '#94a3b8' }}>
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmVersion(v.id)} title='Delete version'
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px 4px 4px', flexShrink: 0 }}>
                  <Ms icon='delete_outline' style={{ fontSize: 15, color: '#ef4444' }} />
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}