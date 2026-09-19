import type { AgendaEvent, Client, Content, DB, Payment, Service, Task, Workflow, WorkflowStep } from '../types'
import { DEFAULT_WORKFLOWS, tasksFromWorkflow } from '../lib/workflow'
import { addDays, dayOfMonth, monthKey, today } from '../utils/date'
import { uid } from '../utils/format'

/** Plantillas de workflow por defecto (sin datos de clientes). */
export function seedWorkflows(): Pick<DB, 'workflows' | 'workflow_steps'> {
  const workflows: Workflow[] = [], workflow_steps: WorkflowStep[] = []
  for (const w of DEFAULT_WORKFLOWS) {
    const id = uid()
    workflows.push({ id, name: w.name, job_type: w.job_type })
    w.steps.forEach(([name, offset_days, duration_min, priority], position) =>
      workflow_steps.push({ id: uid(), workflow_id: id, position, name, offset_days, duration_min, priority }))
  }
  return { workflows, workflow_steps }
}

/** Datos 100% ficticios, relativos a la fecha actual. */
export function seedDemo(): DB {
  const now = today(), mk = monthKey(now)
  const { workflows, workflow_steps } = seedWorkflows()
  const base = { address: '', notes: '', other_deliverables: '', stories_month: 8 }
  const defs: [string, string, string, number, Client['status'], number, number][] = [
    ['Bodega Urbana', 'Bodega Urbana S.A.', 'Gestión de redes + fotos', 275000, 'activo', 20, 2],
    ['Restaurante Central', 'Central Gastronomía', 'Gestión de redes + reels', 275000, 'activo', 25, 3],
    ['Hotel Iguazú', 'Hotel Iguazú Resort', 'Fotografía + redes', 420000, 'activo', 10, 4],
    ['Estudio Fotográfico', 'Estudio Luz', 'Gestión de redes', 200000, 'activo', 30, 1],
    ['Cafetería Norte', 'Norte Café', 'Gestión de redes', 180000, 'pausado', 15, 1],
  ]
  const clients: Client[] = [], services: Service[] = [], payments: Payment[] = []
  defs.forEach(([name, company, svc, price, status, pay_day, sessions], i) => {
    const c: Client = { ...base, id: uid(), name, company, phone: '', email: '', instagram: '@' + name.toLowerCase().replace(/\s/g, ''), status, sessions_month: sessions, posts_month: 12, reels_month: 4 }
    clients.push(c)
    const s: Service = { id: uid(), client_id: c.id, name: svc, price, frequency: 'mensual', start_date: addDays(now, -120 - i * 20), pay_day, status }
    services.push(s)
    if (status !== 'pausado') {
      const prev = monthKey(addDays(mk + '-01', -1)), due = dayOfMonth(mk, pay_day)
      payments.push({ id: uid(), client_id: c.id, service_id: s.id, amount: price, due_date: dayOfMonth(prev, pay_day), paid_date: dayOfMonth(prev, pay_day), status: 'cobrado', concept: svc })
      payments.push({ id: uid(), client_id: c.id, service_id: s.id, amount: price, due_date: due, paid_date: i === 1 ? due : null, status: i === 1 ? 'cobrado' : 'pendiente', concept: svc })
    }
  })
  const photo = workflows[0]
  const events: AgendaEvent[] = [
    { id: uid(), client_id: clients[0].id, workflow_id: photo.id, title: 'Sesión de fotos — Bodega Urbana', job_type: 'Sesión de fotos', date: addDays(now, -2), time: '10:00', description: '', status: 'completada' },
    { id: uid(), client_id: clients[2].id, workflow_id: photo.id, title: 'Sesión de fotos — Hotel Iguazú', job_type: 'Sesión de fotos', date: addDays(now, 1), time: '15:00', description: '', status: 'pendiente' },
  ]
  const tasks: Task[] = events.flatMap(e => tasksFromWorkflow({ workflow_steps }, photo.id, e))
  const contents: Content[] = [
    { id: uid(), client_id: clients[1].id, kind: 'Reel', title: 'Reel plato del día', date: addDays(now, 2), status: 'planificado' },
    { id: uid(), client_id: clients[3].id, kind: 'Post', title: 'Post portfolio bodas', date: addDays(now, 3), status: 'planificado' },
  ]
  return {
    clients, services, payments, tasks, events, workflows, workflow_steps, contents,
    notes: [{ id: uid(), client_id: clients[0].id, body: 'Prefieren fotos con luz natural.', created_at: new Date().toISOString() }],
    goals: [{ id: uid(), metric: 'clients', target: 40 }, { id: uid(), metric: 'revenue', target: 10000000 }],
  }
}
