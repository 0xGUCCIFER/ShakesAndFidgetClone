import type { ReactNode } from 'react'

interface StatBlockProps {
  icon: ReactNode
  label: string
  value: number
  bonus?: number
}

export function StatBlock({ icon, label, value, bonus }: StatBlockProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-bg-darkest/50">
      <span className="text-primary shrink-0">{icon}</span>
      <span className="text-xs text-text-muted uppercase tracking-wider min-w-[32px]">{label}</span>
      <span className="text-sm font-semibold text-parchment ml-auto">{value}</span>
      {bonus !== undefined && bonus > 0 && (
        <span className="text-xs text-stamina">+{bonus}</span>
      )}
    </div>
  )
}
