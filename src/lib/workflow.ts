import type { AgendaEvent, DB, Task } from '../types'
import { addDays } from '../utils/date'
import { uid } from '../utils/format'

/**
 * Convierte los pasos de una plantilla en tareas concretas a partir de la fecha del evento.
 * El paso con offset 0 se omite si `skipEventDay` (el evento mismo ya está en la agenda).
 */
export function tasksFromWorkflow(db: Pick<DB, 'workflow_steps'>, workflowId: string, event: AgendaEvent, skipEventDay = true): Task[] {
  return db.workflow_steps
    .filter(s => s.workflow_id === workflowId && !(skipEventDay && s.offset_days === 0))
    .sort((a, b) => a.position - b.position)
    .map(s => ({
      id: uid(), client_id: event.client_id, event_id: event.id, title: s.name,
      date: addDays(event.date, s.offset_days), time: '', priority: s.priority,
      status: 'pendiente' as const, duration_min: s.duration_min, notes: '',
    }))
}

/** Plantillas iniciales (offsets en días desde el evento). */
export const MONTHLY_NAME = 'Ciclo mensual de contenido'

export const DEFAULT_WORKFLOWS = [
  // Un solo ciclo por cliente y por mes. Día 0 = fecha de la sesión.
  { name: MONTHLY_NAME, job_type: 'Sesión de fotos' as const, steps: [
    ['Coordinar fecha, lugar y objetivo con el cliente', -3, 20, 'media'], ['Confirmar sesión y preparar equipo', -1, 30, 'alta'],
    ['Sesión de fotos y video', 0, 120, 'alta'], ['Descargar, respaldar y seleccionar el material', 1, 60, 'alta'],
    ['Editar fotos y videos', 2, 180, 'alta'], ['Enviar al cliente para aprobación', 4, 15, 'alta'],
    ['Redactar copies y hashtags', 5, 45, 'media'], ['Aplicar correcciones y programar publicaciones', 6, 60, 'media'],
    ['Publicar', 7, 15, 'alta'], ['Responder comentarios y revisar primeras métricas', 14, 30, 'media'],
    ['Armar reporte mensual con métricas', 21, 60, 'media'], ['Enviar reporte al cliente', 23, 15, 'media'],
  ] },
  { name: 'Reel', job_type: 'Reel' as const, steps: [
    ['Grabar material', 0, 90, 'alta'], ['Editar reel', 1, 120, 'alta'], ['Aprobación del cliente', 2, 15, 'media'], ['Publicar reel', 3, 15, 'alta'], ['Revisar métricas', 7, 30, 'baja'],
  ] },
] as const
