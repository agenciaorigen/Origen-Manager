import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TABLES, type DB, type TableName, type Tables } from '../types'
import { store } from '../services/db'
import { seedDemo } from '../services/seed'
import { billingMonths, missingPayments } from '../lib/finance'
import { auth } from '../services/auth'

interface Actions {
  add<T extends TableName>(t: T, ...rows: Tables[T][]): Promise<void>
  patch<T extends TableName>(t: T, id: string, p: Partial<Tables[T]>): Promise<void>
  del(t: TableName, ...ids: string[]): Promise<void>
  seed(): Promise<void>
}
interface Value extends Actions { db: DB; loading: boolean; error: string }
const Ctx = createContext<Value>(null as never)

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      let d = await store.loadAll()
      // Primer uso en modo demo: cargar datos de ejemplo.
      if (auth.demo && !localStorage.getItem('origen:seeded')) {
        localStorage.setItem('origen:seeded', '1')
        const s = seedDemo()
        for (const t of TABLES) await store.insert(t, s[t] as never)
        d = await store.loadAll()
      }
      // Cobros recurrentes del mes actual y siguiente (idempotente).
      const fresh = billingMonths().flatMap(m => missingPayments(d, m))
      if (fresh.length) { await store.insert('payments', fresh); d = { ...d, payments: [...d.payments, ...fresh] } }
      setDb(d)
    } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { reload() }, [reload])

  const actions = useMemo<Actions>(() => ({
    async add(t, ...rows) {
      setDb(d => d && ({ ...d, [t]: [...d[t], ...rows] }))
      try { await store.insert(t, rows) } catch (e) { setError((e as Error).message); reload() }
    },
    async patch(t, id, p) {
      setDb(d => d && ({ ...d, [t]: (d[t] as { id: string }[]).map(r => (r.id === id ? { ...r, ...p } : r)) }))
      try { await store.update(t, id, p) } catch (e) { setError((e as Error).message); reload() }
    },
    async del(t, ...ids) {
      try { await store.remove(t, ids) } catch (e) { setError((e as Error).message) }
      await reload() // los borrados en cascada se resuelven recargando
    },
    async seed() {
      const s = seedDemo()
      for (const t of TABLES) await store.insert(t, s[t] as never)
      await reload()
    },
  }), [reload])

  const empty = useMemo(() => ({}) as DB, [])
  return <Ctx.Provider value={{ db: db ?? empty, loading: !db, error, ...actions }}>{children}</Ctx.Provider>
}
export const useData = () => useContext(Ctx)
