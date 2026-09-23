import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { DataProvider, useData } from './hooks/useData'
import { FormsProvider } from './hooks/useForms'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hoy from './pages/Hoy'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Finanzas from './pages/Finanzas'
import Agenda from './pages/Agenda'
import Contenido from './pages/Contenido'
import Workflows from './pages/Workflows'
import Objetivos from './pages/Objetivos'
import Perfil from './pages/Perfil'
import Mas from './pages/Mas'
import Mensual from './pages/Mensual'

function Gate() {
  const { session, ready } = useAuth()
  if (!ready) return null
  if (!session) return <Login />
  return <DataProvider><Private /></DataProvider>
}

function Private() {
  const { loading, error } = useData()
  if (error && loading) return <p role="alert" className="p-8 text-bad">Error de base de datos: {error}</p>
  if (loading) return <p className="p-8 text-sm text-mute">Cargando…</p>
  return (
    <FormsProvider>
      {error && <p role="alert" className="bg-bad-soft px-4 py-2 text-center text-sm text-bad">{error}</p>}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Hoy />} />
          <Route path="hoy" element={<Navigate to="/" replace />} />
          <Route path="resumen" element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="mensual" element={<Mensual />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="contenido" element={<Contenido />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="objetivos" element={<Objetivos />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="mas" element={<Mas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FormsProvider>
  )
}

export default function App() {
  return <HashRouter><AuthProvider><Gate /></AuthProvider></HashRouter>
}
