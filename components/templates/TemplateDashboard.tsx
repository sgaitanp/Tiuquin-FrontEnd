'use client'

import { useState, useEffect } from 'react'
import { getTemplates, getTemplateById, createTemplate } from '@/services/templateService'
import type { Template, TemplateGroup } from '@/types/template'
import { Ms }              from './common/shared'
import TemplateList        from './panels/TemplateList'
import TemplateBuilder     from './panels/TemplateBuilder'
import CreateTemplateModal from './modals/CreateTemplateModal'

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

export default function TemplateDashboard() {
  useMaterialSymbols()

  const [groups,   setGroups]   = useState<TemplateGroup[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [search,   setSearch]   = useState('')
  const [creating, setCreating] = useState(false)
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const templates = await getTemplates()
      const groupMap: Record<string, TemplateGroup> = {}
      templates.forEach((t) => {
        const gid = t.groupId ?? t.id
        if (!groupMap[gid]) groupMap[gid] = { groupId: gid, name: t.name, versions: [] }
        groupMap[gid].versions.push(t)
      })
      setGroups(Object.values(groupMap))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleUpdated = async (updated: Template) => {
    await load()
    setSelected(updated)
  }

  const handleCreate = async (name: string) => {
    const newT = await createTemplate({ name, status: 'IN_DESIGN' })
    setCreating(false)
    await load()
    setSelected(newT)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Geist','Inter',system-ui,sans-serif", color: '#0f172a' }}>
      <style>{`.material-symbols-outlined{font-display:block}`}</style>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Loading templates…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      ) : (
        <>

      <TemplateList
        groups={groups}
        selectedId={selected?.id ?? null}
        search={search}
        onSearch={setSearch}
        onSelect={async (t) => {
          try {
            const full = await getTemplateById(t.id)
            setSelected(full)
          } catch {
            setSelected(t)
          }
        }}
        onNew={() => setCreating(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <Ms icon='description' style={{ fontSize: 48, color: '#e2e8f0' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: 0 }}>Select a template version</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Pick one from the list or create a new template</p>
          </div>
        ) : (
          <TemplateBuilder
            key={selected.id}
            template={selected}
            onUpdated={handleUpdated}
          />
        )}
      </div>

      {creating && (
        <CreateTemplateModal
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
      </>
      )}
    </div>
  )
}