import { useState } from 'react'
import { useRouter } from 'next/router'
import { auth } from '../utils/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f6f7fb'}}>
      <form onSubmit={register} style={{background:'#fff',padding:24,borderRadius:12,width:360,boxShadow:'0 8px 30px rgba(0,0,0,.08)'}}>
        <h1 style={{fontSize:22,marginBottom:16}}>Create Operator</h1>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:'100%',padding:10,marginBottom:10,border:'1px solid #ddd',borderRadius:8}} required/>
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:'100%',padding:10,marginBottom:10,border:'1px solid #ddd',borderRadius:8}} required/>
        {error && <div style={{color:'#c00',marginBottom:10}}>{error}</div>}
        <button disabled={loading} type="submit" style={{width:'100%',padding:10,background:'#2563eb',color:'#fff',border:0,borderRadius:8}}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
