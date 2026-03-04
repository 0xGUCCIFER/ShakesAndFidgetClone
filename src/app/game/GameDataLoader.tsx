'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import type { Character, InventoryItem, ActiveQuest, Item, Quest, ItemRarity, ItemSlot, QuestDifficulty } from '@/lib/store/types'

interface GameDataLoaderProps {
  profile: Record<string, unknown> | null
  character: Record<string, unknown> | null
  inventory: Record<string, unknown>[] | null
  activeQuest: Record<string, unknown> | null
}

function mapCharacter(profile: Record<string, unknown>, character: Record<string, unknown>): Character {
  return {
    id: character.id as string,
    user_id: profile.id as string,
    name: profile.display_name as string,
    class: profile.class as Character['class'],
    level: profile.level as number,
    xp: profile.xp as number,
    xp_to_next: ((profile.level as number) ?? 1) * 100,
    hp: character.current_hp as number,
    max_hp: character.max_hp as number,
    stamina: character.stamina as number,
    max_stamina: character.max_stamina as number,
    gold: profile.gold as number,
    gems: profile.gems as number,
    strength: character.strength as number,
    dexterity: character.dexterity as number,
    intelligence: character.intelligence as number,
    constitution: character.constitution as number,
    luck: character.luck as number,
    guild_id: null,
    created_at: profile.created_at as string,
    updated_at: profile.created_at as string,
  }
}

function mapItem(raw: Record<string, unknown>): Item {
  const stats = (raw.stat_bonuses ?? {}) as Record<string, number>
  return {
    id: raw.id as string,
    name: raw.name as string,
    slot: raw.slot as ItemSlot,
    rarity: raw.rarity as ItemRarity,
    level_req: raw.level_required as number,
    class_req: null,
    stats: {
      strength: stats.strength,
      dexterity: stats.dexterity,
      intelligence: stats.intelligence,
      constitution: stats.constitution,
      luck: stats.luck,
      damage_min: stats.damage_min,
      damage_max: stats.damage_max,
      armor: stats.armor,
    },
    icon: raw.icon_name as string ?? '?',
    sell_price: 0,
    buy_price: 0,
  }
}

function mapInventory(raw: Record<string, unknown>[]): InventoryItem[] {
  return raw.map((inv, i) => ({
    id: inv.id as string,
    character_id: inv.character_id as string,
    item: mapItem(inv.item as Record<string, unknown>),
    equipped: inv.equipped as boolean,
    slot_index: i,
  }))
}

function mapQuest(raw: Record<string, unknown>): Quest {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: (raw.description as string) ?? '',
    difficulty: (raw.difficulty as QuestDifficulty) ?? 'easy',
    duration_seconds: raw.duration_seconds as number,
    xp_reward: raw.xp_reward as number,
    gold_reward: raw.gold_reward as number,
    item_chance: raw.item_drop_chance as number,
    min_level: raw.min_level as number,
  }
}

function mapActiveQuest(raw: Record<string, unknown>): ActiveQuest {
  return {
    id: raw.id as string,
    character_id: raw.character_id as string,
    quest: mapQuest(raw.quest as Record<string, unknown>),
    started_at: raw.started_at as string,
    ends_at: raw.completes_at as string,
  }
}

export function GameDataLoader({ profile, character, inventory, activeQuest }: GameDataLoaderProps) {
  const setCharacter = useGameStore((s) => s.setCharacter)
  const setInventory = useGameStore((s) => s.setInventory)
  const setActiveQuest = useGameStore((s) => s.setActiveQuest)

  useEffect(() => {
    if (profile && character) {
      setCharacter(mapCharacter(profile, character))
    }
    if (inventory) {
      setInventory(mapInventory(inventory))
    }
    if (activeQuest) {
      setActiveQuest(mapActiveQuest(activeQuest))
    } else {
      setActiveQuest(null)
    }
  }, [profile, character, inventory, activeQuest, setCharacter, setInventory, setActiveQuest])

  return null
}
