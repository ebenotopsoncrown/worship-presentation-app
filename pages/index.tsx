// pages/index.tsx
import dynamic from 'next/dynamic'
import React from 'react'

const Workspace     = dynamic(() => import('../components/Workspace'),     { ssr: false })
const HymnDisplay   = dynamic(() => import('../components/HymnDisplay'),   { ssr: false })
const BibleDisplay  = dynamic(() => import('../components/BibleDisplay'),  { ssr: false })
const QueuePanel    = dynamic(() => import('../components/PreviewBoard'),  { ssr: false })

function OperatorPage() {
  return (
    <div className="p-4">
      <nav className="flex gap-4 mb-3 text-sm">
        <a href="#ws">Workspace</a>
        <a href="#previews">Preview</a>
        <a href="#live">Live</a>
        <a href="#hymns">Hymns</a>
        <a href="#bible">Bible</a>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Workspace */}
        <section id="ws" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Workspace</h3>
          <Workspace />
        </section>

        {/* Middle: 2x2 Previews */}
        <section id="previews" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Preview</h3>
          <QueuePanel />
        </section>

        {/* Right: Live monitor */}
        <section id="live" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Live</h3>
          <iframe
            src="/live?embed=1"
            className="w-full rounded border"
            style={{ height: 520 }}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <section id="hymns" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Hymns</h3>
          <HymnDisplay />
        </section>
        <section id="bible" className="bg-white rounded shadow p-3">
          <h3 className="font-semibold mb-2">Bible</h3>
          <BibleDisplay />
        </section>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(OperatorPage), { ssr: false })
