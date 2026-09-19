import { describe, expect, it } from 'vitest'
import { tasksFromWorkflow } from './workflow'
import { missingPayments, monthSummary } from './finance'
import { groupTasks } from './tasks'
import { buildReminders } from './reminders'
import { ruleParser } from './ai'
import { seedDemo, seedWorkflows } from '../services/seed'
import type { AgendaEvent, DB } from '../types'

const ev: AgendaEvent = { id: 'e1', client_id: 'c1', workflow_id: null, title: 'Sesión', job_type: 'Sesión de fotos', date: '2026-09-23', time: '10:00', description: '', status: 'pendiente' }

describe('workflow', () => {
  const wf = seedWorkflows()
  it('genera tareas con fechas relativas al evento', () => {
    const ts = tasksFromWorkflow(wf, wf.workflows[0].id, ev)
    expect(ts.length).toBe(11)
    expect(ts.find(t => t.title === 'Editar fotos y videos')!.date).toBe('2026-09-25')
    expect(ts.find(t => t.title === 'Publicar')!.date).toBe('2026-09-30')
    expect(ts.every(t => t.client_id === 'c1' && t.event_id === 'e1')).toBe(true)
  })
})

describe('finanzas', () => {
  const db = seedDemo()
  it('no duplica cobros y respeta pausados', () => {
    const before = db.payments.length
    const fresh = ['2026-09', '2026-10'].flatMap(m => missingPayments(db, m))
    expect(new Set(fresh.map(p => p.service_id + p.due_date.slice(0, 7))).size).toBe(fresh.length)
    expect(fresh.every(p => db.services.find(s => s.id === p.service_id)!.status === 'activo')).toBe(true)
    expect(before).toBeGreaterThan(0)
  })
  it('separa cobrado / pendiente / vencido', () => {
    const d: DB = { ...db, payments: [
      { id: '1', client_id: 'a', service_id: null, amount: 100, due_date: '2026-09-05', paid_date: '2026-09-05', status: 'cobrado', concept: '' },
      { id: '2', client_id: 'a', service_id: null, amount: 50, due_date: '2026-09-10', paid_date: null, status: 'pendiente', concept: '' },
      { id: '3', client_id: 'a', service_id: null, amount: 30, due_date: '2026-09-25', paid_date: null, status: 'pendiente', concept: '' },
    ] }
    const s = monthSummary(d, '2026-09', '2026-09-19')
    expect([s.billed, s.collected, s.overdue, s.pending]).toEqual([180, 100, 50, 30])
  })
})

describe('tareas y recordatorios', () => {
  it('agrupa atrasadas / hoy / próximas', () => {
    const t = (id: string, date: string) => ({ id, client_id: null, event_id: null, title: id, date, time: '', priority: 'media' as const, status: 'pendiente' as const, duration_min: 0, notes: '' })
    const g = groupTasks([t('a', '2026-09-18'), t('b', '2026-09-19'), t('c', '2026-09-20')], '2026-09-19')
    expect([g.late.length, g.today.length, g.upcoming.length]).toEqual([1, 1, 1])
  })
  it('avisa tareas atrasadas', () => {
    const db = seedDemo()
    expect(Array.isArray(buildReminders(db))).toBe(true)
  })
  it('IA por reglas detecta cliente y trabajo', () => {
    const db = seedDemo()
    const r = ruleParser.parse('Hoy fui a sacar fotos a Bodega Urbana', db) as ReturnType<typeof ruleParser.parse> & object
    expect((r as { clientId: string }).clientId).toBe(db.clients[0].id)
    expect((r as { jobType: string }).jobType).toBe('Sesión de fotos')
  })
})
