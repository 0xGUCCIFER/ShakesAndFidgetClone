'use client'

import { useState } from 'react'
import type { Item, ItemRarity } from '@/lib/store/types'

const rarityBorder: Record<ItemRarity, string> = {
  common: 'border-rarity-common',
  uncommon: 'border-rarity-uncommon',
  rare: 'border-rarity-rare',
  epic: 'border-rarity-epic',
  legendary: 'border-rarity-legendary',
}

const rarityGlow: Record<ItemRarity, string> = {
  common: 'glow-common',
  uncommon: 'glow-uncommon',
  rare: 'glow-rare',
  epic: 'glow-epic',
  legendary: 'glow-legendary',
}

const rarityText: Record<ItemRarity, string> = {
  common: 'text-rarity-common',
  uncommon: 'text-rarity-uncommon',
  rare: 'text-rarity-rare',
  epic: 'text-rarity-epic',
  legendary: 'text-rarity-legendary',
}

interface ItemCardProps {
  item: Item
  onClick?: (item: Item) => void
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const statEntries = Object.entries(item.stats).filter(([, v]) => v !== undefined && v > 0)

  return (
    <div
      className={`relative cursor-pointer transition-transform hover:scale-105`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick?.(item)}
    >
      <div
        className={`w-14 h-14 flex items-center justify-center rounded border-2 ${rarityBorder[item.rarity]} ${rarityGlow[item.rarity]} bg-bg-dark`}
      >
        <span className="text-2xl">{item.icon}</span>
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 fantasy-card p-3 pointer-events-none">
          <p className={`font-display text-sm font-semibold ${rarityText[item.rarity]}`}>
            {item.name}
          </p>
          <p className="text-[10px] text-text-muted uppercase mt-0.5">
            {item.slot} &middot; Lvl {item.level_req}
          </p>
          {statEntries.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {statEntries.map(([stat, val]) => (
                <p key={stat} className="text-xs text-stamina">
                  +{val} {stat.replace('_', ' ')}
                </p>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-primary">{item.sell_price} gold</p>
        </div>
      )}
    </div>
  )
}
