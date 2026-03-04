'use client'

import { useGameStore } from '@/lib/store/gameStore'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoldDisplay } from '@/components/ui/GoldDisplay'
import Link from 'next/link'
import { User, Backpack } from 'lucide-react'

export function Sidebar() {
  const character = useGameStore((s) => s.character)

  if (!character) {
    return (
      <aside className="hidden lg:flex flex-col w-60 shrink-0 fantasy-card p-4 gap-4">
        <div className="flex items-center justify-center h-full text-text-muted text-sm">
          No character loaded
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 fantasy-card p-4 gap-4">
      <Link href="/game/character" className="hover:opacity-90 transition-opacity">
        <CharacterAvatar
          characterClass={character.class}
          level={character.level}
          name={character.name}
        />
      </Link>

      <div className="space-y-2">
        <ProgressBar value={character.hp} max={character.max_hp} color="hp" label="HP" />
        <ProgressBar value={character.stamina} max={character.max_stamina} color="stamina" label="Stamina" />
        <ProgressBar value={character.xp} max={character.xp_to_next} color="xp" label="XP" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-bg-light">
        <GoldDisplay amount={character.gold} type="gold" />
        <GoldDisplay amount={character.gems} type="gems" />
      </div>

      <div className="mt-auto space-y-1.5">
        <Link
          href="/game/inventory"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-primary transition-colors"
        >
          <Backpack className="w-3.5 h-3.5" />
          Inventar
        </Link>
        <Link
          href="/game/character"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-primary transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Charakter
        </Link>
      </div>
    </aside>
  )
}
