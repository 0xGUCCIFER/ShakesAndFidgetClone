export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'paladin'

export interface Character {
  id: string
  user_id: string
  name: string
  class: CharacterClass
  level: number
  xp: number
  xp_to_next: number
  hp: number
  max_hp: number
  stamina: number
  max_stamina: number
  gold: number
  gems: number
  strength: number
  dexterity: number
  intelligence: number
  constitution: number
  luck: number
  guild_id: string | null
  created_at: string
  updated_at: string
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ItemSlot = 'weapon' | 'shield' | 'head' | 'chest' | 'legs' | 'boots' | 'ring' | 'amulet'

export interface ItemStats {
  strength?: number
  dexterity?: number
  intelligence?: number
  constitution?: number
  luck?: number
  damage_min?: number
  damage_max?: number
  armor?: number
}

export interface Item {
  id: string
  name: string
  slot: ItemSlot
  rarity: ItemRarity
  level_req: number
  class_req: CharacterClass | null
  stats: ItemStats
  icon: string
  sell_price: number
  buy_price: number
}

export interface InventoryItem {
  id: string
  character_id: string
  item: Item
  equipped: boolean
  slot_index: number
}

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'

export interface Quest {
  id: string
  name: string
  description: string
  difficulty: QuestDifficulty
  duration_seconds: number
  xp_reward: number
  gold_reward: number
  item_chance: number
  min_level: number
}

export interface ActiveQuest {
  id: string
  character_id: string
  quest: Quest
  started_at: string
  ends_at: string
}

export interface Guild {
  id: string
  name: string
  description: string
  leader_id: string
  member_count: number
  level: number
  created_at: string
}

export interface GuildMember {
  id: string
  guild_id: string
  character_id: string
  role: 'leader' | 'officer' | 'member'
  joined_at: string
  character?: Character
}

export interface TradeOffer {
  id: string
  seller_id: string
  item: Item
  price: number
  currency: 'gold' | 'gems'
  created_at: string
  seller_name?: string
}

export interface ArenaFight {
  id: string
  attacker_id: string
  defender_id: string
  winner_id: string
  xp_reward: number
  gold_reward: number
  rounds: ArenaRound[]
  created_at: string
}

export interface ArenaRound {
  round: number
  attacker_hp: number
  defender_hp: number
  attacker_damage: number
  defender_damage: number
}

export interface ChatMessage {
  id: string
  guild_id: string
  character_id: string
  message: string
  character_name?: string
  created_at: string
}
