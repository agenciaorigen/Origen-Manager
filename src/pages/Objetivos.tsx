import { Card, IconButton, PageHeader, Progress } from '../components/ui'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { monthSummary } from '../lib/finance'
import { monthKey, today } from '../utils/date'
import { fmtMoney } from '../utils/format'

export default function Objetivos() {
  const { db } = useData()
  const forms = useForms()
  const s = monthSummary(db, monthKey(today()))
  const cfg = { clients: { label: 'Clientes activos', now: s.activeClients, fmt: String }, revenue: { label: 'Facturación mensual', now: s.billed, fmt: fmtMoney } }
  return (
    <>
      <PageHeader title="Objetivos" subtitle="Dónde estás y hasta dónde querés llegar" />
      <div className="grid gap-4 md:grid-cols-2">
        {db.goals.map(g => { const c = cfg[g.metric]; return (
          <Card key={g.id} className="rise p-6">
            <div className="flex items-center justify-between"><h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">{c.label}</h2><IconButton icon="edit" label={`Editar objetivo de ${c.label}`} onClick={() => forms.open('goal', { ...g })} /></div>
            <div className="mt-2 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums tracking-tight">{c.fmt(c.now)}</span><span className="text-sm text-mute">de {c.fmt(g.target)}</span></div>
            <div className="mt-4"><Progress value={c.now} max={g.target} /></div>
            <div className="mt-2 text-xs text-mute">{Math.min(100, Math.round((c.now / g.target) * 100))}% del objetivo</div>
          </Card>) })}
      </div>
    </>
  )
}
