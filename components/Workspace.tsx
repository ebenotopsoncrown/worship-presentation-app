// components/Workspace.tsx
import React, { useRef, useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'

const fonts = ['Georgia, serif','Times New Roman, serif','Arial, sans-serif','Verdana, sans-serif','Tahoma, sans-serif','Trebuchet MS, sans-serif','Courier New, monospace']

export default function Workspace() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState('Untitled Slide')
  const [slot, setSlot] = useState(0) // 0..3

  const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value)

  const insertShape = () => {
    const html = `<span style="display:inline-block;width:80px;height:36px;background:#0ea5e9;border:2px solid #0c4a6e;border-radius:6px;"></span>&nbsp;`
    insertHtmlAtCursor(html)
  }

  const insertLine = () => exec('insertHorizontalRule')

  const insertHtmlAtCursor = (html: string) => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const div = document.createElement('div')
    div.innerHTML = html
    const frag = document.createDocumentFragment()
    let node: ChildNode | null
    while ((node = div.firstChild)) frag.appendChild(node)
    range.insertNode(frag)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const htmlToLines = (html: string): string[] => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const blocks = Array.from(doc.body.children)
    // Keep each block as HTML so Live can render it (fixes <p> showing)
    const lines = blocks.map(el => el.outerHTML)
    return lines.filter(Boolean)
  }

  const sendToPreview = async () => {
    const html = editorRef.current?.innerHTML || ''
    const lines = htmlToLines(html)
    await set(dbRef(db, `preview_board/${slot}`), lines)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input value={title} onChange={e => setTitle(e.target.value)} className="border rounded px-2 py-1 w-48" />
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Send to</label>
          <select value={slot} onChange={e => setSlot(parseInt(e.target.value,10))} className="border rounded px-2 py-1">
            <option value={0}>Preview 1</option>
            <option value={1}>Preview 2</option>
            <option value={2}>Preview 3</option>
            <option value={3}>Preview 4</option>
          </select>
          <button onClick={sendToPreview} className="px-3 py-1 rounded bg-sky-600 text-white">Send to Preview</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border rounded px-2 py-1 bg-gray-50">
        <button onClick={() => exec('bold')} className="px-2 py-1 border rounded">B</button>
        <button onClick={() => exec('italic')} className="px-2 py-1 border rounded italic">I</button>
        <button onClick={() => exec('underline')} className="px-2 py-1 border rounded underline">U</button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button onClick={() => exec('justifyLeft')} className="px-2 py-1 border rounded">L</button>
        <button onClick={() => exec('justifyCenter')} className="px-2 py-1 border rounded">C</button>
        <button onClick={() => exec('justifyRight')} className="px-2 py-1 border rounded">R</button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button onClick={() => exec('insertUnorderedList')} className="px-2 py-1 border rounded">• List</button>
        <button onClick={() => exec('insertOrderedList')} className="px-2 py-1 border rounded">1. List</button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <select onChange={e => exec('fontName', e.target.value)} className="border rounded px-2 py-1">
          {fonts.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
        </select>
        <select onChange={e => exec('fontSize', e.target.value)} className="border rounded px-2 py-1">
          {[3,4,5,6,7].map(s => <option key={s} value={String(s)}>{['','', '','', ''][0]}{s}</option>)}
        </select>
        <label className="text-xs">Color <input type="color" onChange={e => exec('foreColor', e.target.value)} /></label>
        <label className="text-xs">Fill <input type="color" onChange={e => exec('hiliteColor', e.target.value)} /></label>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button onClick={insertLine} className="px-2 py-1 border rounded">Insert line</button>
        <button onClick={insertShape} className="px-2 py-1 border rounded">Insert shape</button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[280px] p-3 border rounded bg-white focus:outline-none"
        style={{ fontFamily: fonts[0], fontSize: 24 }}
      >
        <p>Good Morning Church</p>
      </div>
    </div>
  )
}
