'use client'
import React from 'react'

export const Tag = ({ color, children }: { color: 'green'|'purple'|'amber'|'red'|'gray'; children: React.ReactNode }) => {
  const styles: Record<string, string> = {
    green:  'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]',
    purple: 'bg-[var(--purple-dim)] text-[var(--purple)] border border-[var(--purple)]',
    amber:  'bg-[var(--amber-dim)] text-[var(--amber)] border border-[var(--amber)]',
    red:    'bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)]',
    gray:   'bg-[var(--gray2)] text-[var(--text2)] border border-[var(--border)]',
  }
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 tracking-wide uppercase ${styles[color]}`}>
      {children}
    </span>
  )
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] text-[var(--green)] tracking-[0.15em] uppercase mb-2">{children}</div>
)

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[var(--gray)] border border-[var(--border)] ${className}`}>{children}</div>
)

export const MetricCard = ({
  label, value, sub, color = 'white'
}: { label: string; value: string; sub?: string; color?: 'white'|'green'|'red'|'amber'|'purple' }) => {
  const colors = { white: 'text-[var(--white)]', green: 'text-[var(--green)]', red: 'text-[var(--red)]', amber: 'text-[var(--amber)]', purple: 'text-[var(--purple)]' }
  return (
    <div className="bg-[var(--gray2)] p-3 border border-[var(--border)]">
      <div className="text-[10px] text-[var(--text2)] tracking-wide uppercase mb-1">{label}</div>
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--text2)] mt-1">{sub}</div>}
    </div>
  )
}

export const SliderRow = ({
  label, value, min, max, step = 1, onChange, display
}: {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; display?: string
}) => (
  <div className="mb-3">
    <div className="flex justify-between text-[11px] mb-1">
      <span className="text-[var(--text2)]">{label}</span>
      <span className="text-[var(--white)]">{display ?? value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))} />
  </div>
)

export const NumberInput = ({
  label, value, onChange, prefix = ''
}: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) => (
  <div className="mb-2">
    <div className="text-[10px] text-[var(--text2)] mb-1">{label}</div>
    <div className="flex items-center gap-1">
      {prefix && <span className="text-[var(--text2)] text-[11px]">{prefix}</span>}
      <input type="number" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="bg-[var(--gray2)] border border-[var(--border)] text-[var(--white)] px-2 py-1 text-[11px] w-full outline-none focus:border-[var(--green)]" />
    </div>
  </div>
)

export const Divider = () => <div className="h-px bg-[var(--border)] my-4" />

export const WinBadge = ({ won }: { won: boolean }) => (
  <span className={`text-[10px] px-2 py-0.5 ${won ? 'bg-[var(--green-dim)] text-[var(--green)]' : 'bg-[var(--red-dim)] text-[var(--red)]'}`}>
    {won ? 'WIN' : 'LOSE'}
  </span>
)
