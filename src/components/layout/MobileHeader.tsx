'use client'

import { useGameStore } from '@/lib/store/gameStore'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { GoldDisplay } from '@/components/ui/GoldDisplay'

export function MobileHeader() {
  const character = useGameStore((s) => s.character)

  if (!character) return null

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-2 bg-bg-dark/95 backdrop-blur border-b border-bg-light">
      <CharacterAvatar
        characterClass={character.class}
        level={character.level}
        name={character.name}
        size="sm"
      />
      <div className="flex items-center gap-3">
        <GoldDisplay amount={character.gold} type="gold" />
        <GoldDisplay amount={character.gems} type="gems" />
      </div>
    </header>
  )
}
