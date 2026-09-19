import { Link } from 'react-router-dom'
import type { ClientStatus, Payment, Task } from '../types'
import { Badge, IconButton, cx, type Tone } from './ui'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { isLate } from '../lib/tasks'
import { isOverdue } from '../lib/finance'
import { addDays, fmtShort, relativeDay, today } from '../utils/date'
import { fmtMoney } from '../utils/format'

const CLIENT_TONE: Record<ClientStatus, Tone> = { activo: 'ok', pausado: 'warn', pendiente: 'accent', baja: 'neutral' }
export const ClientStatusBadge = ({ status }: { status: ClientStatus }) => <Badge tone={CLIENT_TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>

export const PaymentStatusBadge = ({ p }: { p: Payment }) =>
  p.status === 'cobrado' ? <Badge tone="ok">Cobrado</Badge> : isOverdue(p) ? <Badge tone="bad">Vencido</Badge> : <Badge tone="warn">Pendiente</Badge>

export function ClientLink({ id }: { id: string | null }) {
  const { db } = useData()
  const c = db.clients.find(c => c.id === id)
  return c ? <Link to={`/clientes/${c.id}`} className="text-mute underline-offset-2 hover:text-accent hover:underline">{c.name}</Link> : null
}

export function TaskRow({ task: t, showDate }: { task: Task; showDate?: boolean }) {
  const { patch } = useData()
  const forms = useForms()
  const late = isLate(t), done = t.status === 'completada'
  return (
    <li className={cx('group flex items-center gap-3 py-2.5', done && 'opacity-50')}>
      <input type="checkbox" checked={done} aria-label={`Completar: ${t.title}`} onChange={() => patch('tasks', t.id, { status: done ? 'pendiente' : 'completada' })}
        className="size-5 shrink-0 cursor-pointer appearance-none rounded-md border border-line checked:border-accent checked:bg-accent checked:[background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E&quot;)]" />
      <div className="min-w-0 flex-1">
        <div className={cx('truncate text-sm font-medium', done && 'line-through')}>
          {t.time && <span className="mr-2 font-mono text-xs text-mute">{t.time}</span>}{t.title}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-mute">
          <ClientLink id={t.client_id} />
          {(showDate || late) && <span>{relativeDay(t.date)} · {fmtShort(t.date)}</span>}
        </div>
      </div>
      {late && !done && <Badge tone="bad">ATRASADA</Badge>}
      {t.priority === 'alta' && !late && !done && <Badge tone="warn">Alta</Badge>}
      <div className="flex opacity-100 sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <IconButton icon="clock" label="Posponer un día" onClick={() => patch('tasks', t.id, { date: addDays(t.date < today() ? today() : t.date, 1) })} />
        <IconButton icon="edit" label="Editar tarea" onClick={() => forms.open('task', { ...t })} />
      </div>
    </li>
  )
}

export function PaymentRow({ p }: { p: Payment }) {
  const { patch } = useData()
  const forms = useForms()
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <div className="min-w-[9rem] flex-1">
        <div className="truncate text-sm font-medium"><ClientLink id={p.client_id} /></div>
        <div className="text-xs text-mute">Vence {fmtShort(p.due_date)} · {p.concept}</div>
      </div>
      <div className="text-sm font-medium tabular-nums">{fmtMoney(p.amount)}</div>
      <PaymentStatusBadge p={p} />
      {p.status === 'pendiente' && <IconButton icon="check" label="Marcar como cobrado" onClick={() => patch('payments', p.id, { status: 'cobrado', paid_date: today() })} />}
      <IconButton icon="edit" label="Editar cobro" onClick={() => forms.open('payment', { ...p })} />
    </li>
  )
}
