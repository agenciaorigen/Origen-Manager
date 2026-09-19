import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { Search } from './Search'
import { RemindersBell } from './Reminders'
import { useForms } from '../hooks/useForms'
import { cx } from './ui'

const NAV: [string, string, IconName][] = [
  ['/', 'Inicio', 'home'], ['/hoy', 'Hoy', 'today'], ['/clientes', 'Clientes', 'users'], ['/agenda', 'Agenda', 'calendar'],
  ['/finanzas', 'Finanzas', 'wallet'], ['/contenido', 'Contenido', 'grid'], ['/workflows', 'Workflows', 'flow'],
  ['/objetivos', 'Objetivos', 'target'], ['/perfil', 'Perfil', 'user'],
]
const MOBILE: [string, string, IconName][] = [
  ['/', 'Inicio', 'home'], ['/hoy', 'Hoy', 'today'], ['/clientes', 'Clientes', 'users'], ['/agenda', 'Agenda', 'calendar'],
  ['/finanzas', 'Finanzas', 'wallet'], ['/mas', 'Más', 'more'],
]

export function Layout() {
  const [search, setSearch] = useState(false)
  const [fab, setFab] = useState(false)
  const forms = useForms()
  const { pathname } = useLocation()
  useEffect(() => setFab(false), [pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const link = ({ isActive }: { isActive: boolean }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition', isActive ? 'bg-ink text-white' : 'text-mute hover:bg-line/50 hover:text-ink')
  const create = [['Cliente', 'client'], ['Tarea', 'task'], ['Evento', 'event'], ['Cobro', 'payment'], ['Nota', 'note']] as const

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-line p-4 lg:flex">
        <div className="mb-6 px-3 pt-2 text-lg font-semibold tracking-[0.3em]">ORIGEN<span className="mt-0.5 block text-[10px] font-normal tracking-[0.2em] text-mute">MANAGER</span></div>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {NAV.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/'} className={link}><Icon name={icon} className="size-[18px]" />{label}</NavLink>)}
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-bg/85 px-4 py-3 backdrop-blur lg:px-8">
          <span className="text-sm font-semibold tracking-[0.25em] lg:hidden">ORIGEN</span>
          <button onClick={() => setSearch(true)} className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm text-mute hover:bg-bg max-lg:w-10 max-lg:justify-center lg:w-72" aria-label="Buscar">
            <Icon name="search" className="size-4" /><span className="max-lg:hidden">Buscar</span><kbd className="ml-auto font-mono text-[10px] max-lg:hidden">⌘K</kbd>
          </button>
          <button onClick={() => forms.open('task')} className="hidden h-10 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-sm font-medium text-white hover:bg-ink/90 lg:flex"><Icon name="plus" className="size-4" />Nueva tarea</button>
          <RemindersBell />
        </div>
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-2 lg:px-8 lg:pb-16"><Outlet /></main>
      </div>

      {/* Mobile */}
      <nav aria-label="Móvil" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cx('flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px]', isActive ? 'text-accent' : 'text-mute')}>
            <Icon name={icon} className="size-5" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2 lg:hidden">
        {fab && create.map(([label, kind]) => (
          <button key={kind} onClick={() => { setFab(false); forms.open(kind) }} className="rise rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium shadow-card">{label}</button>
        ))}
        <button aria-label="Crear" aria-expanded={fab} onClick={() => setFab(f => !f)}
          className={cx('grid size-14 place-items-center rounded-full bg-accent text-white shadow-lg transition-transform', fab && 'rotate-45')}><Icon name="plus" className="size-6" /></button>
      </div>
      {search && <Search onClose={() => setSearch(false)} />}
    </div>
  )
}
