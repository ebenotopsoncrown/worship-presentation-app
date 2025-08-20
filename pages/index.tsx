// pages/index.tsx
import dynamic from 'next/dynamic'
import React from 'react'

// Lazy-load all operator tools to prevent SSR evaluation problems
const Workspace     = dynamic(() => import('../components/Workspace'),     { ssr: false })
const HymnDisplay   = dynamic(() => import('../components/HymnDisplay'),   { ssr: false })
const BibleDisplay  = dynamic(() => import('../components/BibleDisplay'),  { ssr: false })
const QueuePanel    = dynamic(() => import('../components/QueuePanel'),    { ssr: false })
const ThemeSettings = dynamic(() => import('../components/ThemeSettings'), { ssr: false })
const PreviewBoard  = dynamic(() => import('../components/PreviewBoard'),  { ssr: false })

function OperatorPage() {
  return (
    <div className="p-4 grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <nav className="flex gap-3 text-sm">
          <a href="#workspace">Workspace</a>
          <a href="#hymns">Hymns</a>
          <a href="#bible">Bible</a>
          <a href="#queue">Queue</a>
          <a href="#theme">Theme</a>
        </nav>

        <section id="workspace" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Workspace</h3>
          <Workspace />
        </section>

        <section id="hymns" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Hymns</h3>
          <HymnDisplay />
        </section>

        <section id="bible" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Bible</h3>
          <BibleDisplay />
        </section>
      </div>

      <div className="space-y-4">
        <section id="queue" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Queue</h3>
          <QueuePanel />
        </section>

        <section className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Preview</h3>
          <PreviewBoard />
          <p className="text-xs text-gray-500 mt-2">
            This preview matches the current Theme settings. Use “Send to Live”.
          </p>
        </section>

        <section id="theme" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Theme</h3>
          <ThemeSettings />
        </section>
      </div>
    </div>
  )
}

// Export page itself as client-only too
export default dynamic(() => Promise.resolve(OperatorPage), { ssr: false })
