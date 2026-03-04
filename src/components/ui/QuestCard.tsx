'use client'

import { useEffect, useState } from 'react'
import type { Quest, QuestDifficulty } from '@/lib/store/types'
import { Clock, Coins, Star, Swords } from 'lucide-react'
import { Button } from './Button'

const difficultyColor: Record<QuestDifficulty, string> = {
  easy: 'text-stamina',
  medium: 'text-primary',
  hard: 'text-secondary-light',
  legendary: 'text-rarity-legendary',
}

const difficultyLabel: Record<QuestDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  legendary: 'Legendary',
}

interface QuestCardProps {
  quest: Quest
  onStart?: (quest: Quest) => void
  isActive?: boolean
  endsAt?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function QuestCard({ quest, onStart, isActive, endsAt }: QuestCardProps) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!isActive || !endsAt) return

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
      setRemaining(diff)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isActive, endsAt])

  return (
    <div className="fantasy-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-display text-sm font-semibold text-parchment truncate">
              {quest.name}
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{quest.description}</p>
        </div>
        <span className={`text-xs font-display font-semibold uppercase ${difficultyColor[quest.difficulty]}`}>
          {difficultyLabel[quest.difficulty]}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-text-light">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(quest.duration_seconds)}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-xp" />
          {quest.xp_reward} XP
        </span>
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-primary" />
          {quest.gold_reward}
        </span>
      </div>

      <div className="mt-3">
        {isActive ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-bg-darkest overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: `${Math.max(0, 100 - (remaining / quest.duration_seconds) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-accent font-semibold min-w-[40px] text-right">
              {formatTime(remaining)}
            </span>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => onStart?.(quest)} className="w-full">
            Start Quest
          </Button>
        )}
      </div>
    </div>
  )
}
