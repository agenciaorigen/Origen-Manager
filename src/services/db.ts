import { TABLES, type DB, type TableName, type Tables } from '../types'
import { supabase } from './supabase'

/** Contrato único de persistencia. Cambiar de backend = implementar esto. */
export interface Store {
  loadAll(): Promise<DB>
  insert<T extends TableName>(t: T, rows: Tables[T][]): Promise<void>
  update<T extends TableName>(t: T, id: string, patch: Partial<Tables[T]>): Promise<void>
  remove(t: TableName, ids: string[]): Promise<void>
}

const empty = (): DB => Object.fromEntries(TABLES.map(t => [t, []])) as unknown as DB

const KEY = 'origen:db'
const local: Store = {
  async loadAll() {
    try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return empty() }
  },
  async insert(t, rows) { const d = await this.loadAll(); (d[t] as unknown[]).push(...rows); save(d) },
  async update(t, id, patch) { const d = await this.loadAll(); d[t] = (d[t] as { id: string }[]).map(r => (r.id === id ? { ...r, ...patch } : r)) as never; save(d) },
  async remove(t, ids) {
    const d = await this.loadAll(); d[t] = (d[t] as { id: string }[]).filter(r => !ids.includes(r.id)) as never
    // Emula ON DELETE CASCADE de Postgres
    if (t === 'clients') for (const k of ['services', 'payments', 'tasks', 'events', 'contents', 'notes'] as const)
      d[k] = (d[k] as { client_id: string | null }[]).filter(r => !r.client_id || !ids.includes(r.client_id)) as never
    if (t === 'workflows') d.workflow_steps = d.workflow_steps.filter(s => !ids.includes(s.workflow_id))
    save(d)
  },
}
const save = (d: DB) => localStorage.setItem(KEY, JSON.stringify(d))

const check = (error: { message: string } | null) => { if (error) throw new Error(error.message) }
const remote: Store = {
  async loadAll() {
    const res = await Promise.all(TABLES.map(t => supabase!.from(t).select('*')))
    const d = empty()
    res.forEach((r, i) => { check(r.error); (d as Record<string, unknown>)[TABLES[i]] = r.data })
    return d
  },
  async insert(t, rows) { check((await supabase!.from(t).insert(rows)).error) },
  async update(t, id, patch) { check((await supabase!.from(t).update(patch as never).eq('id', id)).error) },
  async remove(t, ids) { check((await supabase!.from(t).delete().in('id', ids)).error) },
}

export const store: Store = supabase ? remote : local
