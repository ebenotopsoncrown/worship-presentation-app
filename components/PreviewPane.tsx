'use client'
import { useEffect, useState } from 'react'
import type { Slot } from '../utils/firebase';

type Theme = {
  fontSize: number
  textColor: string
  bgColor: string
  lowerThird: boolean
  align: 'center' | 'left'
}

export default function PreviewPanel({ slot, title }: { slot: Slot; title: string }) {
  // ...
}
export default function PreviewPane({ html }: { html: string }) {
  const [theme, setTheme] = useState<Theme>({
    fontSize: 48, textColor: '#ffffff', bgColor: '#000000', lowerThird:false, align:'center'
  })
  useEffect(() => {
    const u = onValue(dbRef(db, 'settings/theme'), s => {
      const t = s.val() || {}
      setTheme(prev => ({ ...prev, ...t }))
    })
    return () => u()
  }, [])

  const vAlign = theme.lowerThird ? 'justify-end' : 'justify-center'
  const paddingBottom = theme.lowerThird ? 'pb-8' : ''

  return (
    <div style={{ background: theme.bgColor, color: theme.textColor }}
         className={`rounded border h-full min-h-[420px] w-full overflow-auto flex ${vAlign} items-center ${paddingBottom}`}>
      <div className="w-full px-8" style={{ fontSize: theme.fontSize, textAlign: theme.align }}>
        {/* If HTML-ish, render as HTML; otherwise show as text */}
        { /<\w+/i.test(html || '') ? (
          <div dangerouslySetInnerHTML={{ __html: html || '' }} />
        ) : (
          <p>{html}</p>
        )}
      </div>
    </div>
  )
}
