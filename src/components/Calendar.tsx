import { useState } from 'react'
import { Button, Card, IconButton, cx, type Tone } from './ui'
import { addDays, addMonths, fmtLong, fmtMonth, monthKey, parseISO, startOfWeek, today } from '../utils/date'

export interface CalItem { id: string; date: string; time: string; label: string; sub?: string; tone: Tone; done?: boolean; color?: string; solid?: boolean; onClick(): void }
type View = 'dia' | 'semana' | 'mes'

const DOT: Record<Tone, string> = { neutral: 'bg-mute', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', accent: 'bg-accent' }
const WD = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function Item({ i, compact }: { i: CalItem; compact?: boolean }) {
  return (
    <button onClick={i.onClick} title={[i.time, i.label, i.sub].filter(Boolean).join(' · ')}
      style={i.color ? (i.solid ? { background: i.color, color: '#fff' } : { borderLeft: `3px solid ${i.color}`, background: `${i.color}14` }) : undefined}
      className={cx('mb-0.5 flex w-full items-center gap-1.5 rounded-md text-left hover:brightness-95', compact ? 'px-1 py-0.5 text-[11px]' : 'px-2 py-1.5 text-sm', i.solid && 'font-medium', i.done && 'opacity-50 line-through')}>
      {!i.color && <span className={cx('size-1.5 shrink-0 rounded-full', DOT[i.tone])} />}
      {i.time && <span className={cx('font-mono text-[10px]', !i.solid && 'text-mute')}>{i.time.slice(0, 5)}</span>}
      <span className="truncate">{i.label}</span>
      {!compact && i.sub && <span className={cx('ml-auto truncate text-xs', !i.solid && 'text-mute')}>{i.sub}</span>}
    </button>
  )
}

export function Calendar({ items, onDayClick, defaultView = 'mes' }: { items: CalItem[]; onDayClick(date: string): void; defaultView?: View }) {
  const [view, setView] = useState<View>(defaultView)
  const [cursor, setCursor] = useState(today())
  const on = (d: string) => items.filter(i => i.date === d).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))

  const step = (n: number) => setCursor(c => view === 'mes' ? addMonths(monthKey(c), n) + '-01' : addDays(c, n * (view === 'semana' ? 7 : 1)))
  const title = view === 'mes' ? fmtMonth(monthKey(cursor)) : view === 'dia' ? fmtLong(cursor) : `Semana del ${fmtLong(startOfWeek(cursor))}`
  const first = startOfWeek(view === 'mes' ? monthKey(cursor) + '-01' : cursor)
  const days = Array.from({ length: view === 'mes' ? 42 : 7 }, (_, i) => addDays(first, i))

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <IconButton icon="left" label="Anterior" onClick={() => step(-1)} />
        <IconButton icon="right" label="Siguiente" onClick={() => step(1)} />
        <h2 className="text-base font-semibold first-letter:uppercase">{title}</h2>
        <Button className="ml-1 min-h-8 px-2.5 text-xs" onClick={() => setCursor(today())}>Hoy</Button>
        <div className="ml-auto flex rounded-xl border border-line p-0.5" role="tablist">
          {(['dia', 'semana', 'mes'] as View[]).map(v => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={cx('rounded-lg px-3 py-1 text-xs font-medium capitalize', view === v ? 'bg-ink text-white' : 'text-mute')}>{v === 'dia' ? 'Día' : v}</button>
          ))}
        </div>
      </div>

      {view === 'dia' && (
        <div className="min-h-32">{on(cursor).length ? on(cursor).map(i => <Item key={i.id} i={i} />) : <p className="py-8 text-center text-sm text-mute">Nada programado.</p>}</div>
      )}

      {view === 'semana' && (
        <div className="grid gap-2 sm:grid-cols-7">
          {days.map((d, k) => (
            <div key={d} className={cx('min-h-24 rounded-xl border p-2', d === today() ? 'border-accent' : 'border-line')}>
              <button onClick={() => onDayClick(d)} className="mb-1 block w-full text-left text-xs font-medium text-mute hover:text-accent">{WD[k]} {parseISO(d).getDate()}</button>
              {on(d).map(i => <Item key={i.id} i={i} compact />)}
            </div>
          ))}
        </div>
      )}

      {view === 'mes' && (
        <>
          <div className="grid grid-cols-7 text-center text-[11px] text-mute">{WD.map(w => <div key={w} className="py-1">{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {days.map(d => {
              const its = on(d), inM = monthKey(d) === monthKey(cursor)
              return (
                <div key={d} className={cx('min-h-16 bg-card p-1 sm:min-h-24', !inM && 'bg-bg/60 text-mute/60')}>
                  <button onClick={() => onDayClick(d)} aria-label={`Crear el ${d}`}
                    className={cx('mb-0.5 grid size-6 place-items-center rounded-full text-xs hover:bg-accent-soft', d === today() && 'bg-ink text-white hover:bg-ink')}>{parseISO(d).getDate()}</button>
                  <div className="hidden sm:block">{its.slice(0, 3).map(i => <Item key={i.id} i={i} compact />)}{its.length > 3 && <div className="px-1 text-[10px] text-mute">+{its.length - 3} más</div>}</div>
                  <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">{its.slice(0, 4).map(i => <span key={i.id} className={cx('size-1.5 rounded-full', !i.color && DOT[i.tone])} style={i.color ? { background: i.color } : undefined} />)}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
