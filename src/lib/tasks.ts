import type { ISODate, Priority, Task } from '../types'
import { today } from '../utils/date'

export const isLate = (t: Task, now: ISODate = today()) => t.status === 'pendiente' && t.date < now
const rank: Record<Priority, number> = { alta: 0, media: 1, baja: 2 }

/** Atrasadas primero (más antiguas arriba), luego por fecha, hora y prioridad. */
export const sortTasks = (a: Task, b: Task) =>
  a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99') || rank[a.priority] - rank[b.priority]

export function groupTasks(tasks: Task[], now: ISODate = today()) {
  const open = tasks.filter(t => t.status === 'pendiente').sort(sortTasks)
  return { late: open.filter(t => t.date < now), today: open.filter(t => t.date === now), upcoming: open.filter(t => t.date > now) }
}
