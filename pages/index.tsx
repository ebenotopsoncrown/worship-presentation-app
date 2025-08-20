'use client'
import { useState } from 'react'
import Workspace from '../components/Workspace'
import HymnDisplay from '../components/HymnDisplay'
import BibleDisplay from '../components/BibleDisplay'
import QueuePanel from '../components/QueuePanel'
import ThemeSettings from '../components/ThemeSettings'
import PreviewBoard from '../components/PreviewBoard'

export default function IndexPage() {
  const [tab, setTab] = useState<'workspace'|'hymns'|'bible'|'queue'|'theme'>('workspace')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-3 border-b bg-white flex items-center gap-2">
        <button onClick={()=>setTab('hymns')} className="px-2 py-1 border rounded">Hymns</button>
        <button onClick={()=>setTab('bible')} className="px-2 py-1 border rounded">Bible</button>
        <button onClick={()=>setTab('workspace')} className="px-2 py-1 border rounded">Workspace</button>
        <button onClick={()=>setTab('queue')} className="px-2 py-1 border rounded">Queue</button>
        <button onClick={()=>setTab('theme')} className="px-2 py-1 border rounded">Theme</button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: active tool */}
        <div className="space-y-3">
          {tab === 'workspace' && (
            <div className="bg-white rounded shadow p-3">
              <h3 className="font-semibold mb-2">Workspace</h3>
              <Workspace />
            </div>
          )}

          {tab === 'hymns' && (
            <div className="bg-white rounded shadow p-3">
              <HymnDisplay />
            </div>
          )}

          {tab === 'bible' && (
            <div className="bg-white rounded shadow p-3">
              <BibleDisplay />
            </div>
          )}

          {tab === 'queue' && (
            <div className="bg-white rounded shadow p-3">
              <QueuePanel />
            </div>
          )}

          {tab === 'theme' && (
            <div className="bg-white rounded shadow p-3">
              <h3 className="font-semibold mb-2">Theme & Presentation</h3>
              <ThemeSettings />
            </div>
          )}
        </div>

        {/* RIGHT: 4-slot preview board */}
        <div className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Preview</h3>
          <PreviewBoard />
          <p className="text-xs text-gray-500 mt-2">
            Queue/Hymns/Bible/Workspace send items here first. Click “Go Live” on a tile when ready.
          </p>
        </div>
      </div>
    </div>
  )
}
