'use client'

import { motion } from 'framer-motion'

type BarColor = 'hp' | 'xp' | 'stamina'

const colorMap: Record<BarColor, string> = {
  hp: 'bg-hp',
  xp: 'bg-xp',
  stamina: 'bg-stamina',
}

const glowMap: Record<BarColor, string> = {
  hp: 'shadow-[0_0_6px_rgba(192,57,43,0.5)]',
  xp: 'shadow-[0_0_6px_rgba(41,128,185,0.5)]',
  stamina: 'shadow-[0_0_6px_rgba(39,174,96,0.5)]',
}

interface ProgressBarProps {
  value: number
  max: number
  color: BarColor
  label?: string
  showText?: boolean
}

export function ProgressBar({ value, max, color, label, showText = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-display text-text-muted uppercase tracking-wider">{label}</span>
          {showText && (
            <span className="text-xs text-parchment">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="relative h-4 rounded-sm overflow-hidden bg-bg-darkest border border-bg-light">
        <motion.div
          className={`h-full ${colorMap[color]} ${glowMap[color]} rounded-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {showText && !label && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-md">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  )
}
