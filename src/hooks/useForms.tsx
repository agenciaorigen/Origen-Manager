import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { FormModal, type Field, type Values } from '../components/FormModal'
import { useData } from './useData'
import { JOB_TYPES, type AgendaEvent, type Client, type DB, type Note, type Payment, type Service, type Task, type Workflow, type WorkflowStep } from '../types'
import { tasksFromWorkflow } from '../lib/workflow'
import { addDays, diffDays, today } from '../utils/date'
import { uid } from '../utils/format'

const opts = (xs: readonly string[]) => xs.map(x => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }))
const PRIORITY = opts(['alta', 'media', 'baja'])
const STATUS = opts(['activo', 'pausado', 'pendiente', 'baja'])
const clientOpts = (db: DB, empty?: string) => [...(empty ? [{ value: '', label: empty }] : []), ...db.clients.map(c => ({ value: c.id, label: c.name }))]

type Kind = 'client' | 'service' | 'task' | 'event' | 'payment' | 'note' | 'workflow' | 'step' | 'content' | 'goal'
interface Open { kind: Kind; init?: Record<string, unknown> }
interface Forms { open(kind: Kind, init?: Record<string, unknown>): void }
const Ctx = createContext<Forms>(null as never)
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const useForms = () => useContext(Ctx)

export function FormsProvider({ children }: { children: ReactNode }) {
  const [cur, setCur] = useState<Open | null>(null)
  const forms = useMemo<Forms>(() => ({ open: (kind, init) => setCur({ kind, init }) }), [])
  return <Ctx.Provider value={forms}>{children}{cur && <EntityForm key={cur.kind + (cur.init?.id ?? '')} {...cur} onClose={() => setCur(null)} />}</Ctx.Provider>
}

function EntityForm({ kind, init = {}, onClose }: Open & { onClose(): void }) {
  const { db, add, patch, del } = useData()
  const editing = !!init.id
  const done = <T,>(fn: () => T) => { fn(); onClose() }
  const save = <K extends Parameters<typeof add>[0]>(t: K, v: Record<string, unknown>) =>
    editing ? patch(t, init.id as string, v as never) : add(t, { ...v, id: uid() } as never)
  const rm = (t: Parameters<typeof del>[0]) => editing ? () => done(() => del(t, init.id as string)) : undefined
  const orNull = (x: unknown) => (x === '' || x == null ? null : x)

  type Cfg = { title: string; fields: Field[]; initial: Values; submit(v: Values): void; onDelete?(): void; derive?(v: Values, c: string): Values }
  const cfg: Record<Kind, () => Cfg> = {
    client: () => ({
      title: editing ? 'Editar cliente' : 'Nuevo cliente',
      fields: [
        { name: 'name', label: 'Nombre', required: true }, { name: 'company', label: 'Empresa' },
        { name: 'phone', label: 'Teléfono', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' },
        { name: 'instagram', label: 'Instagram' }, { name: 'status', label: 'Estado', type: 'select', options: STATUS },
        { name: 'address', label: 'Dirección', span: 2 },
        { name: 'sessions_month', label: 'Sesiones / mes', type: 'number', min: 0 }, { name: 'posts_month', label: 'Publicaciones / mes', type: 'number', min: 0 },
        { name: 'reels_month', label: 'Reels / mes', type: 'number', min: 0 }, { name: 'stories_month', label: 'Historias / mes', type: 'number', min: 0 },
        { name: 'other_deliverables', label: 'Otros entregables', span: 2 },
        { name: 'session_week', label: 'Sesión: semana del mes', type: 'select', options: [{ value: '', label: 'Sin preferencia' }, ...[1, 2, 3, 4].map(n => ({ value: String(n), label: `${n}ª semana` }))] },
        { name: 'session_weekday', label: 'Sesión: día', type: 'select', options: [{ value: '', label: 'Sin preferencia' }, ...DAYS.map((d, i) => ({ value: String(i + 1), label: d }))] },
        { name: 'session_time', label: 'Sesión: hora', type: 'time' }, { name: 'notes', label: 'Notas', type: 'textarea' },
      ],
      initial: { name: '', company: '', phone: '', email: '', instagram: '', address: '', notes: '', status: 'activo', sessions_month: 0, posts_month: 0, reels_month: 0, stories_month: 0, other_deliverables: '', ...init, session_week: init.session_week ?? '', session_weekday: init.session_weekday ?? '', session_time: init.session_time ?? '' } as unknown as Values,
      submit: v => done(() => save('clients', { ...v, session_week: orNull(v.session_week) && Number(v.session_week), session_weekday: orNull(v.session_weekday) && Number(v.session_weekday) })), onDelete: rm('clients'),
    }),
    service: () => ({
      title: editing ? 'Editar servicio' : 'Nuevo servicio',
      fields: [
        { name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db), required: true },
        { name: 'name', label: 'Servicio contratado', required: true },
        { name: 'price', label: 'Precio (ARS)', type: 'number', min: 0, required: true },
        { name: 'frequency', label: 'Frecuencia', type: 'select', options: opts(['mensual', 'trimestral', 'unico']) },
        { name: 'start_date', label: 'Fecha de inicio', type: 'date', required: true },
        { name: 'pay_day', label: 'Día de pago (1-31)', type: 'number', min: 1, max: 31, required: true },
        { name: 'status', label: 'Estado', type: 'select', options: STATUS },
      ],
      initial: { client_id: db.clients[0]?.id ?? '', name: '', price: 0, frequency: 'mensual', start_date: today(), pay_day: 10, status: 'activo', ...init } as Values,
      submit: v => done(() => save('services', v)), onDelete: rm('services'),
    }),
    task: () => ({
      title: editing ? 'Editar tarea' : 'Nueva tarea',
      fields: [
        { name: 'title', label: 'Tarea', required: true, span: 2 },
        { name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db, 'Sin cliente') },
        { name: 'priority', label: 'Prioridad', type: 'select', options: PRIORITY },
        { name: 'date', label: 'Fecha', type: 'date', required: true }, { name: 'time', label: 'Hora', type: 'time' },
        { name: 'notes', label: 'Notas', type: 'textarea' },
      ],
      initial: { title: '', client_id: '', priority: 'media', date: today(), time: '', notes: '', ...init } as Values,
      submit: v => done(() => save('tasks', { ...v, client_id: orNull(v.client_id), ...(editing ? {} : { event_id: null, status: 'pendiente', duration_min: 30 }) })),
      onDelete: rm('tasks'),
    }),
    event: () => {
      const wfFor = (job: string) => db.workflows.find(w => w.job_type === job)?.id ?? ''
      return {
        title: editing ? 'Editar evento' : 'Nuevo evento',
        fields: [
          { name: 'job_type', label: 'Tipo de trabajo', type: 'select', options: JOB_TYPES.map(j => ({ value: j, label: j })) },
          { name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db, 'Sin cliente') },
          { name: 'date', label: 'Fecha', type: 'date', required: true }, { name: 'time', label: 'Hora', type: 'time' },
          { name: 'title', label: 'Título (opcional)', span: 2 },
          ...(editing ? [] : [{ name: 'workflow_id', label: 'Generar tareas con el workflow', type: 'select' as const, span: 2 as const, options: [{ value: '', label: 'Ninguno' }, ...db.workflows.map(w => ({ value: w.id, label: w.name }))] }]),
          { name: 'description', label: 'Descripción', type: 'textarea' },
          ...(editing ? [{ name: 'status', label: 'Estado', type: 'select' as const, options: opts(['pendiente', 'completada']) }] : []),
        ],
        initial: { job_type: 'Sesión de fotos', client_id: '', date: today(), time: '', title: '', description: '', workflow_id: wfFor('Sesión de fotos'), status: 'pendiente', ...init } as Values,
        derive: (v, c) => (c === 'job_type' && !editing ? { ...v, workflow_id: wfFor(String(v.job_type)) } : v),
        submit: v => done(() => {
          const client = db.clients.find(c => c.id === v.client_id)
          const title = String(v.title || `${v.job_type}${client ? ' — ' + client.name : ''}`)
          if (editing) {
            // Al mover la fecha de la sesión, las tareas pendientes se corren los mismos días.
            const delta = diffDays(String(v.date), String(init.date))
            if (delta) db.tasks.filter(t => t.event_id === init.id && t.status === 'pendiente').forEach(t => patch('tasks', t.id, { date: addDays(t.date, delta) }))
          }
          if (editing) return save('events', { job_type: v.job_type, client_id: orNull(v.client_id), date: v.date, time: v.time, title, description: v.description, status: v.status })
          const ev: AgendaEvent = { id: uid(), client_id: orNull(v.client_id) as string | null, workflow_id: orNull(v.workflow_id) as string | null, title, job_type: v.job_type as AgendaEvent['job_type'], date: String(v.date), time: String(v.time), description: String(v.description), status: 'pendiente' }
          // Secuencial: el evento debe existir en la base antes de insertar sus tareas (clave foránea).
          void (async () => {
            const ok = await add('events', ev) // si falla, no se crean tareas y se muestra el error real del evento
            if (ok && ev.workflow_id) { const ts = tasksFromWorkflow(db, ev.workflow_id, ev); if (ts.length) await add('tasks', ...ts) }
          })()
        }),
        onDelete: rm('events'),
      }
    },
    payment: () => ({
      title: editing ? 'Editar cobro' : 'Nuevo cobro',
      fields: [
        { name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db), required: true },
        { name: 'concept', label: 'Concepto', required: true },
        { name: 'amount', label: 'Monto (ARS)', type: 'number', min: 0, required: true },
        { name: 'due_date', label: 'Vencimiento', type: 'date', required: true },
        { name: 'status', label: 'Estado', type: 'select', options: opts(['pendiente', 'cobrado']) },
      ],
      initial: { client_id: db.clients[0]?.id ?? '', concept: '', amount: 0, due_date: addDays(today(), 7), status: 'pendiente', ...init } as Values,
      submit: v => done(() => save('payments', { ...v, paid_date: v.status === 'cobrado' ? (init.paid_date ?? today()) : null, ...(editing ? {} : { service_id: null }) } as Partial<Payment>)),
      onDelete: rm('payments'),
    }),
    note: () => ({
      title: 'Nueva nota',
      fields: [{ name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db, 'Sin cliente') }, { name: 'body', label: 'Nota', type: 'textarea', required: true }],
      initial: { client_id: '', body: '', ...init } as Values,
      submit: v => done(() => add('notes', { id: uid(), client_id: orNull(v.client_id), body: String(v.body), created_at: new Date().toISOString() } as Note)),
    }),
    content: () => ({
      title: editing ? 'Editar contenido' : 'Nuevo contenido',
      fields: [
        { name: 'client_id', label: 'Cliente', type: 'select', options: clientOpts(db), required: true },
        { name: 'kind', label: 'Tipo', type: 'select', options: ['Reel', 'Post', 'Historia', 'Otro'].map(x => ({ value: x, label: x })) },
        { name: 'title', label: 'Título', required: true, span: 2 },
        { name: 'date', label: 'Fecha de publicación', type: 'date', required: true },
        { name: 'status', label: 'Estado', type: 'select', options: opts(['planificado', 'publicado']) },
      ],
      initial: { client_id: db.clients[0]?.id ?? '', kind: 'Post', title: '', date: today(), status: 'planificado', ...init } as Values,
      submit: v => done(() => save('contents', v)), onDelete: rm('contents'),
    }),
    goal: () => ({
      title: 'Editar objetivo',
      fields: [{ name: 'target', label: 'Objetivo', type: 'number', min: 1, required: true }],
      initial: { target: 1, ...init } as Values,
      submit: v => done(() => save('goals', { target: v.target })),
    }),
    workflow: () => ({
      title: editing ? 'Editar plantilla' : 'Nueva plantilla',
      fields: [{ name: 'name', label: 'Nombre', required: true }, { name: 'job_type', label: 'Se aplica a', type: 'select', options: [{ value: '', label: 'Cualquier trabajo' }, ...JOB_TYPES.map(j => ({ value: j, label: j }))] }],
      initial: { name: '', job_type: '', ...init } as Values,
      submit: v => done(() => save('workflows', { ...v, job_type: orNull(v.job_type) } as Partial<Workflow>)),
      onDelete: rm('workflows'),
    }),
    step: () => ({
      title: editing ? 'Editar paso' : 'Nuevo paso',
      fields: [
        { name: 'name', label: 'Nombre', required: true, span: 2 },
        { name: 'offset_days', label: 'Días respecto al evento (−2, 0, +3…)', type: 'number', required: true },
        { name: 'duration_min', label: 'Duración estimada (min)', type: 'number', min: 0 },
        { name: 'priority', label: 'Prioridad', type: 'select', options: PRIORITY },
      ],
      initial: { name: '', offset_days: 1, duration_min: 30, priority: 'media', ...init } as Values,
      submit: v => done(() => {
        const { workflow_id, position } = init as Partial<WorkflowStep>
        const n = db.workflow_steps.filter(s => s.workflow_id === workflow_id).length
        save('workflow_steps', editing ? v : { ...v, workflow_id, position: position ?? n })
      }),
      onDelete: rm('workflow_steps'),
    }),
  }
  const c = cfg[kind]()
  return <FormModal title={c.title} fields={c.fields} initial={c.initial} derive={c.derive} onSubmit={c.submit} onDelete={c.onDelete} onClose={onClose} />
}

export type { Client, Service, Task }
