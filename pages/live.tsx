// pages/live.tsx
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue } from '../utils/firebase'

type Theme = {
  fontSize: number
  textColor: string
  bgColor: string
  lowerThird: boolean
  align: 'center' | 'left'
  fontFamily?: string
  shadow?: boolean
}

function LiveScreen() {
  const [content, setContent] = useState<string[]>([])
  const [mode, setMode] = useState<'content'|'black'|'clear'|'timer'>('content')
  const [cursor, setCursor] = useState(0)
  const [groupSize, setGroupSize] = useState(1)
  const [timer, setTimer] = useState<{ endAt:number, title?:string } | null>(null)
  const [now, setNow] = useState(Date.now())
  const [theme, setTheme] = useState<Theme>({
    fontSize: 64, textColor:'#fff', bgColor:'#000', lowerThird:false, align:'center', fontFamily:'system-ui', shadow:true
  })

  useEffect(() => {
    const u1 = onValue(dbRef(db,'live_content'), s => setContent(s.val() || []))
    const u2 = onValue(dbRef(db,'live_state'), s => setMode((s.val()?.mode) || 'content'))
    const u3 = onValue(dbRef(db,'settings/theme'), s => setTheme(prev => ({ ...prev, ...(s.val() || {}) })))
    const u4 = onValue(dbRef(db,'live_cursor'), s => setCursor(Number(s.val() || 0)))
    const u5 = onValue(dbRef(db,'live_group_size'), s => setGroupSize(Math.max(1, Number(s.val() || 1))))
    const u6 = onValue(dbRef(db,'timer'), s => setTimer(s.val() || null))
    const t = setInterval(()=>setNow(Date.now()), 250)
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); clearInterval(t) }
  }, [])

  if (mode === 'black') return <div style={{ background:'#000' }} className="h-screen w-screen" />
  if (mode === 'clear') return <div style={{ background: theme.bgColor }} className="h-screen w-screen" />

  const style: React.CSSProperties = {
    background: theme.bgColor, color: theme.textColor, fontSize: theme.fontSize,
    textAlign: theme.align, fontFamily: theme.fontFamily as any,
    textShadow: theme.shadow ? '0 0 6px rgba(0,0,0,.85), 0 0 12px rgba(0,0,0,.6)' : undefined
  }
  const v = theme.lowerThird ? 'justify-end' : 'justify-center'
  const bottomPad = theme.lowerThird ? 'pb-16' : ''

  if (mode === 'timer' && timer?.endAt) {
    const remain = Math.max(0, Math.floor((timer.endAt - now)/1000))
    const mm = String(Math.floor(remain/60)).padStart(2,'0')
    const ss = String(remain%60).padStart(2,'0')
    return (
      <div style={style} className={`h-screen w-screen flex ${v} items-center ${bottomPad}`}>
        <div className="w-full text-center">
          {timer.title && <div className="mb-4" style={{ fontSize: theme.fontSize*.5 }}>{timer.title}</div>}
          <div style={{ fontSize: theme.fontSize*1.5 }}>{mm}:{ss}</div>
        </div>
      </div>
    )
  }

  const start = cursor
  const end = Math.min(content.length, start + groupSize)
  const slice = content.slice(start, end)

  return (
    <div style={style} className={`h-screen w-screen flex ${v} items-center ${bottomPad}`}>
      <div className="w-full px-10">
        {slice.map((line,i) =>
          /<\w+/i.test(line || '')
            ? <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
            : <p key={i} className="mb-6">{line}</p>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(LiveScreen), { ssr: false })