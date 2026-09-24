import type { Client } from '../types'
import { cx } from './ui'

/** Chips por cliente con su color: tocar para ocultar/mostrar. */
export function ClientFilter({ clients, color, off, toggle }: { clients: Client[]; color(id: string | null): string; off: string[]; toggle(id: string): void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar por cliente">
      {clients.map(c => {
        const hidden = off.includes(c.id)
        return (
          <button key={c.id} aria-pressed={!hidden} onClick={() => toggle(c.id)}
            className={cx('flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs', hidden && 'text-mute line-through opacity-60')}>
            <span className="size-2.5 rounded-full" style={{ background: color(c.id) }} />{c.name}
          </button>
        )
      })}
    </div>
  )
}
