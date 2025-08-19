import Head from 'next/head'
import { useEffect, useState } from 'react'
import { auth, onAuthStateChanged, signOut } from '../utils/firebase'
import HymnDisplay from '../components/HymnDisplay'
import BibleDisplay from '../components/BibleDisplay'
import SlideUploader from '../components/SlideUploader'
import QueuePanel from '../components/QueuePanel'
import ThemeSettings from '../components/ThemeSettings'

export default function Home() {
  const [view, setView] = useState<'hymns' | 'bible' | 'slides' | 'queue' | 'theme'>('hymns')
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u ?? null); setChecking(false) })
    return () => unsub()
  }, [])

  const handleSignOut = async () => {
    setErr('')
    try { await signOut(auth) } catch (e: any) { setErr(e?.message || 'Sign out failed') }
  }

  if (checking) return null
  if (!user) {
    return (
      <div style={{padding:24}}>
        <h2>You must be signed in to control the projector.</h2>
        <a href="/login" style={{color:'#2563eb',textDecoration:'underline'}}>Go to Login</a>
      </div>
    )
  }

  return (
    <>
      <Head><title>Worship Control Panel</title></Head>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <button onClick={() => setView('hymns')} className="px-4 py-2 bg-blue-600 text-white rounded">Hymns</button>
          <button onClick={() => setView('bible')} className="px-4 py-2 bg-green-600 text-white rounded">Bible</button>
          <button onClick={() => setView('slides')} className="px-4 py-2 bg-purple-600 text-white rounded">Slides</button>
          <button onClick={() => setView('queue')} className="px-4 py-2 bg-indigo-600 text-white rounded">Queue</button>
          <button onClick={() => setView('theme')} className="px-4 py-2 bg-teal-600 text-white rounded">Theme</button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={handleSignOut} className="px-3 py-1 bg-gray-800 text-white rounded">Sign out</button>
          </div>
        </div>

        {err && <p className="text-red-600 mb-2">{err}</p>}

        {view === 'hymns' && <HymnDisplay />}
        {view === 'bible' && <BibleDisplay />}
        {view === 'slides' && <SlideUploader />}
        {view === 'queue' && <QueuePanel />}
        {view === 'theme' && <ThemeSettings />}
      </div>
    </>
  )
}
