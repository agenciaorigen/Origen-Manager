import { useState } from 'react'
import { Button } from '../components/ui'
import { signIn, signUp } from '../hooks/useAuth'
import { auth } from '../services/auth'

const input = 'w-full rounded-xl border border-line bg-card px-3 py-3 text-sm outline-none focus:border-accent'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await (mode === 'in' ? signIn : signUp)(email, pass) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="rise w-full max-w-sm space-y-4">
        <div className="mb-8 text-center"><div className="text-2xl font-semibold tracking-[0.35em]">ORIGEN</div><div className="mt-1 text-[10px] tracking-[0.3em] text-mute">MANAGER</div></div>
        <label className="block"><span className="mb-1 block text-xs font-medium text-mute">Email</span><input className={input} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-mute">Contraseña</span><input className={input} type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pass} onChange={e => setPass(e.target.value)} /></label>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <Button variant="primary" type="submit" disabled={busy} className="w-full">{mode === 'in' ? 'Ingresar' : 'Crear cuenta'}</Button>
        <button type="button" className="block w-full text-center text-xs text-mute hover:text-accent" onClick={() => setMode(m => (m === 'in' ? 'up' : 'in'))}>{mode === 'in' ? 'Crear una cuenta' : 'Ya tengo cuenta'}</button>
        {auth.demo && <p className="text-center text-xs text-mute">Modo demo: ingresá con cualquier email y contraseña (mín. 6 caracteres).</p>}
      </form>
    </div>
  )
}
