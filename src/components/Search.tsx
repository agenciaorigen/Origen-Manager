import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { fmtMoney } from '../utils/format'
import { fmtShort } from '../utils/date'
import { Icon } from './Icon'

interface Hit { id: string; group: string; label: string; hint?: string; to: string }
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Search({ onClose }: { onClose(): void }) {
  const { db } = useData()
  const nav = useNavigate()
  const ref = useRef<HTMLDialogElement>(null)
  const [q, setQ] = useState('')
  useEffect(() => { ref.current?.showModal() }, [])

  const cname = (id: string | null) => db.clients.find(c => c.id === id)?.name ?? ''
  const all: Hit[] = [
    ...db.clients.map(c => ({ id: c.id, group: 'Clientes', label: c.name, hint: c.company, to: `/clientes/${c.id}` })),
    ...db.tasks.map(t => ({ id: t.id, group: 'Tareas', label: t.title, hint: `${cname(t.client_id)} · ${fmtShort(t.date)}`, to: '/hoy' })),
    ...db.events.map(e => ({ id: e.id, group: 'Eventos', label: e.title, hint: fmtShort(e.date), to: '/agenda' })),
    ...db.payments.map(p => ({ id: p.id, group: 'Pagos', label: `${cname(p.client_id)} — ${fmtMoney(p.amount)}`, hint: `${p.concept} · vence ${fmtShort(p.due_date)}`, to: '/finanzas' })),
    ...db.workflows.map(w => ({ id: w.id, group: 'Workflows', label: w.name, to: '/workflows' })),
  ]
  const n = norm(q.trim())
  const hits = n ? all.filter(h => norm(`${h.label} ${h.hint ?? ''}`).includes(n)).slice(0, 30) : []
  const go = (h: Hit) => { onClose(); nav(h.to) }

  return (
    <dialog ref={ref} onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-label="Búsqueda global"
      className="mx-auto mt-[10vh] w-[min(36rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-card p-0 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4">
        <Icon name="search" className="size-4 text-mute" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar clientes, tareas, eventos, pagos, workflows…" aria-label="Buscar"
          className="w-full bg-transparent py-3.5 text-sm outline-none" />
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-2">
        {!n && <p className="p-4 text-sm text-mute">Escribí para buscar en toda la aplicación.</p>}
        {n && !hits.length && <p className="p-4 text-sm text-mute">Sin resultados.</p>}
        {hits.map((h, i) => (
          <div key={h.group + h.id}>
            {(i === 0 || hits[i - 1].group !== h.group) && <div className="px-3 pb-1 pt-3 text-[11px] uppercase tracking-[0.1em] text-mute">{h.group}</div>}
            <button onClick={() => go(h)} className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-bg">
              <span className="truncate font-medium">{h.label}</span><span className="truncate text-xs text-mute">{h.hint}</span>
            </button>
          </div>
        ))}
      </div>
    </dialog>
  )
}
