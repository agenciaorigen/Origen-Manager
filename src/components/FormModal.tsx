import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'

export interface Field {
  name: string; label: string; span?: 2
  type?: 'text' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  required?: boolean; min?: number; max?: number
}
export type Values = Record<string, string | number>

interface Props {
  title: string; fields: Field[]; initial: Values
  onSubmit(v: Values): void; onDelete?(): void; onClose(): void
  /** Permite derivar campos al cambiar otro (p.ej. tipo de trabajo → workflow). */
  derive?(v: Values, changed: string): Values
}

const input = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none transition focus:border-accent'

export function FormModal({ title, fields, initial, onSubmit, onDelete, onClose, derive }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [v, setV] = useState<Values>(initial)
  useEffect(() => { ref.current?.showModal() }, [])

  const set = (name: string, raw: string) => {
    const f = fields.find(f => f.name === name)!
    const next = { ...v, [name]: f.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw }
    setV(derive ? derive(next, name) : next)
  }

  return (
    <dialog ref={ref} onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="fm-title"
      className="m-auto w-[min(32rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-card p-0 shadow-2xl max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:rounded-b-none">
      <form onSubmit={e => { e.preventDefault(); onSubmit(v) }} className="rise max-h-[85dvh] overflow-y-auto p-5">
        <h2 id="fm-title" className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <label key={f.name} className={f.span === 2 || f.type === 'textarea' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <span className="mb-1 block text-xs font-medium text-mute">{f.label}{f.required && ' *'}</span>
              {f.type === 'select' ? (
                <select className={input} value={v[f.name] ?? ''} required={f.required} onChange={e => set(f.name, e.target.value)}>
                  {f.options!.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className={input} rows={3} value={v[f.name] ?? ''} required={f.required} onChange={e => set(f.name, e.target.value)} />
              ) : (
                <input className={input} type={f.type ?? 'text'} value={v[f.name] ?? ''} required={f.required} min={f.min} max={f.max}
                  step={f.type === 'number' ? 'any' : undefined} onChange={e => set(f.name, e.target.value)} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          {onDelete && <Button variant="danger" onClick={() => confirm('¿Eliminar definitivamente?') && onDelete()}>Eliminar</Button>}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar</Button>
        </div>
      </form>
    </dialog>
  )
}
