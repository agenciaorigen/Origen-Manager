import { Empty } from './ui'
import { TaskRow } from './rows'
import { useData } from '../hooks/useData'
import { groupTasks } from '../lib/tasks'
import type { Task } from '../types'

function Group({ title, tasks, tone, showDate }: { title: string; tasks: Task[]; tone?: 'bad'; showDate?: boolean }) {
  if (!tasks.length) return null
  return (
    <div>
      <h3 className={`mb-1 mt-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] ${tone === 'bad' ? 'text-bad' : 'text-mute'}`}>
        {title}<span className="rounded-full bg-line/70 px-1.5 text-[10px]">{tasks.length}</span>
      </h3>
      <ul className="divide-y divide-line">{tasks.map(t => <TaskRow key={t.id} task={t} showDate={showDate} />)}</ul>
    </div>
  )
}

export function TaskGroups({ limitUpcoming }: { limitUpcoming?: number }) {
  const { db } = useData()
  const g = groupTasks(db.tasks)
  if (!g.late.length && !g.today.length && !g.upcoming.length) return <Empty>No hay tareas pendientes. Todo al día.</Empty>
  return (
    <div className="-mt-4">
      <Group title="Atrasadas" tasks={g.late} tone="bad" />
      <Group title="Hoy" tasks={g.today} />
      <Group title="Próximamente" tasks={g.upcoming.slice(0, limitUpcoming)} showDate />
    </div>
  )
}
