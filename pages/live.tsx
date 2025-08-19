import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue } from '../utils/firebase'

type Theme = {
  fontSize: number
  textColor: string
  bgColor: string
  lowerThird: boolean
  align: 'center' | 'left'
}

export default function LiveScreen() {
  const [content, setContent] = useState<string[]>([])
  const [mode, setMode] = useState<'content'|'black'|'clear'>('content')
  const [theme, setTheme] = useState<Theme>({
    fontSize: 48, textColor: '#ffffff', bgColor: '#000000', lowerThird: false, align: 'center'
  })

  useEffect(() => {
    const u1 = onValue(dbRef(db, 'live_content'), snap => setContent(snap.val() || []))
    const u2 = onValue(dbRef(db, 'live_state'), snap => setMode((snap.val()?.mode) || 'content'))
    const u3 = onValue(dbRef(db, 'settings/theme'), snap => {
      const t = snap.val() || {}
      setTheme((prev) => ({ ...prev, ...t }))
    })
    return () => { u1(); u2(); u3() }
  }, [])

  // modes
  if (mode === 'black') return <div style={{ background: '#000' }} className="h-screen w-screen" />
  if (mode === 'clear') return <div style={{ background: theme.bgColor }} className="h-screen w-screen" />

  const containerStyle: React.CSSProperties = {
    background: theme.bgColor,
    color: theme.textColor,
    fontSize: theme.fontSize,
    textAlign: theme.align as any,
  }

  // lower third positioning
  const vAlign = theme.lowerThird ? 'justify-end' : 'justify-center'
  const paddingBottom = theme.lowerThird ? 'pb-16' : ''

  return (
    <div style={containerStyle} className={`h-screen w-screen flex ${vAlign} items-center ${paddingBottom} text-center`}>
      <div className="w-full px-10">
        {content.map((line, i) =>
          typeof line === 'string' && line.startsWith('<img')
            ? <div key={i} dangerouslySetInnerHTML={{ __html: line }} className="w-full h-full flex justify-center items-center" />
            : <p key={i} className="mb-4">{line}</p>
        )}
      </div>
    </div>
  )
}
