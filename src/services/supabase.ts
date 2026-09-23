import { createClient } from '@supabase/supabase-js'

// Valores públicos por diseño (la seguridad la da RLS en la base). Las variables ORIGEN_* / VITE_* los pisan si existen.
const env = import.meta.env
const url = (env.ORIGEN_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? 'https://hppojidxhadigbergftz.supabase.co') as string
const key = (env.ORIGEN_SUPABASE_PUBLISHABLE ?? env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_XE8r7Wi5PgEsNob4ZxRTQQ_zK8y-ed4') as string

/** null = modo demo local (sólo si se vaciaran url y clave). */
export const supabase = url && key ? createClient(url, key) : null
