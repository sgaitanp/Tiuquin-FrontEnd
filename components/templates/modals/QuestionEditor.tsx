import { useState } from 'react'
import { Ms, inp, TYPE_CFG, FILE_TYPE_CFG } from '../common/shared'
import {
  ACCEPTED_FILE_TYPES,
  QUESTION_TYPES,
  type AcceptedFileType,
  type Option,
  type Question,
  type QuestionType,
} from '@/types/template'

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 560,
  maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
}
const label: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6,
}
const hint: React.CSSProperties = { fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function QuestionEditor({
  question, sectionQuestions, onSave, onClose,
}: {
  question: Question | null
  sectionQuestions: Question[]
  onSave: (q: Question, newFollowUps: Question[]) => void
  onClose: () => void
}) {
  const [text, setText] = useState(question?.questionText ?? '')
  const [type, setType] = useState<QuestionType>(question?.type ?? 'text')
  const [options, setOptions] = useState<Option[]>(
    question?.options?.map(o => ({ ...o })) ?? [],
  )
  const [acceptedFileType, setAcceptedFileType] = useState<AcceptedFileType>(
    question?.acceptedFileType ?? 'image',
  )
  const [requiredReadings, setRequiredReadings] = useState<number>(
    question?.requiredReadings ?? 1,
  )
  const [referencePointLabel, setReferencePointLabel] = useState<string>(
    question?.referencePointLabel ?? '',
  )
  const [measurementUnit, setMeasurementUnit] = useState<string>(
    question?.measurementUnit ?? '',
  )
  const [errorText, setErrorText] = useState<string | null>(null)

  // Follow-up questions created inline from this editor. They are
  // committed to the section only when the outer Save fires, so
  // cancelling discards them.
  const [pendingFollowUps, setPendingFollowUps] = useState<Question[]>([])
  const [creatingFollowUpFor, setCreatingFollowUpFor] = useState<string | null>(null)

  const needsOptions = type === 'single_select' || type === 'multi_select'
  const followUpCandidates = [...sectionQuestions, ...pendingFollowUps].filter(
    q => q.id !== question?.id,
  )

  const addOption = () =>
    setOptions(os => [
      ...os,
      { id: newId(), text: '', order: os.length + 1, followUpQuestionId: null },
    ])

  const patchOption = (id: string, patch: Partial<Option>) =>
    setOptions(os => os.map(o => (o.id === id ? { ...o, ...patch } : o)))

  const removeOption = (id: string) =>
    setOptions(os =>
      os.filter(o => o.id !== id).map((o, i) => ({ ...o, order: i + 1 })),
    )

  const save = () => {
    if (!text.trim()) { setErrorText('Question text is required'); return }
    const cleaned = options.map(o => ({ ...o, text: o.text.trim() })).filter(o => o.text)
    if (needsOptions && cleaned.length < 2) {
      setErrorText('Add at least two options')
      return
    }
    if (type === 'multi_measurement' && (!requiredReadings || requiredReadings < 1)) {
      setErrorText('Readings must be at least 1')
      return
    }

    const q: Question = {
      id:           question?.id ?? newId(),
      questionText: text.trim(),
      type,
      order:        question?.order ?? 0,
      followUp:   question?.followUp ?? false,
      ...(needsOptions ? {
        options: cleaned.map((o, i) => ({
          id:                 o.id,
          text:               o.text,
          order:              i + 1,
          followUpQuestionId: type === 'single_select' ? (o.followUpQuestionId ?? null) : null,
        })),
      } : {}),
      ...(type === 'file' ? { acceptedFileType } : {}),
      ...(type === 'multi_measurement' ? {
        requiredReadings,
        referencePointLabel: referencePointLabel.trim() || null,
        measurementUnit:     measurementUnit.trim() || null,
      } : {}),
    }
    // Only emit pending follow-ups that are still referenced by an option.
    const referenced = new Set<string>()
    if (type === 'single_select') {
      for (const o of options) if (o.followUpQuestionId) referenced.add(o.followUpQuestionId)
    }
    const emit = pendingFollowUps.filter(fu => referenced.has(fu.id))
    onSave(q, emit)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {question ? 'Edit question' : 'New question'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Ms icon='close' style={{ fontSize: 20, color: '#94a3b8' }} />
          </button>
        </div>

        <label style={label}>Question text *</label>
        <textarea
          autoFocus
          value={text}
          onChange={e => { setText(e.target.value); setErrorText(null) }}
          placeholder='e.g. Is the access road paved?'
          rows={2}
          style={{ ...inp(false), resize: 'vertical', fontFamily: 'inherit', minHeight: 56 }}
        />

        <label style={{ ...label, marginTop: 16 }}>Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {QUESTION_TYPES.map(t => {
            const cfg = TYPE_CFG[t]
            const selected = t === type
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 6px', borderRadius: 8,
                  border: `1px solid ${selected ? cfg.color : '#e2e8f0'}`,
                  background: selected ? `${cfg.color}15` : '#fff',
                  color: selected ? cfg.color : '#475569',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <Ms icon={cfg.icon} style={{ fontSize: 15, color: selected ? cfg.color : '#94a3b8' }} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {needsOptions && (
          <>
            <label style={{ ...label, marginTop: 18 }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {options.map(o => (
                <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      value={o.text}
                      onChange={e => patchOption(o.id, { text: e.target.value })}
                      placeholder='Option label'
                      style={{ ...inp(false), flex: 1 }}
                    />
                    <button
                      onClick={() => removeOption(o.id)}
                      title='Remove option'
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                    >
                      <Ms icon='delete_outline' style={{ fontSize: 16, color: '#ef4444' }} />
                    </button>
                  </div>
                  {type === 'single_select' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                      <Ms icon='subdirectory_arrow_right' style={{ fontSize: 14, color: '#94a3b8' }} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>Follow-up:</span>
                      <select
                        value={o.followUpQuestionId ?? ''}
                        onChange={e => patchOption(o.id, { followUpQuestionId: e.target.value || null })}
                        style={{
                          flex: 1, borderRadius: 6, border: '1px solid #e2e8f0',
                          padding: '4px 8px', fontSize: 12, fontFamily: 'inherit',
                          background: '#fff', color: '#334155',
                        }}
                      >
                        <option value=''>— None —</option>
                        {followUpCandidates.map(fc => (
                          <option key={fc.id} value={fc.id}>
                            {fc.questionText || '(untitled)'}
                            {pendingFollowUps.some(p => p.id === fc.id) ? ' (new)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setCreatingFollowUpFor(o.id)}
                        title='Create new follow-up question'
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 500, color: '#0f172a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        <Ms icon='add' style={{ fontSize: 13 }} />
                        New
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addOption}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px', borderRadius: 8, border: '1.5px dashed #cbd5e1',
                  background: 'none', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <Ms icon='add' style={{ fontSize: 16 }} />
                Add option
              </button>
              {type === 'single_select' && (
                <p style={hint}>
                  Follow-ups must already exist in this section. Create the target question first, then come back to link it.
                </p>
              )}
            </div>
          </>
        )}

        {type === 'file' && (
          <>
            <label style={{ ...label, marginTop: 18 }}>Accepted file type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {ACCEPTED_FILE_TYPES.map(ft => {
                const cfg = FILE_TYPE_CFG[ft]
                const selected = ft === acceptedFileType
                return (
                  <button
                    key={ft}
                    onClick={() => setAcceptedFileType(ft)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 6px', borderRadius: 8,
                      border: `1px solid ${selected ? cfg.color : '#e2e8f0'}`,
                      background: selected ? `${cfg.color}15` : '#fff',
                      color: selected ? cfg.color : '#475569',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    <Ms icon={cfg.icon} style={{ fontSize: 14, color: selected ? cfg.color : '#94a3b8' }} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {type === 'multi_measurement' && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={label}>Required readings *</label>
              <input
                type='number'
                min={1}
                value={requiredReadings}
                onChange={e => setRequiredReadings(Math.max(1, Number(e.target.value) || 1))}
                style={inp(false)}
              />
            </div>
            <div>
              <label style={label}>Reference point label</label>
              <input
                value={referencePointLabel}
                onChange={e => setReferencePointLabel(e.target.value)}
                placeholder='e.g. Ground level'
                style={inp(false)}
              />
            </div>
            <div>
              <label style={label}>Measurement unit</label>
              <input
                value={measurementUnit}
                onChange={e => setMeasurementUnit(e.target.value)}
                placeholder='e.g. m, dB, °C'
                style={inp(false)}
              />
            </div>
          </div>
        )}

        {errorText && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: '14px 0 0' }}>{errorText}</p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose}
            style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save}
            style={{ borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {question ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </div>

      {creatingFollowUpFor && (
        <QuestionEditor
          question={null}
          sectionQuestions={[...sectionQuestions, ...pendingFollowUps]}
          onClose={() => setCreatingFollowUpFor(null)}
          onSave={(newQ, nestedFollowUps) => {
            const marked: Question = { ...newQ, followUp: true }
            setPendingFollowUps(fus => [...fus, marked, ...nestedFollowUps])
            patchOption(creatingFollowUpFor, { followUpQuestionId: marked.id })
            setCreatingFollowUpFor(null)
          }}
        />
      )}
    </div>
  )
}
