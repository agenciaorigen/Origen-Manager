import type { AgendaEvent, Client, DB, Task } from '../types'
import { monthKey } from '../utils/date'
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
