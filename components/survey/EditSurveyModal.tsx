'use client'

import { useState } from 'react'
import { updateSurvey } from '@/actions/surveyFormActions'
import { inp } from './shared'

const Ms  = ({ icon, style = {} }: { icon: string; style?: React.CSSProperties }) => (
  <span className='material-symbols-outlined' style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}>{icon}</span>
)
const Lbl = ({ t, required }: { t: string; required?: boolean }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
    {t}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
  </label>
)
const ErrMsg = ({ msg }: { msg?: string }) =>
  msg ? <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0' }}>{msg}</p> : null

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function EditSurveyModal({ survey, crewMembers, platformOperators, onClose, onSaved }: {
  survey:             any
  crewMembers:        any[]
  platformOperators:  any[]
  onClose:            () => void
  onSaved:            (updated: any) => void
}) {
  const [form, setForm] = useState({
    name:          survey.name ?? '',
    scheduledDate: toDatetimeLocal(survey.scheduledDate),
    assignedToId:  survey.assignedTo?.id ?? '',
    // location
    address: survey.location?.address ?? '',
    city:    survey.location?.city    ?? '',
    state:   survey.location?.state   ?? '',
    zip:     survey.location?.zip     ?? '',
    // contact
    contactName:  survey.contact?.name  ?? '',
    contactRole:  survey.contact?.role  ?? '',
    contactPhone: survey.contact?.phone ?? '',
    contactEmail: survey.contact?.email ?? '',
    // work order
    woNumber:      survey.workOrder?.number      ?? '',
    woPriority:    survey.workOrder?.priority    ?? 'HIGH',
    woDescription: survey.workOrder?.description ?? '',
    woCreatedById: platformOperators.find(o => o.name === survey.workOrder?.createdBy)?.id ?? '',
  })
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [saving,  setSaving]  = useState(false)

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())          e.name          = 'Required'
    if (!form.address.trim())       e.address       = 'Required'
    if (!form.city.trim())          e.city          = 'Required'
    if (!form.state.trim())         e.state         = 'Required'
    if (!form.zip.trim())           e.zip           = 'Required'
    if (!form.contactName.trim())   e.contactName   = 'Required'
    if (!form.contactRole.trim())   e.contactRole   = 'Required'
    if (!form.contactPhone.trim())  e.contactPhone  = 'Required'
    if (!form.contactEmail.trim())  e.contactEmail  = 'Required'
    if (!form.woNumber.trim())      e.woNumber      = 'Required'
    if (!form.woDescription.trim()) e.woDescription = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    const crew     = form.assignedToId ? crewMembers.find(m => m.id === form.assignedToId) : null
    const operator = platformOperators.find(o => o.id === form.woCreatedById)
    const updated  = await updateSurvey(survey.id, {
      name:          form.name.trim(),
      scheduledDate: form.scheduledDate || null,
      assignedTo:    crew ? { id: crew.id, name: crew.name } : null,
      location: {
        address: form.address.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        zip:     form.zip.trim(),
      },
      contact: {
        name:  form.contactName.trim(),
        role:  form.contactRole.trim(),
        phone: form.contactPhone.trim(),
        email: form.contactEmail.trim(),
      },
      workOrder: {
        ...survey.workOrder,
        number:      form.woNumber.trim(),
        priority:    form.woPriority,
        description: form.woDescription.trim(),
        createdBy:   operator?.name ?? survey.workOrder?.createdBy ?? '',
      },
    })
    setSaving(false)
    onSaved(updated)
    onClose()
  }

  const Section = ({ title }: { title: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 12px' }}>{title}</p>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Edit Site Survey</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{survey.id} · {survey.projectName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', borderRadius: 6 }}>
            <Ms icon='close' style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Survey Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title='Survey Info' />
            <div>
              <Lbl t='Survey Name' required />
              <input value={form.name} onChange={ev => set('name', ev.target.value)} style={inp(!!errors.name)} />
              <ErrMsg msg={errors.name} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Lbl t='Scheduled Date' />
                <input type='datetime-local' value={form.scheduledDate} onChange={ev => set('scheduledDate', ev.target.value)} style={inp()} />
              </div>
              <div>
                <Lbl t='Assigned Field Crew' />
                <select value={form.assignedToId} onChange={ev => set('assignedToId', ev.target.value)} style={inp()}>
                  <option value=''>Unassigned</option>
                  {crewMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title='Location' />
            <div>
              <Lbl t='Address' required />
              <input value={form.address} onChange={ev => set('address', ev.target.value)} style={inp(!!errors.address)} />
              <ErrMsg msg={errors.address} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
              <div>
                <Lbl t='City' required />
                <input value={form.city} onChange={ev => set('city', ev.target.value)} style={inp(!!errors.city)} />
                <ErrMsg msg={errors.city} />
              </div>
              <div>
                <Lbl t='State' required />
                <input value={form.state} onChange={ev => set('state', ev.target.value)} style={inp(!!errors.state)} />
                <ErrMsg msg={errors.state} />
              </div>
              <div>
                <Lbl t='Zip' required />
                <input value={form.zip} onChange={ev => set('zip', ev.target.value)} style={inp(!!errors.zip)} />
                <ErrMsg msg={errors.zip} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title='Site Contact' />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Lbl t='Name' required />
                <input value={form.contactName} onChange={ev => set('contactName', ev.target.value)} style={inp(!!errors.contactName)} />
                <ErrMsg msg={errors.contactName} />
              </div>
              <div>
                <Lbl t='Role' required />
                <input value={form.contactRole} onChange={ev => set('contactRole', ev.target.value)} style={inp(!!errors.contactRole)} />
                <ErrMsg msg={errors.contactRole} />
              </div>
              <div>
                <Lbl t='Phone' required />
                <input value={form.contactPhone} onChange={ev => set('contactPhone', ev.target.value)} style={inp(!!errors.contactPhone)} />
                <ErrMsg msg={errors.contactPhone} />
              </div>
              <div>
                <Lbl t='Email' required />
                <input value={form.contactEmail} onChange={ev => set('contactEmail', ev.target.value)} style={inp(!!errors.contactEmail)} />
                <ErrMsg msg={errors.contactEmail} />
              </div>
            </div>
          </div>

          {/* Work Order */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title='Work Order' />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Lbl t='WO Number' required />
                <input value={form.woNumber} onChange={ev => set('woNumber', ev.target.value)} style={inp(!!errors.woNumber)} />
                <ErrMsg msg={errors.woNumber} />
              </div>
              <div>
                <Lbl t='Priority' />
                <select value={form.woPriority} onChange={ev => set('woPriority', ev.target.value)} style={inp()}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Lbl t='Description' required />
              <textarea value={form.woDescription} onChange={ev => set('woDescription', ev.target.value)} rows={3}
                style={{ ...inp(!!errors.woDescription), resize: 'vertical' as const }} />
              <ErrMsg msg={errors.woDescription} />
            </div>
            <div>
              <Lbl t='Created By (Platform Operator)' />
              <select value={form.woCreatedById} onChange={ev => set('woCreatedById', ev.target.value)} style={inp()}>
                <option value=''>Select an operator…</option>
                {platformOperators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button type='button' onClick={onClose} style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
              Cancel
            </button>
            <button type='submit' disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : '#0f172a', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? <><Ms icon='sync' style={{ fontSize: 14, color: '#fff' }} />Saving…</> : <><Ms icon='check' style={{ fontSize: 14, color: '#fff' }} />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}