import { Button, Card, PageHeader } from '../components/ui'
import { TaskGroups } from '../components/TaskGroups'
import { useData } from '../hooks/useData'
import { useForms } from '../hooks/useForms'
import { groupTasks } from '../lib/tasks'
import { fmtLong, today } from '../utils/date'

export default function Hoy() {
  const { db } = useData()
  const forms = useForms()
  const g = groupTasks(db.tasks)
  return (
    <>
      <PageHeader title="Hoy" subtitle={`${fmtLong(today())} · ${g.late.length} atrasadas · ${g.today.length} para hoy`}
        actions={<Button variant="primary" icon="plus" onClick={() => forms.open('task')}>Nueva tarea</Button>} />
      <Card className="p-5"><TaskGroups /></Card>
    </>
  )
}
