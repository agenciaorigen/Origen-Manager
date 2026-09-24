import type { Client } from '../types'

// Colores bien distintos entre sí y legibles sobre blanco (texto blanco encima).
const PALETTE = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#b45309', '#dc2626', '#4f46e5', '#0f766e']
export const NO_CLIENT = '#6b7280'

/** Color fijo por cliente según su orden alfabético (cambia solo si se agregan clientes antes en el abecedario). */
export function clientColors(clients: Client[]) {
  const m = new Map<string, string>()
  ;[...clients].sort((a, b) => a.name.localeCompare(b.name)).forEach((c, i) => m.set(c.id, PALETTE[i % PALETTE.length]))
  return (id: string | null) => (id && m.get(id)) || NO_CLIENT
}
