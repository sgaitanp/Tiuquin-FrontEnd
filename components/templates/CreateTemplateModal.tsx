import { useState } from 'react'
import { Ms, inp } from './shared'

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
const card:    React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }

export default function CreateTemplateModal({ onSave, onClose }: {
  onSave:  (name: string) => void
  onClose: () => void
}) {
  const [name,  setName]  = useState('')
  const [error, setError] = useState(false)

  const handleSave = () => {
    if (!name.trim()) { setError(true); return }
    onSave(name.trim())
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>New Template</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Ms icon='close' style={{ fontSize: 20, color: '#94a3b8' }} />
          </button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Template Name *</label>
        <input
          autoFocus
          value={name}
          onChange={e => { setName(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder='e.g. Solar Panel Site Assessment'
          style={inp(error)}
        />
        {error && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>Name is required</p>}

        <p style={{ fontSize: 12, color: '#94a3b8', margin: '10px 0 0' }}>
          A new template will be created with version 1.0 in <strong>In Design</strong> status.
          You can add sections and questions after creation.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose}
            style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave}
            style={{ borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Create template
          </button>
        </div>
      </div>
    </div>
  )
}