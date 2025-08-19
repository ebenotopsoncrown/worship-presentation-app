import { useEffect, useState } from 'react'
import { auth, onAuthStateChanged } from '../utils/firebase'
import { db, ref as dbRef, onValue, set } from '../utils/firebase'

type Item = { id:string; title:string; content:string[]; kind:string }

export default function Remote() {
  const [user, setUser] = useState<any>(null)
  const [queue, setQueue] = useState<Item[]>([])
  const [current, setCurrent] = useState<number>(-1)

  useEffect(() => {
    const u = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return () => u()
  }, [])

  useEffect(() => {
    const u1 = onValue(dbRef(db, 'queue'), snap => setQueue(snap.val() || []))
    const u2 = onValue(dbRef(db, 'queue_current'), snap => setCurrent(snap.val() ?? -1))
    return () => { u1(); u2() }
  }, [])

  if (!user) return (
    <div style={{padding:24}}>
      <h3>Sign in required</h3>
      <a href="/login" style={{color:'#2563eb',textDecoration:'underline'}}>Go to Login</a>
    </div>
  )

  const goLive = async (idx:number) => {
    const item = queue[idx]; if (!item) return
    await set(dbRef(db, 'live_content'), item.content)
    await set(dbRef(db, 'live_state'), { mode: 'content' })
    await set(dbRef(db, 'queue_current'), idx)
  }
  const next = () => goLive(current + 1)
  const prev = () => goLive(current - 1)
  const black = () => set(dbRef(db, 'live_state'), { mode: 'black' })
  const clear = () => set(dbRef(db, 'live_state'), { mode: 'clear' })

  return (
    <div style={{padding:16}}>
      <h2 style={{marginBottom:12}}>Remote</h2>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={prev} style={{padding:12,flex:1}}>◀ Prev</button>
        <button onClick={next} style={{padding:12,flex:1}}>Next ▶</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button onClick={black} style={{padding:12,flex:1,background:'#000',color:'#fff'}}>Black</button>
        <button onClick={clear} style={{padding:12,flex:1}}>Clear</button>
      </div>
      <div>
        {queue.map((q, i) => (
          <button key={q.id}
                  onClick={() => goLive(i)}
                  style={{
                    display:'block', width:'100%', textAlign:'left',
                    padding:10, marginBottom:8,
                    border:'1px solid #ddd', borderRadius:8,
                    background: i===current ? '#e0e7ff' : '#fff'
                  }}>
            <div style={{fontSize:12, textTransform:'uppercase', color:'#6b7280'}}>{q.kind}</div>
            <div style={{fontWeight:600}}>{q.title}</div>
          </button>
        ))}
        {queue.length === 0 && <div style={{color:'#6b7280'}}>Queue is empty.</div>}
      </div>
    </div>
  )
}
