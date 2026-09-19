import { supabase } from './supabase'

export interface Session { id: string; email: string }
const DEMO_KEY = 'origen:session'

/** Auth con Supabase; en modo demo, sesión local persistente (cualquier credencial). */
export const auth = {
  demo: !supabase,
  async current(): Promise<Session | null> {
    if (!supabase) { const s = localStorage.getItem(DEMO_KEY); return s ? JSON.parse(s) : null }
    const { data } = await supabase.auth.getSession()
    return data.session ? { id: data.session.user.id, email: data.session.user.email ?? '' } : null
  },
  async signIn(email: string, password: string) {
    if (!supabase) return localStorage.setItem(DEMO_KEY, JSON.stringify({ id: 'demo', email }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  },
  async signUp(email: string, password: string) {
    if (!supabase) return auth.signIn(email, password)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  },
  async signOut() { supabase ? await supabase.auth.signOut() : localStorage.removeItem(DEMO_KEY) },
  onChange(cb: () => void) {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange(cb)
    return () => data.subscription.unsubscribe()
  },
}
