import { createClient } from '@supabase/supabase-js'

// Acepta ORIGEN_* (recomendado en Vercel) o VITE_* (uso local).
const env = import.meta.env
const url = (env.ORIGEN_SUPABASE_URL ?? env.VITE_SUPABASE_URL) as string | undefined
const key = (env.ORIGEN_SUPABASE_PUBLISHABLE ?? env.VITE_SUPABASE_ANON_KEY) as string | undefined

/** null = modo demo local (sin Supabase configurado). */
export const supabase = url && key ? createClient(url, key) : null
