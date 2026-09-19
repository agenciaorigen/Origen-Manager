import { Button, PageHeader } from '../components/ui'
import { Calendar, type CalItem } from '../components/Calendar'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { isLate } from '../lib/tasks'

export default function Agenda() {
  const { db } = useData()
  const forms = useForms()
  const cname = (id: string | null) => db.clients.find(c => c.id === id)?.name
  const items: CalItem[] = [
    ...db.events.map(e => ({ id: e.id, date: e.date, time: e.time, label: e.title, sub: e.job_type, tone: 'accent' as const, done: e.status === 'completada', onClick: () => forms.open('event', { ...e }) })),
    ...db.tasks.map(t => ({ id: t.id, date: t.date, time: t.time, label: t.title, sub: cname(t.client_id), tone: isLate(t) ? 'bad' as const : 'neutral' as const, done: t.status === 'completada', onClick: () => forms.open('task', { ...t }) })),
  ]
  return (
    <>
      <PageHeader title="Agenda" subtitle="Eventos y tareas · tocá un día para crear un evento" actions={<Button variant="primary" icon="plus" onClick={() => forms.open('event')}>Nuevo evento</Button>} />
      <Calendar items={items} onDayClick={date => forms.open('event', { date })} />
    </>
  )
}
