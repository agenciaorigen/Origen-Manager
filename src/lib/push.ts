import { supabase } from '../services/supabase'

const VAPID = import.meta.env.ORIGEN_VAPID_PUBLIC as string | undefined

export const pushSupported = () =>
  !!supabase && !!VAPID && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const toKey = (s: string) => {
  const b64 = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export const isSubscribed = async () => !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription())

export async function enablePush() {
  if ((await Notification.requestPermission()) !== 'granted')
    throw new Error('Permiso denegado. Habilitá las notificaciones para este sitio en los ajustes del navegador.')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID!) as BufferSource }))
  const j = sub.toJSON()
  const { error } = await supabase!.from('push_subscriptions').upsert({ endpoint: j.endpoint, p256dh: j.keys!.p256dh, auth: j.keys!.auth }, { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)
  await reg.showNotification('Origen Manager', { body: 'Las notificaciones están activas en este dispositivo.', icon: '/icon-192.png' })
}

export async function disablePush() {
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
  if (!sub) return
  await supabase!.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}
