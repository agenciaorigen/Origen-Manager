import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Empty, PageHeader, cx } from '../components/ui'
import { ClientStatusBadge } from '../components/rows'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { fmtShort } from '../utils/date'
import { fmtMoney } from '../utils/format'
import type { ClientStatus } from '../types'

const FILTERS: (ClientStatus | 'todos')[] = ['todos', 'activo', 'pausado', 'pendiente', 'baja']

export default function Clientes() {
  const { db } = useData()
  const forms = useForms()
  const [f, setF] = useState<(typeof FILTERS)[number]>('todos')
  const rows = db.clients.filter(c => f === 'todos' || c.status === f).map(c => {
    const svcs = db.services.filter(s => s.client_id === c.id && s.status === 'activo')
    const nextPay = db.payments.filter(p => p.client_id === c.id && p.status === 'pendiente').sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
    const nextJob = db.events.filter(e => e.client_id === c.id && e.status === 'pendiente').sort((a, b) => a.date.localeCompare(b.date))[0]
    return { c, service: svcs.map(s => s.name).join(', ') || '—', price: svcs.reduce((a, s) => a + s.price, 0), nextPay, nextJob }
  })

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${db.clients.length} en total`} actions={<Button variant="primary" icon="plus" onClick={() => forms.open('client')}>Nuevo cliente</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(x => <button key={x} onClick={() => setF(x)} aria-pressed={f === x} className={cx('rounded-full border px-3 py-1 text-xs capitalize', f === x ? 'border-ink bg-ink text-white' : 'border-line bg-card text-mute')}>{x}</button>)}
      </div>
      {!rows.length ? <Card className="p-5"><Empty>No hay clientes en este estado.</Empty></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ c, service, price, nextPay, nextJob }) => (
            <Link key={c.id} to={`/clientes/${c.id}`} className="rise block rounded-2xl border border-line bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-semibold">{c.name}</div><div className="truncate text-xs text-mute">{service}</div></div><ClientStatusBadge status={c.status} /></div>
              <div className="mt-4 text-2xl font-semibold tabular-nums tracking-tight">{fmtMoney(price)}<span className="text-xs font-normal text-mute"> /mes</span></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-mute">Próximo trabajo</dt><dd className="font-medium">{nextJob ? fmtShort(nextJob.date) : '—'}</dd></div><div><dt className="text-mute">Próximo cobro</dt><dd className="font-medium">{nextPay ? fmtShort(nextPay.due_date) : '—'}</dd></div></dl>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
