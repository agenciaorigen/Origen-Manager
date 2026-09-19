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
export const DEFAULT_WORKFLOWS = [
  { name: 'Sesión de fotos', job_type: 'Sesión de fotos' as const, steps: [
    ['Coordinar y confirmar con el cliente', -2, 20, 'media'], ['Descargar y seleccionar material', 1, 60, 'alta'],
    ['Editar fotos', 1, 120, 'alta'], ['Preparar contenido y copies', 2, 60, 'media'],
    ['Programar publicaciones', 3, 30, 'media'], ['Publicar', 4, 15, 'alta'], ['Revisar métricas', 7, 30, 'baja'],
  ] },
  { name: 'Reel', job_type: 'Reel' as const, steps: [
    ['Grabar material', 0, 90, 'alta'], ['Editar reel', 1, 120, 'alta'], ['Aprobación del cliente', 2, 15, 'media'], ['Publicar reel', 3, 15, 'alta'], ['Revisar métricas', 7, 30, 'baja'],
  ] },
] as const
