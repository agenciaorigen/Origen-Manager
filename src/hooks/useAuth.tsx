import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, type Session } from '../services/auth'

const Ctx = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<{ session: Session | null; ready: boolean }>({ session: null, ready: false })
  useEffect(() => {
    const load = () => auth.current().then(session => set({ session, ready: true }))
    load()
    return auth.onChange(load)
  }, [])
  // signIn/signOut en modo demo no emiten evento: refrescar manualmente vía evento propio
  useEffect(() => {
    const h = () => auth.current().then(session => set({ session, ready: true }))
    window.addEventListener('origen:auth', h)
    return () => window.removeEventListener('origen:auth', h)
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)

const notify = () => window.dispatchEvent(new Event('origen:auth'))
export const signIn = async (e: string, p: string) => { await auth.signIn(e, p); notify() }
export const signUp = async (e: string, p: string) => { await auth.signUp(e, p); notify() }
export const signOut = async () => { await auth.signOut(); notify() }
