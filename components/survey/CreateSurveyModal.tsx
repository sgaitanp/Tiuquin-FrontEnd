import { useState } from 'react'
import { createSurvey } from '@/actions/surveyFormActions'
import { STATUS_CFG, STATUSES, inp } from './shared'

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

const EMPTY_WO     = { number: '', priority: 'HIGH' as const, description: '', createdById: '' }
const EMPTY_SURVEY = { name: '', projectId: '', templateId: '', assignedToId: '', scheduledDate: '', status: 'PLANNED' }

export default function CreateSurveyModal({ projects, templates, crewMembers, platformOperators, onClose, onCreated }: {
  projects:           any[]
  templates:          any[]
  crewMembers:        any[]
  platformOperators:  any[]
  onClose:            () => void
  onCreated:          (survey: any) => void
}) {
  const [step,   setStep]   = useState<1 | 2>(1)
  const [wo,     setWo]     = useState(EMPTY_WO)
  const [sv,     setSv]     = useState(EMPTY_SURVEY)
  const [eWo,    setEWo]    = useState<Record<string, string>>({})
  const [eSv,    setESv]    = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const setW = (k: string, v: string) => { setWo(p => ({ ...p, [k]: v })); setEWo(p => ({ ...p, [k]: '' })) }
  const setS = (k: string, v: string) => { setSv(p => ({ ...p, [k]: v })); setESv(p => ({ ...p, [k]: '' })) }

  const validateStep1 = () => {
    const err: Record<string, string> = {}
    if (!wo.number.trim())      err.number      = 'Required'
    if (!wo.description.trim()) err.description = 'Required'
    if (!wo.createdById)        err.createdById = 'Required'
    setEWo(err)
    return !Object.keys(err).length
  }

  const validateStep2 = () => {
    const err: Record<string, string> = {}
    if (!sv.name.trim()) err.name      = 'Required'
    if (!sv.projectId)   err.projectId = 'Required'
    setESv(err)
    return !Object.keys(err).length
  }

  const handleNext = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validateStep2()) return
    setSaving(true)
    const crew     = sv.assignedToId ? crewMembers.find(m => m.id === sv.assignedToId) : null
    const operator = platformOperators.find(o => o.id === wo.createdById)
    const survey   = await createSurvey({
      name:          sv.name.trim(),
      projectId:     sv.projectId,
      templateId:    sv.templateId || null,
      assignedTo:    crew ? { id: crew.id, name: crew.name } : null,
      scheduledDate: sv.scheduledDate || null,
      status:        sv.status,
      workOrder: {
        number:      wo.number.trim(),
        priority:    wo.priority,
        description: wo.description.trim(),
        createdBy:   operator?.name ?? '',
      },
    })
    setSaving(false)
    onCreated(survey)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>New Site Survey</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
              {step === 1 ? 'Step 1 of 2 — Work Order details' : 'Step 2 of 2 — Survey details'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', borderRadius: 6 }}>
            <Ms icon='close' style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderBottom: '1px solid #f1f5f9' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step === n ? '#0f172a' : n < step ? '#22c55e' : '#f1f5f9', color: step === n ? '#fff' : n < step ? '#fff' : '#94a3b8', flexShrink: 0 }}>
                {n < step ? <Ms icon='check' style={{ fontSize: 13, color: '#fff' }} /> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === n ? 600 : 400, color: step === n ? '#0f172a' : '#94a3b8' }}>
                {n === 1 ? 'Work Order' : 'Survey Info'}
              </span>
              {n < 2 && <div style={{ width: 32, height: 1, background: '#e2e8f0', marginLeft: 4 }} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Work Order ── */}
        {step === 1 && (
          <form onSubmit={handleNext} noValidate style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Lbl t='Work Order Number' required />
                <input value={wo.number} onChange={ev => setW('number', ev.target.value)} placeholder='WO-2025-0007' style={inp(!!eWo.number)} />
                <ErrMsg msg={eWo.number} />
              </div>
              <div>
                <Lbl t='Priority' required />
                <select value={wo.priority} onChange={ev => setW('priority', ev.target.value)} style={inp()}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Lbl t='Description' required />
              <textarea value={wo.description} onChange={ev => setW('description', ev.target.value)} placeholder='Describe the work order…' rows={3}
                style={{ ...inp(!!eWo.description), resize: 'vertical' as const }} />
              <ErrMsg msg={eWo.description} />
            </div>

            <div>
              <Lbl t='Created By (Platform Operator)' required />
              <select value={wo.createdById} onChange={ev => setW('createdById', ev.target.value)} style={inp(!!eWo.createdById)}>
                <option value=''>Select an operator…</option>
                {platformOperators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <ErrMsg msg={eWo.createdById} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type='submit' style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Next<Ms icon='arrow_forward' style={{ fontSize: 15, color: '#fff' }} />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Survey Info ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Lbl t='Survey Name' required />
              <input value={sv.name} onChange={ev => setS('name', ev.target.value)} placeholder='e.g. HVAC Air System Site Survey' style={inp(!!eSv.name)} />
              <ErrMsg msg={eSv.name} />
            </div>

            <div>
              <Lbl t='Project' required />
              <select value={sv.projectId} onChange={ev => setS('projectId', ev.target.value)} style={inp(!!eSv.projectId)}>
                <option value=''>Select a project…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
              </select>
              <ErrMsg msg={eSv.projectId} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Lbl t='Status' required />
                <select value={sv.status} onChange={ev => setS('status', ev.target.value)} style={inp()}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                </select>
              </div>
              <div>
                <Lbl t='Scheduled Date' />
                <input type='datetime-local' value={sv.scheduledDate} onChange={ev => setS('scheduledDate', ev.target.value)} style={inp()} />
              </div>
            </div>

            <div>
              <Lbl t='Template' />
              <select value={sv.templateId} onChange={ev => setS('templateId', ev.target.value)} style={inp()}>
                <option value=''>No template (assign later)</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} — v{t.version}</option>)}
              </select>
              {sv.templateId && (() => {
                const t = templates.find(t => t.id === sv.templateId)
                return t ? <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Ms icon='info' style={{ fontSize: 13, color: '#94a3b8' }} />{t.sections.length} sections · {t.sections.flatMap((s: any) => s.questions).length} questions</p> : null
              })()}
            </div>

            <div>
              <Lbl t='Assign Field Crew Member' />
              <select value={sv.assignedToId} onChange={ev => setS('assignedToId', ev.target.value)} style={inp()}>
                <option value=''>Unassigned</option>
                {crewMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
              <button type='button' onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
                <Ms icon='arrow_back' style={{ fontSize: 15 }} />Back
              </button>
              <button type='submit' disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : '#0f172a', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? <><Ms icon='sync' style={{ fontSize: 14, color: '#fff' }} />Creating…</> : <><Ms icon='add' style={{ fontSize: 14, color: '#fff' }} />Create Survey</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}