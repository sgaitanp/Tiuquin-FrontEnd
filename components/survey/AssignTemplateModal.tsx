'use client'

import { useState } from 'react'

function Ms({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) {
  return <span className='material-symbols-outlined' style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}>{icon}</span>
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
const card:    React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' }

export default function AssignTemplateModal({ templates, currentTemplateId, onAssign, onClose }: {
  templates:          any[]
  currentTemplateId:  string | null
  onAssign:           (templateId: string) => void | Promise<void>
  onClose:            () => void
}) {
  const [selected, setSelected] = useState<string | null>(currentTemplateId)

  // Only APPROVED templates are selectable (action already filters, but guard here too)
  const approved = templates.filter(t => t.status === 'APPROVED')

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Assign Template</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Ms icon='close' style={{ fontSize: 20, color: '#94a3b8' }} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
          Only <strong style={{ color: '#15803d' }}>Approved</strong> templates can be assigned to a site survey.
          The survey will always use the exact version selected here.
        </p>

        {approved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Ms icon='lock_clock' style={{ fontSize: 36, color: '#e2e8f0', display: 'block', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 4px' }}>No approved templates</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Approve a template on the Templates page first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {approved.map(t => {
              const active = selected === t.id
              return (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${active ? '#0f172a' : '#e2e8f0'}`, background: active ? '#0f172a' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <Ms icon='description' style={{ fontSize: 20, color: active ? '#fff' : '#94a3b8' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#0f172a', margin: '0 0 2px' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: active ? '#94a3b8' : '#64748b', margin: 0 }}>
                      v{t.version} · {t.sections?.length ?? 0} sections · {t.sections?.reduce((a: number, s: any) => a + s.questions.length, 0)} questions
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 5, padding: '2px 8px' }}>
                    Approved
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => selected && onAssign(selected)} disabled={!selected || approved.length === 0}
            style={{ borderRadius: 8, border: 'none', background: selected && approved.length > 0 ? '#0f172a' : '#e2e8f0', color: selected && approved.length > 0 ? '#fff' : '#94a3b8', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'default' }}>
            Assign template
          </button>
        </div>
      </div>
    </div>
  )
}