import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Empty, PageHeader, Progress } from '../components/ui'
import { TaskRow } from '../components/rows'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { monthlyCycles, monthlyWorkflowId, proposeAgenda, type CycleState, type Proposal } from '../lib/monthly'
import { tasksFromWorkflow } from '../lib/workflow'
import { uid } from '../utils/format'
import type { AgendaEvent } from '../types'
import { isLate } from '../lib/tasks'
import { addMonths, fmtLong, fmtMonth, fmtShort, monthKey, today } from '../utils/date'

const STATE: Record<CycleState, { label: string; tone: 'bad' | 'warn' | 'ok' }> = {
  'sin-agendar': { label: 'Sin agendar', tone: 'bad' }, 'en-curso': { label: 'En curso', tone: 'warn' }, cumplido: { label: 'Cumplido', tone: 'ok' },
}

export default function Mensual() {
  const { db, add, patch } = useData()
  const [plan, setPlan] = useState<Proposal[] | null>(null)
  const [busy, setBusy] = useState(false)
  const forms = useForms()
  const [key, setKey] = useState(monthKey(today()))
  const cycles = monthlyCycles(db, key)
  const wf = monthlyWorkflowId(db)
  const ok = cycles.filter(c => c.state === 'cumplido').length
  const setRow = (i: number, k: 'date' | 'time', v: string) => setPlan(p => p!.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  async function confirm() {
    if (!plan || !wf) return
    setBusy(true)
    for (const r of plan) {
      const ev: AgendaEvent = { id: uid(), client_id: r.client.id, workflow_id: wf, title: `Sesión de fotos — ${r.client.name}`, job_type: 'Sesión de fotos', date: r.date, time: r.time, description: '', status: 'pendiente' }
      if (await add('events', ev)) { const ts = tasksFromWorkflow(db, wf, ev); if (ts.length) await add('tasks', ...ts) }
    }
    setBusy(false); setPlan(null)
  }
  const dflt = key === monthKey(today()) ? today() : `${key}-01`

  return (
    <>
      <PageHeader title="Contenido del mes" subtitle={`${ok} de ${cycles.length} clientes cumplidos`}
        actions={<div className="flex items-center gap-1">
          <Button onClick={() => setKey(addMonths(key, -1))} aria-label="Mes anterior">‹</Button>
          <span className="min-w-32 text-center text-sm font-medium capitalize">{fmtMonth(key)}</span>
          <Button onClick={() => setKey(addMonths(key, 1))} aria-label="Mes siguiente">›</Button>
        </div>} />
      {!wf && <Card className="mb-4 p-4 text-sm">Falta la plantilla “Ciclo mensual de contenido”. Cargala desde Workflows o con el SQL provisto.</Card>}
      {wf && !plan && cycles.some(c => c.state === 'sin-agendar') && (
        <Button variant="primary" icon="calendar" className="mb-4" onClick={() => setPlan(proposeAgenda(db, key))}>Armar agenda del mes</Button>
      )}
      {plan && (
        <Card className="mb-4 space-y-3 p-4">
          <h2 className="font-semibold">Agenda propuesta</h2>
          <p className="text-sm text-mute">Revisá fechas y horas. Al confirmar se crean las sesiones con todas sus tareas. El día preferido de cada cliente se carga en su ficha.</p>
          <ul className="divide-y divide-line">
            {plan.map((r, i) => (
              <li key={r.client.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="min-w-36 flex-1 text-sm font-medium">{r.client.name}<span className="block text-xs font-normal capitalize text-mute">{fmtLong(r.date)}</span></span>
                <input type="date" required aria-label={`Fecha para ${r.client.name}`} value={r.date} onChange={e => setRow(i, 'date', e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1 text-sm" />
                <input type="time" aria-label={`Hora para ${r.client.name}`} value={r.time} onChange={e => setRow(i, 'time', e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1 text-sm" />
                <Button aria-label={`Quitar ${r.client.name}`} onClick={() => setPlan(plan.filter((_, j) => j !== i))}>Quitar</Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy || !plan.length || plan.some(r => !r.date)} onClick={confirm}>{busy ? 'Creando…' : `Confirmar ${plan.length} sesiones`}</Button>
            <Button onClick={() => setPlan(null)}>Cancelar</Button>
          </div>
        </Card>
      )}
      {!cycles.length && <Empty>No hay clientes activos.</Empty>}
      <div className="grid gap-4 md:grid-cols-2">
        {cycles.map(({ client, event, tasks, done, next, state }) => (
          <Card key={client.id} className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/clientes/${client.id}`} className="truncate font-semibold hover:text-accent">{client.name}</Link>
              <Badge tone={STATE[state].tone}>{STATE[state].label}</Badge>
            </div>
            {!event ? (
              <Button variant="primary" icon="plus" onClick={() => forms.open('event', { client_id: client.id, job_type: 'Sesión de fotos', workflow_id: wf ?? '', date: dflt })}>Agendar sesión del mes</Button>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <button className="text-left underline-offset-2 hover:underline" onClick={() => forms.open('event', { ...event })}>Sesión: {fmtShort(event.date)}{event.time && ` · ${event.time}`}</button>
                  <span className="text-mute">{done}/{tasks.length} tareas</span>
                </div>
                <Progress value={done} max={tasks.length || 1} />
                {next ? (
                  <div className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-mute">Siguiente · {fmtShort(next.date)} {isLate(next) && <Badge tone="bad">ATRASADA</Badge>}</div>
                      <div className="truncate text-sm font-medium">{next.title}</div>
                    </div>
                    <Button variant="primary" onClick={() => patch('tasks', next.id, { status: 'completada' })}>Hecho</Button>
                  </div>
                ) : state === 'en-curso' && (
                  <Button variant="primary" onClick={() => patch('events', event.id, { status: 'completada' })}>Confirmar mes cumplido</Button>
                )}
                <details><summary className="cursor-pointer text-sm text-mute">Ver todas las tareas</summary>
                  <ul className="divide-y divide-line">{tasks.map(t => <TaskRow key={t.id} task={t} showDate />)}</ul>
                </details>
              </>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
