import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { buildReminders } from '../lib/reminders'
import { Icon } from './Icon'
import { cx } from './ui'

export function RemindersList({ onNavigate }: { onNavigate?: () => void }) {
  const { db } = useData()
  const rs = buildReminders(db)
  if (!rs.length) return <p className="p-4 text-sm text-mute">Todo al día. No hay recordatorios.</p>
  return (
    <ul className="divide-y divide-line">
      {rs.map(r => (
        <li key={r.id}>
          <Link to={r.link ?? '/'} onClick={onNavigate} className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-bg">
            <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', r.level === 'alert' ? 'bg-bad' : r.level === 'warn' ? 'bg-warn' : 'bg-accent')} />{r.text}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function RemindersBell() {
  const { db } = useData()
  const [open, setOpen] = useState(false)
  const n = buildReminders(db).length
  return (
    <div className="relative">
      <button aria-label={`Recordatorios (${n})`} aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-card hover:bg-bg">
        <Icon name="bell" className="size-[18px]" />
        {n > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">{n}</span>}
      </button>
      {open && (
        <div className="rise absolute right-0 top-12 z-30 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl">
          <RemindersList onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
