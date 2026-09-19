import { Badge, Button, Card, Empty, IconButton, PageHeader } from '../components/ui'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'

export default function Workflows() {
  const { db } = useData()
  const forms = useForms()
  return (
    <>
      <PageHeader title="Workflows" subtitle="Plantillas que generan tareas automáticamente al crear un evento" actions={<Button variant="primary" icon="plus" onClick={() => forms.open('workflow')}>Nueva plantilla</Button>} />
      {!db.workflows.length && <Card className="p-5"><Empty>No hay plantillas. Creá una o cargá los ejemplos desde Perfil.</Empty></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {db.workflows.map(w => {
          const steps = db.workflow_steps.filter(s => s.workflow_id === w.id).sort((a, b) => a.offset_days - b.offset_days || a.position - b.position)
          return (
            <Card key={w.id} className="rise p-5">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-semibold">{w.name}</h2>{w.job_type && <Badge tone="accent">{w.job_type}</Badge>}
                <div className="flex-1" />
                <IconButton icon="edit" label="Editar plantilla" onClick={() => forms.open('workflow', { ...w })} />
              </div>
              <ol className="divide-y divide-line">
                {steps.map((s, i) => (
                  <li key={s.id}><button onClick={() => forms.open('step', { ...s })} className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:text-accent">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-line/70 text-[11px]">{i + 1}</span>
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-mute">{s.duration_min} min</span>
                    <Badge tone={s.offset_days < 0 ? 'warn' : 'neutral'}>{s.offset_days === 0 ? 'Día 0' : s.offset_days > 0 ? `+${s.offset_days} d` : `${s.offset_days} d`}</Badge>
                  </button></li>
                ))}
              </ol>
              <Button className="mt-3 min-h-8 text-xs" icon="plus" onClick={() => forms.open('step', { workflow_id: w.id, position: steps.length })}>Agregar paso</Button>
            </Card>
          )
        })}
      </div>
    </>
  )
}
