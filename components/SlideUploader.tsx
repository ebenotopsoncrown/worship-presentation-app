import { useState } from 'react'
import { db, ref as dbRef, set, get } from '../utils/firebase'

export default function SlideUploader() {
  const [slides, setSlides] = useState<{url:string,name:string}[]>([])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const urls = files.map((file: any) => ({ url: URL.createObjectURL(file), name: file.name || 'Slide'}))
    setSlides((prev) => [...prev, ...urls])
  }

  const showSlide = async (s: {url:string,name:string}) => {
    await set(dbRef(db, 'live_content'), [
      `<img src="${s.url}" style="max-width:100%;max-height:100vh;object-fit:contain;" />`
    ])
    await set(dbRef(db, 'live_state'), { mode: 'content' })
  }

  const addToQueue = async (s: {url:string,name:string}) => {
    const qref = dbRef(db, 'queue')
    const snap = await get(qref)
    const list = (snap.val() || []) as any[]
    list.push({
      id: `${Date.now()}-slide`,
      kind: 'slide',
      title: s.name,
      content: [`<img src="${s.url}" style="max-width:100%;max-height:100vh;object-fit:contain;" />`]
    })
    await set(qref, list)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Slide Uploader</h2>
      <input type="file" accept="image/*" multiple onChange={handleUpload} className="mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {slides.map((s, idx) => (
          <div key={idx} className="border p-2 rounded shadow">
            <img src={s.url} className="w-full h-32 object-cover mb-2" />
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-1 rounded" onClick={() => showSlide(s)}>Show</button>
              <button className="flex-1 border py-1 rounded" onClick={() => addToQueue(s)}>Queue</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
