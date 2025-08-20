import Head from 'next/head'
import { useEffect, useState } from 'react'
import { auth, onAuthStateChanged, signOut } from '../utils/firebase'
import HymnDisplay from '../components/HymnDisplay'
import BibleDisplay from '../components/BibleDisplay'
import SlideUploader from '../components/SlideUploader'
import QueuePanel from '../components/QueuePanel'
import ThemeSettings from '../components/ThemeSettings'
import Workspace from '../components/Workspace'
import PreviewPane from '../components/PreviewPBoard'
import dynamic from 'next/dynamic'

// Ensure client for layout interactions
const Page = () => {
  const [tab, setTab] = useState<'workspace'|'hymns'|'mfm'|'bible'|'slides'|'queue'|'theme'>('workspace')
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [err, setErr] = useState('')
  const [previewHtml, setPreviewHtml] = useState('<p>Preview appears here…</p>')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u ?? null); setChecking(false) })
    return () => unsub()
  }, [])

  const handleSignOut = async () => { try { await signOut(auth) } catch(e:any){ setErr(e.message||'Sign out failed') } }

  if (checking) return null
  if (!user) return (
    <div style={{padding:24}}>
      <h2>You must be signed in to control the projector.</h2>
      <a href="/login" style={{color:'#2563eb',textDecoration:'underline'}}>Go to Login</a>
    </div>
  )

  return (
    <>
      <Head><title>Worship Control Panel</title></Head>
      <div className="min-h-screen bg-gray-100 p-4">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <button onClick={() => setTab('workspace')} className={`px-3 py-2 rounded ${tab==='workspace'?'bg-blue-600 text-white':'bg-white border'}`}>Workspace</button>
          <button onClick={() => setTab('hymns')}     className={`px-3 py-2 rounded ${tab==='hymns'    ?'bg-blue-600 text-white':'bg-white border'}`}>Hymns</button>
          <button onClick={() => setTab('mfm')}       className={`px-3 py-2 rounded ${tab==='mfm'      ?'bg-blue-600 text-white':'bg-white border'}`}>MFM Hymns</button>
          <button onClick={() => setTab('bible')}     className={`px-3 py-2 rounded ${tab==='bible'    ?'bg-blue-600 text-white':'bg-white border'}`}>Bible</button>
          <button onClick={() => setTab('slides')}    className={`px-3 py-2 rounded ${tab==='slides'   ?'bg-blue-600 text-white':'bg-white border'}`}>Slides</button>
          <button onClick={() => setTab('queue')}     className={`px-3 py-2 rounded ${tab==='queue'    ?'bg-blue-600 text-white':'bg-white border'}`}>Queue</button>
          <button onClick={() => setTab('theme')}     className={`px-3 py-2 rounded ${tab==='theme'    ?'bg-blue-600 text-white':'bg-white border'}`}>Theme</button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={handleSignOut} className="px-3 py-1 bg-gray-800 text-white rounded">Sign out</button>
          </div>
        </div>

        {err && <p className="text-red-600 mb-2">{err}</p>}

        {/* Two-pane layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow p-3">
            {tab === 'workspace' && <Workspace onPreview={setPreviewHtml} />}
            {tab === 'hymns' && <HymnDisplay />}
            {tab === 'mfm' && dynamic(() => import('../components/MfmHymns')).default ? <></> : null /* TS hush */}
            {tab === 'bible' && <BibleDisplay />}
            {tab === 'slides' && <SlideUploader />}
            {tab === 'queue' && <QueuePanel />}
            {tab === 'theme' && <ThemeSettings />}
          </div>

          <div className="bg-white rounded shadow p-3">
            <h3 className="font-semibold mb-2">Preview</h3>
            <PreviewPane html={previewBoard />
            <p className="text-xs text-gray-500 mt-2">
              This preview matches the current Theme settings; use “Send to Live” from Workspace or other tabs.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
