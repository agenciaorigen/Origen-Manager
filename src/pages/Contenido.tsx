import { useState } from 'react'
import { Button, PageHeader, cx } from '../components/ui'
import { Calendar, type CalItem } from '../components/Calendar'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'

const KINDS = ['Sesiones', 'Reels', 'Posts', 'Historias', 'Entregas', 'Reuniones', 'Tareas'] as const

export default function Contenido() {
  const { db } = useData()
  const forms = useForms()
  const [off, setOff] = useState<string[]>([])
  const cname = (id: string | null) => db.clients.find(c => c.id === id)?.name
  const evKind = (t: string) => t === 'Sesión de fotos' || t === 'Grabación' ? 'Sesiones' : t === 'Reel' ? 'Reels' : t === 'Publicación' ? 'Posts' : t === 'Entrega' ? 'Entregas' : t === 'Reunión' ? 'Reuniones' : null
  const cKind = (k: string) => (k === 'Reel' ? 'Reels' : k === 'Historia' ? 'Historias' : 'Posts')

  const all: (CalItem & { kind: string })[] = [
    ...db.contents.map(x => ({ id: x.id, kind: cKind(x.kind), date: x.date, time: '', label: x.title, sub: cname(x.client_id), tone: 'ok' as const, done: x.status === 'publicado', onClick: () => forms.open('content', { ...x }) })),
    ...db.events.flatMap(e => { const k = evKind(e.job_type); return k ? [{ id: e.id, kind: k, date: e.date, time: e.time, label: e.title, sub: cname(e.client_id), tone: 'accent' as const, done: e.status === 'completada', onClick: () => forms.open('event', { ...e }) }] : [] }),
    ...db.tasks.map(t => ({ id: t.id, kind: 'Tareas', date: t.date, time: t.time, label: t.title, sub: cname(t.client_id), tone: 'neutral' as const, done: t.status === 'completada', onClick: () => forms.open('task', { ...t }) })),
  ]
  return (
    <>
      <PageHeader title="Calendario de contenido" subtitle="Todo lo que se produce y publica, por cliente" actions={<Button variant="primary" icon="plus" onClick={() => forms.open('content')}>Nuevo contenido</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {KINDS.map(k => <button key={k} aria-pressed={!off.includes(k)} onClick={() => setOff(o => o.includes(k) ? o.filter(x => x !== k) : [...o, k])}
          className={cx('rounded-full border px-3 py-1 text-xs', off.includes(k) ? 'border-line bg-card text-mute line-through' : 'border-ink bg-ink text-white')}>{k}</button>)}
      </div>
      <Calendar items={all.filter(i => !off.includes(i.kind))} onDayClick={date => forms.open('content', { date })} />
    </>
  )
}
