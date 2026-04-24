import { useState } from 'react'
import { Ms, TYPE_CFG, inp, orderQuestionsForDisplay } from '../common/shared'
import type { Question, Section } from '@/types/template'

export default function SectionCard({ section, index, readOnly, onUpdate, onDelete, onEditQuestion }: {
  section:         Section
  index:           number
  readOnly:        boolean
  onUpdate:        (s: Section) => void
  onDelete:        () => void
  onEditQuestion:  (q: Question | null, sectionId: string) => void
}) {
  const [expanded,     setExpanded]     = useState(true)
  const [editingName,  setEditingName]  = useState(false)
  const [nameVal,      setNameVal]      = useState(section.name)

  const saveName = () => {
    setEditingName(false)
    if (nameVal.trim() && nameVal !== section.name) {
      onUpdate({ ...section, name: nameVal.trim() })
    }
  }

  const removeQuestion = (qid: string) => {
    onUpdate({ ...section, questions: section.questions.filter((q) => q.id !== qid) })
  }

  const addPlaceholder = () => {
    onEditQuestion(null, section.id)
  }

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderBottom: expanded ? '1px solid #e2e8f0' : 'none' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{index + 1}</span>
        </div>

        {editingName && !readOnly ? (
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()}
            style={{ ...inp(), flex: 1, padding: '5px 10px', fontSize: 13, fontWeight: 600 }} />
        ) : (
          <p
            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, cursor: readOnly ? 'default' : 'text' }}
            onDoubleClick={() => !readOnly && setEditingName(true)}
            title={readOnly ? '' : 'Double-click to rename'}
          >
            {section.name}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>{section.questions.length} q</span>
          {!readOnly && (
            <button onClick={onDelete} title='Delete section'
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Ms icon='delete_outline' style={{ fontSize: 16, color: '#ef4444' }} />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Ms icon={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} style={{ fontSize: 20, color: '#94a3b8' }} />
          </button>
        </div>
      </div>

      {/* Questions */}
      {expanded && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {section.questions.length === 0 && (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '12px 0', margin: 0 }}>
              No questions yet
            </p>
          )}

          {section.questions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 420,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {orderQuestionsForDisplay(section.questions).map((q) => {
                const typeCfg = TYPE_CFG[q.type] ?? TYPE_CFG.text
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1px solid ${q.followUp ? '#fde68a' : '#f1f5f9'}`, background: q.followUp ? '#fffbeb' : '#fafafa' }}>
                    {q.followUp && (
                      <Ms icon='subdirectory_arrow_right' style={{ fontSize: 15, color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.4 }}>{q.questionText}</p>
                      {(q.type === 'single_select' || q.type === 'multi_select') && q.options && q.options.length > 0 && (
                        <ul style={{ margin: '4px 0 6px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {q.options.map((o) => (
                            <li key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', lineHeight: 1.3 }}>
                              <Ms
                                icon={q.type === 'single_select' ? 'radio_button_unchecked' : 'check_box_outline_blank'}
                                style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}
                              />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.text}</span>
                              {q.type === 'single_select' && o.followUpQuestionId && (
                                <span title='Has follow-up' style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b' }}>
                                  <Ms icon='subdirectory_arrow_right' style={{ fontSize: 12, color: '#f59e0b' }} />
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: typeCfg.color, background: `${typeCfg.color}15`, borderRadius: 5, padding: '1px 7px', fontWeight: 500 }}>
                          <Ms icon={typeCfg.icon} style={{ fontSize: 12, color: typeCfg.color }} />
                          {typeCfg.label}
                        </span>
                        {q.type === 'multi_measurement' && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {q.requiredReadings ?? 0} readings · {q.measurementUnit || '—'}
                          </span>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button onClick={() => onEditQuestion(q, section.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Ms icon='edit' style={{ fontSize: 15, color: '#64748b' }} />
                        </button>
                        <button onClick={() => removeQuestion(q.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Ms icon='delete_outline' style={{ fontSize: 15, color: '#ef4444' }} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!readOnly && (
            <button onClick={addPlaceholder}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', marginTop: 2 }}>
              <Ms icon='add' style={{ fontSize: 16 }} />
              Add question
            </button>
          )}
        </div>
      )}
    </div>
  )
}