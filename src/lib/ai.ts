import type { Client, DB, JobType } from '../types'
import { JOB_TYPES } from '../types'

/** Resultado de interpretar una nota libre ("Hoy fui a sacar fotos a Bodega Urbana"). */
export interface Intent { clientId: string | null; jobType: JobType | null; suggestedWorkflowId: string | null }

/** Contrato para conectar una IA real (Claude, etc.) más adelante sin tocar la UI. */
export interface IntentParser { parse(text: string, db: Pick<DB, 'clients' | 'workflows'>): Promise<Intent> | Intent }

const KEYWORDS: [RegExp, JobType][] = [
  [/foto|sesi[oó]n/i, 'Sesión de fotos'], [/reel/i, 'Reel'], [/grab/i, 'Grabación'],
  [/edit/i, 'Edición'], [/reuni[oó]n/i, 'Reunión'], [/entreg/i, 'Entrega'],
]

/** Implementación mínima por reglas; reemplazable por un parser con IA. */
export const ruleParser: IntentParser = {
  parse(text, db) {
    const t = text.toLowerCase()
    const client: Client | undefined = db.clients.find(c => t.includes(c.name.toLowerCase()))
    const jobType = KEYWORDS.find(([re]) => re.test(text))?.[1] ?? JOB_TYPES.find(j => t.includes(j.toLowerCase())) ?? null
    const wf = db.workflows.find(w => w.job_type === jobType)
    return { clientId: client?.id ?? null, jobType, suggestedWorkflowId: wf?.id ?? null }
  },
}
