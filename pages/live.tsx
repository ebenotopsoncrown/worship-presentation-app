// pages/live.tsx
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import { db, dbRef, onValue } from '../utils/firebase'

type Theme = {
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  lowerThird?: boolean
  bg?: string
  outline?: boolean
  shadow?: boolean
}

function LiveScreen() {
  const [lines, setLines] = useState<string[]>([])
  const [mode, setMode] = useState<'content' | 'black' | 'clear' | 'timer'>('content')
  const [theme, setTheme] = useState<Theme>({})

  useEffect(() => {
    const u1 = onValue(dbRef(db, 'live_content'), s => {
      const arr = (s.val() as string[]) || []
      setLines(Array.isArray(arr) ? arr : [])
    })
    const u2 = onValue(dbRef(db, 'live_mode'), s => setMode((s.val() as any) ?? 'content'))
    const u3 = onValue(dbRef(db, 'theme'), s => setTheme((s.val() as Theme) || {}))
    return () => { u1(); u2(); u3() }
  }, [])

  if (mode === 'black') return <div style={{ background:'#000', width:'100vw', height:'100vh' }} />
  if (mode === 'clear') return <div style={{ background:'transparent', width:'100vw', height:'100vh' }} />

  const container: React.CSSProperties = {
    background: theme.bg || 'radial-gradient(1200px 600px at 50% -20%, #1f2937 0%, #0b1324 60%, #000 100%)',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: theme.lowerThird ? 'flex-end' : 'center',
    justifyContent: 'center',
    padding: theme.lowerThird ? '6vh 6vw' : 0,
  }
  const textStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily || 'Georgia, serif',
    color: theme.color || '#fff',
    textAlign: theme.align || 'center',
    fontSize: `${theme.fontSize ?? 64}px`,
    lineHeight: 1.25,
    textShadow: theme.shadow ? '0 4px 24px rgba(0,0,0,.65)' : undefined,
    WebkitTextStroke: theme.outline ? '1px #000' : undefined,
  }

  return (
    <div style={container}>
      <div style={{ maxWidth: '95vw' }}>
        {lines.map((html, i) => (
          <div key={i} style={textStyle} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(LiveScreen), { ssr: false })
