// Edge Function: envía el resumen diario de recordatorios por notificación push.
// La llama pg_cron una vez por día (ver supabase/notificaciones.sql).
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

type Row = Record<string, any>
type Msg = { title: string; body: string; url: string }

/** Lógica pura: arma el texto del resumen. Devuelve null si no hay nada que avisar. */
export function buildDigest(d: { tasks: Row[]; events: Row[]; payments: Row[]; clients: Row[]; unscheduled?: number }, today: string, tomorrow: string): Msg | null {
  const name = (id: string | null) => d.clients.find(c => c.id === id)?.name ?? 'un cliente'
  const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
  const lines: string[] = []
  const at = (e: Row) => (e.time ? ` ${String(e.time).slice(0, 5)}` : '')
  for (const e of d.events.filter(e => e.date === today)) lines.push(`Hoy${at(e)}: ${e.title}`)
  const late = d.tasks.filter(t => t.date < today).length
  const todays = d.tasks.filter(t => t.date === today)
  if (late) lines.push(`${late} ${late === 1 ? 'tarea atrasada' : 'tareas atrasadas'}`)
  if (todays.length) {
    const shown = todays.slice(0, 3).map(t => t.client_id ? `${t.title} (${name(t.client_id)})` : t.title).join(', ')
    lines.push(`Hoy: ${shown}${todays.length > 3 ? ` y ${todays.length - 3} más` : ''}`)
  }
  for (const e of d.events.filter(e => e.date === tomorrow)) lines.push(`Mañana${at(e)}: ${e.title}`)
  if (d.unscheduled) lines.push(`Falta agendar ${d.unscheduled} ${d.unscheduled === 1 ? 'cliente' : 'clientes'} este mes`)
  for (const p of d.payments) {
    const who = `${name(p.client_id)} (${money(p.amount)})`
    if (p.due_date < today) lines.push(`Cobro vencido: ${who}`)
    else if (p.due_date === today) lines.push(`Cobro vence hoy: ${who}`)
    else lines.push(`Cobro vence mañana: ${who}`)
  }
  return lines.length ? { title: 'Origen Manager', body: lines.join('\n'), url: '/#/' } : null
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
  const today = arDate(), tomorrow = arDate(1), month = today.slice(0, 7)
  const [y, m] = month.split('-').map(Number), nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

  const { data: subs } = await db.from('push_subscriptions').select('*')
  const users = [...new Set((subs ?? []).map(s => s.user_id))]
  let sent = 0

  for (const u of users) {
    const [t, e, p, c] = await Promise.all([
      db.from('tasks').select('*').eq('user_id', u).eq('status', 'pendiente').lte('date', today),
      db.from('events').select('*').eq('user_id', u).eq('status', 'pendiente').gte('date', today).lte('date', tomorrow),
      db.from('payments').select('*').eq('user_id', u).eq('status', 'pendiente').lte('due_date', tomorrow),
      db.from('clients').select('id,name,status').eq('user_id', u),
    ])
    // Clientes activos sin sesión del "Ciclo mensual de contenido" este mes.
    const wf = (await db.from('workflows').select('id').eq('user_id', u).eq('name', 'Ciclo mensual de contenido').limit(1)).data?.[0]?.id
    let unscheduled = 0
    if (wf) {
      const ev = (await db.from('events').select('client_id').eq('user_id', u).eq('workflow_id', wf).gte('date', `${month}-01`).lt('date', nextMonth)).data ?? []
      const done = new Set(ev.map(x => x.client_id))
      unscheduled = (c.data ?? []).filter(x => x.status === 'activo' && !done.has(x.id)).length
    }
    const msg = test
      ? { title: 'Origen Manager', body: 'Prueba: las notificaciones funcionan.', url: '/#/' }
      : buildDigest({ tasks: t.data ?? [], events: e.data ?? [], payments: p.data ?? [], clients: c.data ?? [], unscheduled }, today, tomorrow)
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
