// Edge Function: envía el resumen diario de recordatorios por notificación push.
// La llama pg_cron una vez por día (ver supabase/notificaciones.sql).
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

type Row = Record<string, any>
type Msg = { title: string; body: string; url: string }

/** Lógica pura: arma el texto del resumen. Devuelve null si no hay nada que avisar. */
export function buildDigest(d: { tasks: Row[]; events: Row[]; payments: Row[]; clients: Row[] }, today: string, tomorrow: string): Msg | null {
  const name = (id: string | null) => d.clients.find(c => c.id === id)?.name ?? 'un cliente'
  const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
  const lines: string[] = []
  const late = d.tasks.filter(t => t.date < today).length
  const todays = d.tasks.filter(t => t.date === today)
  if (late) lines.push(`${late} ${late === 1 ? 'tarea atrasada' : 'tareas atrasadas'}`)
  if (todays.length) {
    const shown = todays.slice(0, 3).map(t => t.client_id ? `${t.title} (${name(t.client_id)})` : t.title).join(', ')
    lines.push(`Hoy: ${shown}${todays.length > 3 ? ` y ${todays.length - 3} más` : ''}`)
  }
  for (const e of d.events.filter(e => e.date === tomorrow)) lines.push(`Mañana: ${e.title}`)
  for (const p of d.payments) {
    const who = `${name(p.client_id)} (${money(p.amount)})`
    if (p.due_date < today) lines.push(`Cobro vencido: ${who}`)
    else if (p.due_date === today) lines.push(`Cobro vence hoy: ${who}`)
    else lines.push(`Cobro vence mañana: ${who}`)
  }
  return lines.length ? { title: 'Origen Manager', body: lines.join('\n'), url: '/#/hoy' } : null
}

const arDate = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 864e5)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) // YYYY-MM-DD
}

Deno.serve(async req => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 })
  const test = ((await req.json().catch(() => ({}))) as Row).test === true

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC')!, Deno.env.get('VAPID_PRIVATE')!)
  const today = arDate(), tomorrow = arDate(1)

  const { data: subs } = await db.from('push_subscriptions').select('*')
  const users = [...new Set((subs ?? []).map(s => s.user_id))]
  let sent = 0

  for (const u of users) {
    const [t, e, p, c] = await Promise.all([
      db.from('tasks').select('*').eq('user_id', u).eq('status', 'pendiente').lte('date', today),
      db.from('events').select('*').eq('user_id', u).eq('status', 'pendiente').eq('date', tomorrow),
      db.from('payments').select('*').eq('user_id', u).eq('status', 'pendiente').lte('due_date', tomorrow),
      db.from('clients').select('id,name').eq('user_id', u),
    ])
    const msg = test
      ? { title: 'Origen Manager', body: 'Prueba: las notificaciones funcionan.', url: '/#/hoy' }
      : buildDigest({ tasks: t.data ?? [], events: e.data ?? [], payments: p.data ?? [], clients: c.data ?? [] }, today, tomorrow)
    if (!msg) continue
    for (const s of (subs ?? []).filter(s => s.user_id === u)) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg))
        sent++
      } catch (err) {
        // Dispositivo dado de baja: limpiar la suscripción.
        if ([404, 410].includes((err as Row).statusCode)) await db.from('push_subscriptions').delete().eq('id', s.id)
      }
    }
  }
  return Response.json({ sent })
})
