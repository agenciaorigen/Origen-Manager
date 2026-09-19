import type { DB, ISODate } from '../types'
import { diffDays, today } from '../utils/date'
import { fmtMoney } from '../utils/format'
import { isOverdue } from './finance'
import { isLate } from './tasks'

export interface Reminder { id: string; level: 'info' | 'warn' | 'alert'; text: string; link?: string }

/** Canal de entrega. Hoy sólo existe "in-app"; agregar WhatsApp/Email/Telegram = implementar esta interfaz. */
export interface ReminderChannel { name: string; send(r: Reminder): Promise<void> | void }
export const channels: ReminderChannel[] = [] // p.ej. browserNotification, whatsapp, email, telegram

export function buildReminders(db: DB, now: ISODate = today()): Reminder[] {
  const name = (id: string | null) => db.clients.find(c => c.id === id)?.name ?? 'un cliente'
  const out: Reminder[] = []
  const late = db.tasks.filter(t => isLate(t, now)).length
  if (late) out.push({ id: 'late', level: 'alert', text: `Tenés ${late} ${late === 1 ? 'tarea atrasada' : 'tareas atrasadas'}.`, link: '/hoy' })
  for (const e of db.events.filter(e => e.status === 'pendiente' && diffDays(e.date, now) === 1))
    out.push({ id: `ev-${e.id}`, level: 'info', text: `Tenés ${e.job_type.toLowerCase()} con ${name(e.client_id)} mañana.`, link: '/agenda' })
  for (const t of db.tasks.filter(t => t.status === 'pendiente' && t.date === now))
    out.push({ id: `t-${t.id}`, level: 'info', text: `Hoy: ${t.title} — ${name(t.client_id)}.`, link: '/hoy' })
  for (const p of db.payments.filter(p => p.status === 'pendiente')) {
    const d = diffDays(p.due_date, now)
    if (isOverdue(p, now)) out.push({ id: `p-${p.id}`, level: 'alert', text: `Cobro vencido: ${name(p.client_id)} (${fmtMoney(p.amount)}).`, link: '/finanzas' })
    else if (d <= 1) out.push({ id: `p-${p.id}`, level: 'warn', text: `El pago de ${name(p.client_id)} vence ${d === 0 ? 'hoy' : 'mañana'}.`, link: '/finanzas' })
  }
  return out
}
