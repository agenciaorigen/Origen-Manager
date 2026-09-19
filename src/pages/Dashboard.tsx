import { Link } from 'react-router-dom'
import { Button, Card, PageHeader, Section, Stat, Empty, Badge } from '../components/ui'
import { PaymentRow, TaskRow } from '../components/rows'
import { RemindersList } from '../components/Reminders'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { monthSummary } from '../lib/finance'
import { groupTasks } from '../lib/tasks'
import { addDays, fmtLong, monthKey, monthName, today } from '../utils/date'
import { fmtMoney } from '../utils/format'

export default function Dashboard() {
  const { db } = useData()
  const forms = useForms()
  const now = today(), key = monthKey(now)
  const s = monthSummary(db, key)
  const g = groupTasks(db.tasks)
  const focus = [...g.late, ...g.today]
  const pays = db.payments.filter(p => p.status === 'pendiente').sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5)

  return (
    <>
      <PageHeader title="Centro de operaciones" subtitle="¿Qué está pasando con tu agencia y qué tenés que hacer ahora?"
        actions={<Button variant="primary" icon="plus" onClick={() => forms.open('event')}>Nuevo evento</Button>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rise p-6 lg:col-span-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">Facturación {monthName(key)}</div>
          <div className="mt-2 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{fmtMoney(s.billed)}</div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Stat label="Cobrado" value={fmtMoney(s.collected)} tone="ok" />
            <Stat label="Pendiente" value={fmtMoney(s.pending)} />
            <Stat label="Vencido" value={fmtMoney(s.overdue)} tone={s.overdue ? 'bad' : undefined} />
            <Stat label="Proyectada" value={fmtMoney(s.projected)} />
            <Stat label="Clientes activos" value={s.activeClients} />
            <Stat label="Ticket promedio" value={fmtMoney(s.avgTicket)} />
          </div>
        </Card>

        <Section title="Recordatorios" className="max-lg:order-last p-0 [&>div:first-child]:px-5 [&>div:first-child]:pt-5"><div className="max-h-72 overflow-y-auto"><RemindersList /></div></Section>

        <Section title="Tareas de hoy" className="lg:col-span-2" action={<Link to="/hoy" className="text-xs text-accent hover:underline">Ver todas</Link>}>
          {focus.length ? <ul className="divide-y divide-line">{focus.slice(0, 8).map(t => <TaskRow key={t.id} task={t} />)}</ul> : <Empty>Nada pendiente para hoy.</Empty>}
        </Section>

        <Section title="Cobros próximos" action={<Link to="/finanzas" className="text-xs text-accent hover:underline">Finanzas</Link>}>
          {pays.length ? <ul className="divide-y divide-line">{pays.map(p => <PaymentRow key={p.id} p={p} />)}</ul> : <Empty>Sin cobros pendientes.</Empty>}
        </Section>

        <Section title="Próximos días" className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(n => {
              const d = addDays(now, n)
              const ts = db.tasks.filter(t => t.date === d && t.status === 'pendiente')
              const es = db.events.filter(e => e.date === d && e.status === 'pendiente')
              return (
                <div key={d}>
                  <div className="mb-2 flex items-baseline justify-between"><span className="text-sm font-medium">{['Hoy', 'Mañana', 'En 2 días', 'En 3 días'][n]}</span><span className="text-xs text-mute first-letter:uppercase">{fmtLong(d)}</span></div>
                  <ul className="space-y-1.5 text-sm">
                    {es.map(e => <li key={e.id} className="flex items-center gap-2"><Badge tone="accent">{e.time || 'Evento'}</Badge><span className="truncate">{e.title}</span></li>)}
                    {ts.map(t => <li key={t.id} className="truncate text-mute">· {t.title}</li>)}
                    {!es.length && !ts.length && <li className="text-mute">Libre</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        </Section>
      </div>
    </>
  )
}
