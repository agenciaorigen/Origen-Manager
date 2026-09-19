import { useState } from 'react'
import { Button, Card, Empty, IconButton, PageHeader, Section, Stat } from '../components/ui'
import { PaymentRow } from '../components/rows'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { monthSummary, outstanding } from '../lib/finance'
import { addMonths, fmtMonth, monthKey, today } from '../utils/date'
import { fmtMoney } from '../utils/format'

export default function Finanzas() {
  const { db } = useData()
  const forms = useForms()
  const [key, setKey] = useState(monthKey(today()))
  const s = monthSummary(db, key)
  const prev = monthSummary(db, addMonths(key, -1))
  const rows = db.payments.filter(p => monthKey(p.due_date) === key).sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <>
      <PageHeader title="Finanzas" subtitle="Cobros y facturación calculados automáticamente" actions={<Button variant="primary" icon="plus" onClick={() => forms.open('payment')}>Nuevo cobro</Button>} />
      <div className="mb-4 flex items-center gap-1">
        <IconButton icon="left" label="Mes anterior" onClick={() => setKey(addMonths(key, -1))} />
        <span className="min-w-40 text-center font-medium first-letter:uppercase">{fmtMonth(key)}</span>
        <IconButton icon="right" label="Mes siguiente" onClick={() => setKey(addMonths(key, 1))} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Section title="Facturación"><div className="grid grid-cols-2 gap-4">
          <Stat label="Del mes" value={fmtMoney(s.billed)} /><Stat label="Mes anterior" value={fmtMoney(prev.billed)} />
          <Stat label="Proyectada" value={fmtMoney(s.projected)} /><Stat label="Anual proyectada" value={fmtMoney(s.projectedYear)} />
        </div></Section>
        <Section title="Cobros"><div className="grid grid-cols-2 gap-4">
          <Stat label="Cobrado" value={fmtMoney(s.collected)} tone="ok" /><Stat label="Pendiente" value={fmtMoney(s.pending)} />
          <Stat label="Vencido" value={fmtMoney(s.overdue)} tone={s.overdue ? 'bad' : undefined} /><Stat label="Por cobrar (total)" value={fmtMoney(outstanding(db))} />
        </div></Section>
        <Section title="Clientes"><div className="grid grid-cols-2 gap-4"><Stat label="Activos" value={s.activeClients} /><Stat label="Ticket promedio" value={fmtMoney(s.avgTicket)} /></div></Section>
      </div>
      <Card className="mt-4 p-5">
        <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-mute">Cobros de {fmtMonth(key)}</h2>
        {rows.length ? <ul className="divide-y divide-line">{rows.map(p => <PaymentRow key={p.id} p={p} />)}</ul> : <Empty>No hay cobros este mes.</Empty>}
      </Card>
    </>
  )
}
