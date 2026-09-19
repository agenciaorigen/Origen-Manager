import type { DB, ISODate, Payment, Service } from '../types'
import { addMonths, dayOfMonth, monthKey, today } from '../utils/date'
import { uid } from '../utils/format'

export const isOverdue = (p: Payment, now: ISODate = today()) => p.status === 'pendiente' && p.due_date < now
const sum = (ps: Payment[]) => ps.reduce((a, p) => a + p.amount, 0)

/** Ingreso mensual recurrente de servicios activos (trimestral prorrateado). */
export const monthlyRecurring = (services: Service[]) =>
  services.filter(s => s.status === 'activo' && s.frequency !== 'unico')
    .reduce((a, s) => a + (s.frequency === 'trimestral' ? s.price / 3 : s.price), 0)

export function monthSummary(db: DB, key: string, now: ISODate = today()) {
  const inMonth = db.payments.filter(p => monthKey(p.due_date) === key)
  const paid = inMonth.filter(p => p.status === 'cobrado')
  const late = inMonth.filter(p => isOverdue(p, now))
  const pending = inMonth.filter(p => p.status === 'pendiente' && !isOverdue(p, now))
  const billed = sum(inMonth)
  const active = db.clients.filter(c => c.status === 'activo').length
  const projected = monthlyRecurring(db.services)
  return {
    billed, collected: sum(paid), pending: sum(pending), overdue: sum(late),
    projected, projectedYear: projected * 12, activeClients: active,
    avgTicket: active ? Math.round(projected / active) : 0,
  }
}

/** Cobros pendientes de todos los meses (para no perder deuda vieja). */
export const outstanding = (db: DB) => sum(db.payments.filter(p => p.status === 'pendiente'))

/**
 * Genera los cobros faltantes del mes para servicios activos.
 * Trimestral: sólo en meses cuya diferencia con el inicio es múltiplo de 3.
 * Idempotente: no duplica si ya existe un cobro del servicio ese mes.
 */
export function missingPayments(db: DB, key: string): Payment[] {
  return db.services.flatMap(s => {
    if (s.status !== 'activo' || s.frequency === 'unico' || monthKey(s.start_date) > key) return []
    if (s.frequency === 'trimestral') {
      const [y1, m1] = key.split('-').map(Number), [y0, m0] = monthKey(s.start_date).split('-').map(Number)
      if (((y1 - y0) * 12 + m1 - m0) % 3) return []
    }
    if (db.payments.some(p => p.service_id === s.id && monthKey(p.due_date) === key)) return []
    return [{
      id: uid(), client_id: s.client_id, service_id: s.id, amount: s.price,
      due_date: dayOfMonth(key, s.pay_day), paid_date: null, status: 'pendiente' as const, concept: s.name,
    }]
  })
}

/** Meses a cubrir: el actual y el siguiente. */
export const billingMonths = (now: ISODate = today()) => [monthKey(now), addMonths(monthKey(now), 1)]
