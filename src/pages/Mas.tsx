import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { Card, PageHeader } from '../components/ui'

const ITEMS: [string, string, IconName][] = [['/mensual', 'Contenido del mes', 'check'], ['/contenido', 'Calendario de contenido', 'grid'], ['/workflows', 'Workflows', 'flow'], ['/objetivos', 'Objetivos', 'target'], ['/perfil', 'Perfil', 'user']]

export default function Mas() {
  return (
    <>
      <PageHeader title="Más" />
      <Card className="divide-y divide-line">
        {ITEMS.map(([to, label, icon]) => <Link key={to} to={to} className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-bg"><Icon name={icon} />{label}<Icon name="right" className="ml-auto size-4 text-mute" /></Link>)}
      </Card>
    </>
  )
}
