import { Button, Card, PageHeader } from '../components/ui'
import { signOut, useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { auth } from '../services/auth'

export default function Perfil() {
  const { session } = useAuth()
  const { seed, db } = useData()
  return (
    <>
      <PageHeader title="Perfil" />
      <Card className="max-w-lg space-y-4 p-6">
        <div><div className="text-xs text-mute">Sesión</div><div className="font-medium">{session?.email}</div></div>
        <div><div className="text-xs text-mute">Almacenamiento</div><div className="text-sm">{auth.demo ? 'Modo demo: los datos viven en este navegador. Configurá Supabase para guardarlos en la nube.' : 'Supabase (PostgreSQL)'}</div></div>
        <div className="flex flex-wrap gap-2">
          {!db.workflows.length || !db.clients.length ? <Button onClick={() => confirm('¿Cargar clientes y plantillas de ejemplo?') && seed()}>Cargar datos de ejemplo</Button> : null}
          <Button icon="logout" onClick={signOut}>Cerrar sesión</Button>
        </div>
      </Card>
    </>
  )
}
