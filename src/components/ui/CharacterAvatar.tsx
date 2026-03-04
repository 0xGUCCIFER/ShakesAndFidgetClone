import { Shield, Wand2, Sword, Cross } from 'lucide-react'
import type { CharacterClass } from '@/lib/store/types'

const classConfig: Record<CharacterClass, { icon: typeof Shield; color: string; bg: string; border: string }> = {
  warrior: { icon: Shield, color: 'text-secondary-light', bg: 'bg-secondary/20', border: 'border-red-500' },
  mage: { icon: Wand2, color: 'text-accent', bg: 'bg-accent/20', border: 'border-blue-500' },
  rogue: { icon: Sword, color: 'text-stamina', bg: 'bg-stamina/20', border: 'border-green-500' },
  paladin: { icon: Cross, color: 'text-primary', bg: 'bg-primary/20', border: 'border-yellow-500' },
}

interface CharacterAvatarProps {
  characterClass: CharacterClass
  level: number
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
}

const iconSize = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
}

export function CharacterAvatar({ characterClass, level, name, size = 'md' }: CharacterAvatarProps) {
  const config = classConfig[characterClass]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${sizeMap[size]} rounded-full ${config.bg} border-2 ${config.border} flex items-center justify-center`}>
        <Icon className={`${iconSize[size]} ${config.color}`} />
        <span className="absolute -bottom-1 -right-1 bg-bg-dark border border-primary text-primary text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {level}
        </span>
      </div>
      {size !== 'sm' && (
        <div>
          <p className="font-display text-sm font-semibold text-parchment">{name}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">{characterClass}</p>
        </div>
      )}
    </div>
  )
}
