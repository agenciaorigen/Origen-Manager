export type ID = string
export type ISODate = string // YYYY-MM-DD

export type ClientStatus = 'activo' | 'pausado' | 'pendiente' | 'baja'
export type Priority = 'alta' | 'media' | 'baja'
export type TaskStatus = 'pendiente' | 'completada'
export type PaymentStatus = 'pendiente' | 'cobrado'
export type Frequency = 'mensual' | 'trimestral' | 'unico'

export const JOB_TYPES = [
  'Sesión de fotos', 'Grabación', 'Edición', 'Diseño', 'Reel', 'Publicación',
  'Reunión', 'Entrega', 'Gestión de redes', 'Otro',
] as const
export type JobType = (typeof JOB_TYPES)[number]

export interface Client {
  id: ID; name: string; company: string; phone: string; email: string
  instagram: string; address: string; notes: string; status: ClientStatus
  sessions_month: number; posts_month: number; reels_month: number
  stories_month: number; other_deliverables: string
  session_week?: number | null; session_weekday?: number | null; session_time?: string | null // preferencia de sesión mensual
}
export interface Service {
  id: ID; client_id: ID; name: string; price: number; frequency: Frequency
  start_date: ISODate; pay_day: number; status: ClientStatus
}
export interface Payment {
  id: ID; client_id: ID; service_id: ID | null; amount: number
  due_date: ISODate; paid_date: ISODate | null; status: PaymentStatus; concept: string
}
export interface Task {
  id: ID; client_id: ID | null; event_id: ID | null; title: string
  date: ISODate; time: string; priority: Priority; status: TaskStatus
  duration_min: number; notes: string
}
export interface AgendaEvent {
  id: ID; client_id: ID | null; workflow_id: ID | null; title: string
  job_type: JobType; date: ISODate; time: string; description: string
  status: TaskStatus
}
export interface Workflow { id: ID; name: string; job_type: JobType | null }
export interface WorkflowStep {
  id: ID; workflow_id: ID; position: number; name: string
  offset_days: number; duration_min: number; priority: Priority
}
export interface Content {
  id: ID; client_id: ID; kind: 'Reel' | 'Post' | 'Historia' | 'Otro'
  title: string; date: ISODate; status: 'planificado' | 'publicado'
}
export interface Note { id: ID; client_id: ID | null; body: string; created_at: string }
export interface Goal { id: ID; metric: 'clients' | 'revenue'; target: number }

export interface Tables {
  clients: Client; services: Service; payments: Payment; tasks: Task
  events: AgendaEvent; workflows: Workflow; workflow_steps: WorkflowStep
  contents: Content; notes: Note; goals: Goal
}
export type TableName = keyof Tables
/** Orden válido para insertar (respeta claves foráneas). */
export const TABLES: TableName[] = [
  'clients', 'workflows', 'workflow_steps', 'services', 'events',
  'tasks', 'payments', 'contents', 'notes', 'goals',
]
export type DB = { [K in TableName]: Tables[K][] }
