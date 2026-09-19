import type { ISODate } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s: ISODate) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const today = () => toISO(new Date())
export const addDays = (s: ISODate, n: number): ISODate => { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d) }
export const diffDays = (a: ISODate, b: ISODate) => Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 864e5)
export const monthKey = (s: ISODate) => s.slice(0, 7)
export const addMonths = (key: string, n: number) => { const [y, m] = key.split('-').map(Number); return toISO(new Date(y, m - 1 + n, 1)).slice(0, 7) }
export const startOfWeek = (s: ISODate) => { const d = parseISO(s); return addDays(s, -((d.getDay() + 6) % 7)) } // lunes
/** Fecha con día `day` en el mes `key`, ajustado al último día si el mes es corto. */
export const dayOfMonth = (key: string, day: number): ISODate => {
  const [y, m] = key.split('-').map(Number)
  return `${key}-${pad(Math.min(day, new Date(y, m, 0).getDate()))}`
}

const fmt = (o: Intl.DateTimeFormatOptions) => (s: ISODate) => new Intl.DateTimeFormat('es-AR', o).format(parseISO(s))
export const fmtShort = fmt({ day: '2-digit', month: '2-digit' })
export const fmtLong = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
export const fmtMonth = (key: string) => new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(parseISO(`${key}-01`))
export const monthName = (key: string) => new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(parseISO(`${key}-01`))

export function relativeDay(s: ISODate) {
  const n = diffDays(s, today())
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Mañana'
  if (n === -1) return 'Ayer'
  return n > 0 ? `En ${n} días` : `Hace ${-n} días`
}
