'use client'

import type { Item, ItemRarity } from '@/lib/store/types'

const rarityBorder: Record<ItemRarity, string> = {
  common: 'border-rarity-common',
  uncommon: 'border-rarity-uncommon',
  rare: 'border-rarity-rare',
  epic: 'border-rarity-epic',
  legendary: 'border-rarity-legendary',
}

const rarityText: Record<ItemRarity, string> = {
  common: 'text-rarity-common',
  uncommon: 'text-rarity-uncommon',
  rare: 'text-rarity-rare',
  epic: 'text-rarity-epic',
  legendary: 'text-rarity-legendary',
}

const rarityLabel: Record<ItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

interface ItemTooltipProps {
  item: Item
  playerLevel?: number
}

export function ItemTooltip({ item, playerLevel }: ItemTooltipProps) {
  const statEntries = Object.entries(item.stats).filter(([, v]) => v !== undefined && v > 0)
  const meetsLevel = playerLevel === undefined || playerLevel >= item.level_req

  return (
    <div className={`w-52 fantasy-card p-3 border-2 ${rarityBorder[item.rarity]}`}>
      <p className={`font-display text-sm font-semibold ${rarityText[item.rarity]}`}>
        {item.name}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-[10px] uppercase ${rarityText[item.rarity]}`}>
          {rarityLabel[item.rarity]}
        </span>
        <span className="text-[10px] text-text-muted">{item.slot}</span>
      </div>
      <p className={`text-[10px] mt-1 ${meetsLevel ? 'text-text-muted' : 'text-secondary-light'}`}>
        Requires Level {item.level_req}
        {!meetsLevel && ' (too high)'}
      </p>

      {statEntries.length > 0 && (
        <div className="mt-2 pt-2 border-t border-bg-light space-y-0.5">
          {statEntries.map(([stat, val]) => (
            <p key={stat} className="text-xs text-stamina">
              +{val} {stat.replace('_', ' ')}
            </p>
          ))}
        </div>
      )}

      {item.class_req && (
        <p className="text-[10px] text-accent mt-2">
          {item.class_req} only
        </p>
      )}

      <p className="mt-2 pt-1 border-t border-bg-light text-xs text-primary">
        Sell: {item.sell_price} gold
      </p>
    </div>
  )
}
