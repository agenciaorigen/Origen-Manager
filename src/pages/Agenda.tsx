import { useState } from 'react'
import { Button, PageHeader, cx } from '../components/ui'
import { Calendar, type CalItem } from '../components/Calendar'
import { ClientFilter } from '../components/ClientFilter'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { clientColors } from '../lib/colors'
import { isLate } from '../lib/tasks'

export default function Agenda() {
  const { db } = useData()
  const forms = useForms()
  const [off, setOff] = useState<string[]>([])
  const [tasks, setTasks] = useState(true)
  const color = clientColors(db.clients)
  const cname = (id: string | null) => db.clients.find(c => c.id === id)?.name
  const shown = (id: string | null) => !(id && off.includes(id))
  const items: CalItem[] = [
    // Sesiones/eventos: bloque lleno con el color del cliente. Tareas: barra de color a la izquierda.
    ...db.events.filter(e => shown(e.client_id)).map(e => ({ id: e.id, date: e.date, time: e.time, label: e.title, sub: e.job_type, tone: 'accent' as const, color: color(e.client_id), solid: true, done: e.status === 'completada', onClick: () => forms.open('event', { ...e }) })),
    ...(tasks ? db.tasks.filter(t => shown(t.client_id)).map(t => ({ id: t.id, date: t.date, time: t.time, label: (isLate(t) ? '⚠ ' : '') + t.title, sub: cname(t.client_id), tone: 'neutral' as const, color: color(t.client_id), done: t.status === 'completada', onClick: () => forms.open('task', { ...t }) })) : []),
  ]
  return (
    <>
      <PageHeader title="Agenda" subtitle="Cada cliente con su color · bloque lleno = sesión o evento · barra = tarea" actions={<Button variant="primary" icon="plus" onClick={() => forms.open('event')}>Nuevo evento</Button>} />
      <div className="mb-2">
        <button aria-pressed={tasks} onClick={() => setTasks(!tasks)} className={cx('rounded-full border px-3 py-1 text-xs', tasks ? 'border-ink bg-ink text-white' : 'border-line bg-card text-mute')}>{tasks ? 'Mostrando tareas' : 'Solo sesiones y eventos'}</button>
      </div>
      <ClientFilter clients={db.clients.filter(c => c.status === 'activo')} color={color} off={off} toggle={id => setOff(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id])} />
      <Calendar items={items} onDayClick={date => forms.open('event', { date })} />
    </>
  )
}
