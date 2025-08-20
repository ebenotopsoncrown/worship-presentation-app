// components/Workspace.tsx
'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { db, ref as dbRef, set, get } from '../utils/firebase'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

export default function Workspace() {
  const [title, setTitle] = useState('Untitled Slide')
  const [html, setHtml] = useState('<p>Welcome to service!</p>')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const draft = localStorage.getItem('workspace_draft')
    if (draft) { const d = JSON.parse(draft); setTitle(d.title||title); setHtml(d.html||html) }
  }, [])
  useEffect(() => { localStorage.setItem('workspace_draft', JSON.stringify({ title, html })) }, [title, html])

  const firstEmptySlot = async () => {
    for (let i=0;i<4;i++) {
      const s = await get(dbRef(db, `preview_slots/${i}`))
      if (!s.exists()) return i
      if (!s.val()) return i
    }
    return 0 // overwrite slot 1 if all used
  }

  const preview = async () => {
    const i = await firstEmptySlot()
    await set(dbRef(db, `preview_slots/${i}`), {
      id: `${Date.now()}-html`,
      title: title || 'Prepared Slide',
      kind: 'html',
      html
    })
  }

  const sendToLive = async () => {
    setSaving(true)
    try {
      await set(dbRef(db, 'live_content'), [html])
      await set(dbRef(db, 'live_group_size'), 1)
      await set(dbRef(db, 'live_state'), { mode: 'content' })
      await set(dbRef(db, 'live_cursor'), 0)
    } finally { setSaving(false) }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); sendToLive() }
      if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) { e.preventDefault(); preview() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [title, html])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} className="border px-3 py-2 rounded w-full" placeholder="Title"/>
        <button onClick={preview} className="px-3 py-2 border rounded">Preview</button>
        <button onClick={sendToLive} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
          {saving ? 'Sending…' : 'Send to Live (Ctrl+Enter)'}
        </button>
      </div>
      <ReactQuill
        theme="snow"
        value={html}
        onChange={setHtml}
        style={{ height: 320 }}
        modules={{
          toolbar: [
            [{ header: [1,2,3,false] }],
            ['bold','italic','underline','strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image', 'clean'],
          ]
        }}
      />
    </div>
  )
}
