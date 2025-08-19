import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  auth, signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../utils/firebase'
import { db, ref as dbRef, set } from '../utils/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      await set(dbRef(db, `operators/${user.uid}`), true) // optional auto-add
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMsg('')
    setError('')
    try {
      await sendPasswordResetEmail(auth, (resetEmail || email).trim())
      setResetMsg('If an account exists for that email, a reset link has been sent.')
    } catch {
      // Avoid leaking whether the email exists
      setResetMsg('If an account exists for that email, a reset link has been sent.')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f6f7fb'}}>
      <form onSubmit={login} style={{background:'#fff',padding:24,borderRadius:12,width:360,boxShadow:'0 8px 30px rgba(0,0,0,.08)'}}>
        <h1 style={{fontSize:22,marginBottom:16}}>Operator Login</h1>
        <input type="email" placeholder="Email" value={email}
               onChange={e=>setEmail(e.target.value)}
               style={{width:'100%',padding:10,marginBottom:10,border:'1px solid #ddd',borderRadius:8}} required />
        <input type="password" placeholder="Password" value={password}
               onChange={e=>setPassword(e.target.value)}
               style={{width:'100%',padding:10,marginBottom:10,border:'1px solid #ddd',borderRadius:8}} required />
        {error && <div style={{color:'#c00',marginBottom:10}}>{error}</div>}
        <button disabled={loading} type="submit"
                style={{width:'100%',padding:10,background:'#2563eb',color:'#fff',border:0,borderRadius:8}}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{marginTop:12,textAlign:'center'}}>
          <button type="button" onClick={()=>setShowReset(!showReset)}
                  style={{background:'none',border:0,color:'#2563eb',textDecoration:'underline',cursor:'pointer'}}>
            Forgot password?
          </button>
        </div>

        {showReset && (
          <form onSubmit={sendReset} style={{marginTop:12}}>
            <input type="email" placeholder="Email for reset (or use above)"
                   value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                   style={{width:'100%',padding:10,marginBottom:8,border:'1px solid #ddd',borderRadius:8}} />
            <button type="submit"
                    style={{width:'100%',padding:8,background:'#111827',color:'#fff',border:0,borderRadius:8}}>
              Send reset link
            </button>
            {resetMsg && <div style={{color:'#065f46',marginTop:8}}>{resetMsg}</div>}
          </form>
        )}
      </form>
    </div>
  )
}
