import { Link } from 'react-router-dom'
import { Button, Card, PageHeader, Section } from '../components/ui'
import { TaskGroups } from '../components/TaskGroups'
import { ClientLink, PaymentRow } from '../components/rows'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { groupTasks } from '../lib/tasks'
import { isOverdue } from '../lib/finance'
import { monthlyCycles } from '../lib/monthly'
import { fmtLong, monthKey, today } from '../utils/date'

/** Todo lo del día en una sola pantalla. */
export default function Hoy() {
  const { db, patch } = useData()
  const forms = useForms()
  const now = today()
  const g = groupTasks(db.tasks)
  const sessions = db.events.filter(e => e.date === now && e.status === 'pendiente').sort((a, b) => a.time.localeCompare(b.time))
  const sin = monthlyCycles(db, monthKey(now)).filter(c => c.state === 'sin-agendar').length
  const overdue = db.payments.filter(p => isOverdue(p, now))
  return (
    <>
      <PageHeader title="Hoy" subtitle={`${fmtLong(now)} · ${g.late.length} atrasadas · ${g.today.length} para hoy`}
        actions={<Button variant="primary" icon="plus" onClick={() => forms.open('task')}>Nueva tarea</Button>} />
      <div className="space-y-4">
        {sin > 0 && (
          <Card className="flex flex-wrap items-center justify-between gap-3 bg-warn-soft p-4">
            <span className="text-sm">Falta agendar el contenido de <b>{sin} {sin === 1 ? 'cliente' : 'clientes'}</b> este mes.</span>
            <Link to="/mensual" className="rounded-xl bg-ink px-4 py-2 text-sm text-white">Armar agenda</Link>
          </Card>
        )}
        {sessions.length > 0 && (
          <Section title="Sesiones de hoy">
            <ul className="divide-y divide-line">{sessions.map(e => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-xs text-mute">{e.time || '—'}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{e.title}</div><div className="text-xs"><ClientLink id={e.client_id} /></div></div>
                <Button variant="primary" onClick={() => patch('events', e.id, { status: 'completada' })}>Hecha</Button>
              </li>))}</ul>
          </Section>
        )}
        <Card className="p-5"><TaskGroups /></Card>
        {overdue.length > 0 && (
          <Section title="Cobros vencidos"><ul className="divide-y divide-line">{overdue.map(p => <PaymentRow key={p.id} p={p} />)}</ul></Section>
        )}
      </div>
    </>
  )
}
