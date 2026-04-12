'use client'

import { useState, useEffect } from 'react'
import { getSiteSurveysWithResponsesByStatus, getSiteSurveyResponses, updateSiteSurveyStatus } from '@/services/surveyService'
import ResponseDetail from './ResponseDetail'
import { Ms } from './shared'

function useMaterialSymbols() {
  useEffect(() => {
    const id = 'material-symbols-font'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id; link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block'
      document.head.appendChild(link)
    }
  }, [])
}

const STATUSES = [
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED',         label: 'Approved'         },
  { value: 'CLOSED',           label: 'Closed'           },
  { value: 'REJECTED',         label: 'Rejected'         },
]

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  PENDING_APPROVAL: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  APPROVED:         { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  CLOSED:           { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  REJECTED:         { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}

export default function SurveyResponsesDashboard() {
  useMaterialSymbols()

  const [surveys,    setSurveys]   = useState<any[] | null>(null)
  const [selected,   setSelected]  = useState<any>(null)
  const [responses,  setResponses] = useState<any[]>([])
  const [loading,    setLoading]   = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [search,     setSearch]    = useState('')
  const [status,     setStatus]    = useState('PENDING_APPROVAL')
  const [changingStatus, setChangingStatus] = useState<any>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    setListLoading(true)
    setSelected(null)
    setResponses([])
    getSiteSurveysWithResponsesByStatus(status)
      .then(data => { setSurveys(data); setListLoading(false) })
      .catch(() => { setSurveys([]); setListLoading(false) })
  }, [status])

  useEffect(() => {
    if (!selected) { setResponses([]); return }
    setLoading(true)
    getSiteSurveyResponses(selected.id)
      .then(data => { setResponses(data); setLoading(false) })
      .catch(() => { setResponses([]); setLoading(false) })
  }, [selected?.id])

  const filtered = (surveys ?? []).filter(s => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q)
  })

  const statusCfg = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING_APPROVAL

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Geist','Inter',system-ui,sans-serif", color: '#0f172a' }}>
      <style>{`.material-symbols-outlined{font-display:block}`}</style>

      {/* Left panel */}
      <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Responses</h1>

          {/* Status filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {STATUSES.map(s => {
              const active = status === s.value
              const cfg = STATUS_COLORS[s.value]
              return (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  style={{ borderRadius: 20, border: `1px solid ${active ? cfg.border : '#e2e8f0'}`, background: active ? cfg.bg : '#fff', color: active ? cfg.color : '#94a3b8', padding: '3px 10px', fontSize: 11, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Ms icon='search' style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search surveys…'
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {listLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#0f172a', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Loading…</span>
            </div>
          )}
          {!listLoading && filtered.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>No surveys found</p>
          )}
          {!listLoading && filtered.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: selected?.id === s.id ? `1.5px solid #0f172a` : '1px solid #e2e8f0', background: selected?.id === s.id ? '#0f172a' : '#fff', cursor: 'pointer', transition: 'all .15s' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: selected?.id === s.id ? '#fff' : '#0f172a', margin: 0 }}>{s.name}</p>
              <p style={{ fontSize: 11, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', borderRadius: 4, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>{status.replace('_', ' ')}</span>
              </p>
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{filtered.length} survey{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <Ms icon='rate_review' style={{ fontSize: 48, color: '#e2e8f0' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: 0 }}>Select a survey</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Pick one from the list to see its responses</p>
          </div>
        )}

        {selected && loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading responses…</span>
          </div>
        )}

        {selected && !loading && responses.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <Ms icon='inbox' style={{ fontSize: 48, color: '#e2e8f0' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: 0 }}>No responses yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>This survey has not been submitted yet</p>
          </div>
        )}

        {selected && !loading && responses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '10px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setChangingStatus(selected)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
                <Ms icon='swap_horiz' style={{ fontSize: 14 }} />Change Status
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ResponseDetail detail={responses[0]} />
            </div>
          </div>
        )}

        {/* Change Status Modal */}
        {changingStatus && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Change Status</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 20px' }}>{changingStatus.name}</p>
              <select defaultValue={changingStatus.status} id='new-status-select'
                style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 16 }}>
                {['PLANNED','IN_PROGRESS','PENDING_APPROVAL','APPROVED','CLOSED','REJECTED'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                ))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setChangingStatus(null)}
                  style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                  Cancel
                </button>
                <button disabled={statusSaving} onClick={async () => {
                  const sel = (document.getElementById('new-status-select') as HTMLSelectElement).value
                  setStatusSaving(true)
                  try {
                    await updateSiteSurveyStatus(changingStatus.id, sel)
                    setSelected((prev: any) => ({ ...prev, status: sel }))
                    setSurveys(prev => (prev||[]).map(s => s.id === changingStatus.id ? {...s, status: sel} : s))
                    setChangingStatus(null)
                  } finally { setStatusSaving(false) }
                }}
                  style={{ borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {statusSaving ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}