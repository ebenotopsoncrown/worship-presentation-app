import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue, set } from '../utils/firebase'

type Theme = {
  fontSize: number
  textColor: string
  bgColor: string
  lowerThird: boolean
  align: 'center' | 'left'
}

const DEFAULT: Theme = {
  fontSize: 48,
  textColor: '#ffffff',
  bgColor: '#000000',
  lowerThird: false,
  align: 'center',
}

export default function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>(DEFAULT)

  useEffect(() => {
    const u = onValue(dbRef(db, 'settings/theme'), snap => {
      setTheme({ ...DEFAULT, ...(snap.val() || {}) })
    })
    return () => u()
  }, [])

  const save = (patch: Partial<Theme>) => {
    const next = { ...theme, ...patch }
    setTheme(next)
    set(dbRef(db, 'settings/theme'), next)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Theme & Background</h2>

      <label className="block">Font size: {theme.fontSize}px
        <input type="range" min={24} max={96} value={theme.fontSize}
               onChange={e=>save({ fontSize: Number(e.target.value) })} className="w-full" />
      </label>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          Text color <input type="color" value={theme.textColor} onChange={e=>save({ textColor: e.target.value })}/>
        </label>
        <label className="flex items-center gap-2">
          Background <input type="color" value={theme.bgColor} onChange={e=>save({ bgColor: e.target.value })}/>
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={theme.lowerThird} onChange={e=>save({ lowerThird: e.target.checked })}/>
        Lower-third mode (text at bottom)
      </label>

      <label className="block">
        Align:
        <select className="ml-2 border px-2 py-1" value={theme.align} onChange={e=>save({ align: e.target.value as any })}>
          <option value="center">Center</option>
          <option value="left">Left</option>
        </select>
      </label>
    </div>
  )
}

// inside ThemeSettings component UI
<div className="mt-4 border-t pt-3">
  <div className="font-semibold mb-2">Presentation</div>
  <div className="flex items-center gap-2 mb-2">
    <label className="w-40">Verses per slide</label>
    <input className="border px-2 py-1 w-20 rounded" type="number" min={1}
           value={presentation.versesPerSlide ?? 2}
           onChange={e=>setPresentation((p:any)=>({ ...p, versesPerSlide:Number(e.target.value||1) }))}/>
  </div>
  <div className="flex items-center gap-2">
    <label className="w-40">Hymn lines per slide</label>
    <input className="border px-2 py-1 w-20 rounded" type="number" min={1}
           value={presentation.hymnLinesPerSlide ?? 2}
           onChange={e=>setPresentation((p:any)=>({ ...p, hymnLinesPerSlide:Number(e.target.value||1) }))}/>
  </div>
  <button onClick={()=>set(dbRef(db,'settings/presentation'), presentation)}
          className="mt-2 px-3 py-1 border rounded">Save Presentation Settings</button>
</div>

const [presentation, setPresentation] = useState<any>({ versesPerSlide:2, hymnLinesPerSlide:2 })
useEffect(()=> onValue(dbRef(db,'settings/presentation'), s => setPresentation({ ...{versesPerSlide:2,hymnLinesPerSlide:2 }, ...(s.val()||{}) })),[])

