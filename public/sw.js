// Service worker: recibe notificaciones push aunque la app esté cerrada.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  let m = {}
  try { m = e.data ? e.data.json() : {} } catch { m = { body: e.data && e.data.text() } }
  e.waitUntil(self.registration.showNotification(m.title || 'Origen Manager', {
    body: m.body || '', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: m.url || '/#/hoy' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c)
    return open ? (open.navigate(url), open.focus()) : self.clients.openWindow(url)
  }))
})
