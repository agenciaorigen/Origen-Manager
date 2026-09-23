import { useEffect, useState } from 'react'
import { Button, Card, PageHeader } from '../components/ui'
import { signOut, useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { auth } from '../services/auth'
import pkg from '../../package.json'
import { disablePush, enablePush, isSubscribed, pushSupported } from '../lib/push'

function Notifications() {
  const [on, setOn] = useState<boolean | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { isSubscribed().then(setOn).catch(() => setOn(false)) }, [])
  const toggle = async () => {
    setErr('')
    try { on ? await disablePush() : await enablePush(); setOn(!on) } catch (e) { setErr((e as Error).message) }
  }
  if (!pushSupported()) return <p className="text-sm text-mute">Las notificaciones requieren Supabase configurado y un navegador compatible. En iPhone, primero agregá la app a la pantalla de inicio.</p>
  return (
    <div className="space-y-2">
      <p className="text-sm">{on ? 'Este dispositivo recibe recordatorios (tareas, sesiones y cobros).' : 'Activá los recordatorios en este dispositivo.'}</p>
      <Button onClick={toggle} disabled={on === null}>{on ? 'Desactivar notificaciones' : 'Activar notificaciones'}</Button>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
    </div>
  )
}

export default function Perfil() {
  const { session } = useAuth()
  const { seed, db } = useData()
  return (
    <>
      <PageHeader title="Perfil" />
      <Card className="max-w-lg space-y-5 p-6">
        <div><div className="text-xs text-mute">Sesión</div><div className="font-medium">{session?.email}</div></div>
        <div><div className="text-xs text-mute">Almacenamiento</div><div className="text-sm">{auth.demo ? 'Modo demo: los datos viven en este navegador. Configurá Supabase para guardarlos en la nube.' : 'Supabase (PostgreSQL)'}</div></div>
        <div><div className="text-xs text-mute">Versión</div><div className="text-sm">{pkg.version}</div></div>
        <div><div className="mb-1 text-xs text-mute">Notificaciones</div><Notifications /></div>
        <div className="flex flex-wrap gap-2">
          {!db.workflows.length || !db.clients.length ? <Button onClick={() => confirm('¿Cargar clientes y plantillas de ejemplo?') && seed()}>Cargar datos de ejemplo</Button> : null}
          <Button icon="logout" onClick={signOut}>Cerrar sesión</Button>
        </div>
      </Card>
    </>
  )
}
