import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <section className={cx('rounded-2xl border border-line bg-card shadow-card', className)}>{children}</section>
)

export const Section = ({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <Card className={cx('p-5', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">{title}</h2>{action}
    </div>
    {children}
  </Card>
)

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}</div>
    <div className="flex gap-2">{actions}</div>
  </header>
)

const TONES = { neutral: 'bg-line/60 text-mute', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad', accent: 'bg-accent-soft text-accent' }
export type Tone = keyof typeof TONES
export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[tone])}>{children}</span>
)

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; icon?: IconName }
export const Button = ({ variant = 'ghost', icon, className, children, ...p }: BtnProps) => (
  <button type="button" {...p} className={cx(
    'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition active:scale-[.98] disabled:opacity-50',
    variant === 'primary' && 'bg-ink text-white hover:bg-ink/90',
    variant === 'ghost' && 'border border-line bg-card hover:bg-bg',
    variant === 'danger' && 'text-bad hover:bg-bad-soft', className)}>
    {icon && <Icon name={icon} className="size-4" />}{children}
  </button>
)

export const IconButton = ({ icon, label, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) => (
  <button type="button" aria-label={label} title={label} {...p}
    className={cx('grid size-9 place-items-center rounded-lg text-mute transition hover:bg-bg hover:text-ink', className)}>
    <Icon name={icon} className="size-4" />
  </button>
)

export const Empty = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-sm text-mute">{children}</p>

export const Progress = ({ value, max }: { value: number; max: number }) => (
  <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
    <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} />
  </div>
)

export const Stat = ({ label, value, tone }: { label: string; value: ReactNode; tone?: 'bad' | 'ok' }) => (
  <div>
    <div className="text-[11px] uppercase tracking-[0.1em] text-mute">{label}</div>
    <div className={cx('mt-1 text-xl font-semibold tabular-nums tracking-tight', tone === 'bad' && 'text-bad', tone === 'ok' && 'text-ok')}>{value}</div>
  </div>
)
