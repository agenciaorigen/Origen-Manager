import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, Empty, PageHeader, Section, cx } from '../components/ui'
import { ClientStatusBadge, PaymentRow, TaskRow } from '../components/rows'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { fmtShort } from '../utils/date'
import { fmtMoney } from '../utils/format'

const TABS = ['Tareas', 'Sesiones y trabajos', 'Publicaciones', 'Pagos', 'Notas'] as const

export default function ClienteDetalle() {
  const { id } = useParams()
  const { db, del } = useData()
  const forms = useForms()
  const nav = useNavigate()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tareas')
  const c = db.clients.find(c => c.id === id)
  if (!c) return <Card className="p-5"><Empty>Cliente no encontrado. <Link className="text-accent" to="/clientes">Volver</Link></Empty></Card>

  const mine = <T extends { client_id: string | null }>(xs: T[]) => xs.filter(x => x.client_id === c.id)
  const info: [string, string][] = [['Empresa', c.company], ['Teléfono', c.phone], ['Email', c.email], ['Instagram', c.instagram], ['Dirección', c.address]]
  const prod: [string, string | number][] = [['Sesiones / mes', c.sessions_month], ['Publicaciones', c.posts_month], ['Reels', c.reels_month], ['Historias', c.stories_month], ['Otros', c.other_deliverables || '—']]

  return (
    <>
      <Link to="/clientes" className="mb-2 inline-block text-xs text-mute hover:text-accent">← Clientes</Link>
      <PageHeader title={c.name} subtitle={c.company}
        actions={<><ClientStatusBadge status={c.status} /><Button icon="edit" onClick={() => forms.open('client', { ...c })}>Editar</Button>
          <Button variant="danger" icon="trash" onClick={() => confirm(`¿Eliminar a ${c.name} y todo su historial?`) && del('clients', c.id).then(() => nav('/clientes'))}>Eliminar</Button></>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Datos generales">
          <dl className="space-y-2 text-sm">{info.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className="truncate text-right">{v || '—'}</dd></div>)}</dl>
          {c.notes && <p className="mt-4 border-t border-line pt-3 text-sm text-mute">{c.notes}</p>}
        </Section>

        <Section title="Servicios" action={<button className="text-xs text-accent hover:underline" onClick={() => forms.open('service', { client_id: c.id })}>+ Agregar</button>}>
          {mine(db.services).length ? <ul className="divide-y divide-line">{mine(db.services).map(s => (
            <li key={s.id}><button onClick={() => forms.open('service', { ...s })} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm hover:text-accent">
              <span><span className="block font-medium">{s.name}</span><span className="text-xs text-mute">{s.frequency} · día de pago {s.pay_day} · desde {fmtShort(s.start_date)}</span></span>
              <span className="text-right"><span className="block font-medium tabular-nums">{fmtMoney(s.price)}</span><Badge tone={s.status === 'activo' ? 'ok' : 'neutral'}>{s.status}</Badge></span>
            </button></li>))}</ul> : <Empty>Sin servicios. Agregá uno para generar cobros automáticos.</Empty>}
        </Section>

        <Section title="Producción mensual">
          <dl className="space-y-2 text-sm">{prod.map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>)}</dl>
        </Section>
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist">
          <h2 className="mr-2 text-[11px] font-medium uppercase tracking-[0.12em] text-mute">Historial</h2>
          {TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-full px-3 py-1 text-xs', tab === t ? 'bg-ink text-white' : 'bg-line/60 text-mute')}>{t}</button>)}
          <div className="flex-1" />
          <Button className="min-h-8 text-xs" icon="plus" onClick={() => tab === 'Tareas' ? forms.open('task', { client_id: c.id }) : tab === 'Pagos' ? forms.open('payment', { client_id: c.id }) : tab === 'Notas' ? forms.open('note', { client_id: c.id }) : tab === 'Publicaciones' ? forms.open('content', { client_id: c.id }) : forms.open('event', { client_id: c.id })}>Agregar</Button>
        </div>
        {tab === 'Tareas' && (mine(db.tasks).length ? <ul className="divide-y divide-line">{mine(db.tasks).sort((a, b) => b.date.localeCompare(a.date)).map(t => <TaskRow key={t.id} task={t} showDate />)}</ul> : <Empty>Sin tareas.</Empty>)}
        {tab === 'Sesiones y trabajos' && (mine(db.events).length ? <ul className="divide-y divide-line">{mine(db.events).sort((a, b) => b.date.localeCompare(a.date)).map(e => (
          <li key={e.id}><button onClick={() => forms.open('event', { ...e })} className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:text-accent"><span>{e.title}</span><span className="flex items-center gap-2 text-xs text-mute">{fmtShort(e.date)}<Badge tone={e.status === 'completada' ? 'ok' : 'warn'}>{e.status}</Badge></span></button></li>))}</ul> : <Empty>Sin eventos.</Empty>)}
        {tab === 'Publicaciones' && (mine(db.contents).length ? <ul className="divide-y divide-line">{mine(db.contents).sort((a, b) => b.date.localeCompare(a.date)).map(x => (
          <li key={x.id}><button onClick={() => forms.open('content', { ...x })} className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:text-accent"><span>{x.kind} · {x.title}</span><span className="flex items-center gap-2 text-xs text-mute">{fmtShort(x.date)}<Badge tone={x.status === 'publicado' ? 'ok' : 'accent'}>{x.status}</Badge></span></button></li>))}</ul> : <Empty>Sin contenido.</Empty>)}
        {tab === 'Pagos' && (mine(db.payments).length ? <ul className="divide-y divide-line">{mine(db.payments).sort((a, b) => b.due_date.localeCompare(a.due_date)).map(p => <PaymentRow key={p.id} p={p} />)}</ul> : <Empty>Sin pagos.</Empty>)}
        {tab === 'Notas' && (mine(db.notes).length ? <ul className="divide-y divide-line">{mine(db.notes).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(n => (
          <li key={n.id} className="flex items-start justify-between gap-3 py-2.5 text-sm"><span>{n.body}<span className="block text-xs text-mute">{fmtShort(n.created_at.slice(0, 10))}</span></span>
            <button aria-label="Eliminar nota" className="text-xs text-mute hover:text-bad" onClick={() => del('notes', n.id)}>Eliminar</button></li>))}</ul> : <Empty>Sin notas.</Empty>)}
      </Card>
    </>
  )
}
