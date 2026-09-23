import type { AgendaEvent, Client, DB, Task } from '../types'
import { addDays, monthKey, parseISO, today } from '../utils/date'
import { MONTHLY_NAME } from './workflow'
import { sortTasks } from './tasks'

export type CycleState = 'sin-agendar' | 'en-curso' | 'cumplido'
export interface Cycle { client: Client; event: AgendaEvent | null; tasks: Task[]; done: number; next: Task | null; state: CycleState }

/** Plantilla del ciclo mensual (por nombre; si no existe, cualquiera de "Sesión de fotos"). */
export const monthlyWorkflowId = (db: Pick<DB, 'workflows'>) =>
  (db.workflows.find(w => w.name === MONTHLY_NAME) ?? db.workflows.find(w => w.job_type === 'Sesión de fotos'))?.id ?? null

/** Un ciclo por cliente activo: su sesión del mes con las tareas que generó. */
export function monthlyCycles(db: DB, key: string): Cycle[] {
  const wf = monthlyWorkflowId(db)
  const order: Record<CycleState, number> = { 'sin-agendar': 0, 'en-curso': 1, cumplido: 2 }
  return db.clients.filter(c => c.status === 'activo').map(client => {
    const event = (wf && db.events.filter(e => e.client_id === client.id && e.workflow_id === wf && monthKey(e.date) === key)
      .sort((a, b) => a.date.localeCompare(b.date))[0]) || null
    const tasks = event ? db.tasks.filter(t => t.event_id === event.id).sort(sortTasks) : []
    const next = tasks.find(t => t.status === 'pendiente') ?? null
    const state: CycleState = !event ? 'sin-agendar' : tasks.length && !next && event.status === 'completada' ? 'cumplido' : 'en-curso'
    return { client, event, tasks, done: tasks.length - tasks.filter(t => t.status === 'pendiente').length, next, state }
  }).sort((a, b) => order[a.state] - order[b.state] || a.client.name.localeCompare(b.client.name))
}

export interface Proposal { client: Client; date: string; time: string }

/** Fecha del n-ésimo día de semana del mes (weekday 1=lunes … 6=sábado). */
export function nthWeekday(key: string, week: number, weekday: number) {
  let d = `${key}-01`
  while (parseISO(d).getDay() !== weekday % 7) d = addDays(d, 1)
  return addDays(d, (week - 1) * 7)
}

/** Propone la sesión de cada cliente sin agendar: su día preferido o el próximo día libre (sin domingos ni días ya ocupados). */
export function proposeAgenda(db: DB, key: string, now = today()): Proposal[] {
  const used = new Set(db.events.filter(e => monthKey(e.date) === key && e.status !== 'completada').map(e => e.date))
  const start = `${key}-01` > now ? `${key}-01` : addDays(now, 1)
  const free = () => { let d = start; while (used.has(d) || parseISO(d).getDay() === 0) d = addDays(d, 1); return d }
  return monthlyCycles(db, key).filter(c => c.state === 'sin-agendar').map(({ client: c }) => {
    const pref = c.session_week && c.session_weekday ? nthWeekday(key, c.session_week, c.session_weekday) : ''
    const date = pref && pref >= start ? pref : free()
    used.add(date)
    return { client: c, date, time: c.session_time || '10:00' }
  })
}
