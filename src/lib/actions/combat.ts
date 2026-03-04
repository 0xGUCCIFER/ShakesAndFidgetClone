'use server'

import { createClient } from '@/lib/supabase/server'
import { Json } from '@/lib/supabase/types'

interface FightTurn {
  attacker: string
  damage: number
  critical: boolean
  hp_remaining: { attacker: number; defender: number }
}

interface FighterStats {
  characterId: string
  displayName: string
  strength: number
  dexterity: number
  intelligence: number
  constitution: number
  luck: number
  maxHp: number
  weaponBonus: number
  armorBonus: number
  characterClass: string
}

function calculateEffectiveStats(
  character: {
    id: string
    strength: number
    dexterity: number
    intelligence: number
    constitution: number
    luck: number
    max_hp: number
  },
  profile: { display_name: string; class: string },
  equippedItems: Array<{ items: { stat_bonuses: Json } | null }>
): FighterStats {
  let weaponBonus = 0
  let armorBonus = 0
  let str = character.strength
  let dex = character.dexterity
  let int = character.intelligence
  let con = character.constitution
  let lck = character.luck

  for (const inv of equippedItems) {
    if (!inv.items?.stat_bonuses) continue
    const bonuses = inv.items.stat_bonuses as Record<string, number>
    str += bonuses.strength || 0
    dex += bonuses.dexterity || 0
    int += bonuses.intelligence || 0
    con += bonuses.constitution || 0
    lck += bonuses.luck || 0
    weaponBonus += bonuses.damage || 0
    armorBonus += bonuses.armor || 0
  }

  return {
    characterId: character.id,
    displayName: profile.display_name,
    strength: str,
    dexterity: dex,
    intelligence: int,
    constitution: con,
    luck: lck,
    maxHp: character.max_hp,
    weaponBonus,
    armorBonus,
    characterClass: profile.class,
  }
}

function simulateFight(attacker: FighterStats, defender: FighterStats) {
  let attackerHp = attacker.maxHp
  let defenderHp = defender.maxHp
  const log: FightTurn[] = []

  // Turn order by speed (dexterity) - higher dex goes first
  let first = attacker
  let second = defender
  let firstHp = attackerHp
  let secondHp = defenderHp
  let firstIsAttacker = true

  if (defender.dexterity > attacker.dexterity) {
    first = defender
    second = attacker
    firstHp = defenderHp
    secondHp = attackerHp
    firstIsAttacker = false
  }

  while (attackerHp > 0 && defenderHp > 0) {
    // First fighter attacks
    const dmg1 = calculateDamage(first, second)
    secondHp = Math.max(0, secondHp - dmg1.damage)
    if (firstIsAttacker) {
      defenderHp = secondHp
    } else {
      attackerHp = secondHp
    }

    log.push({
      attacker: first.displayName,
      damage: dmg1.damage,
      critical: dmg1.critical,
      hp_remaining: { attacker: attackerHp, defender: defenderHp },
    })

    if (secondHp <= 0) break

    // Second fighter attacks
    const dmg2 = calculateDamage(second, first)
    firstHp = Math.max(0, firstHp - dmg2.damage)
    if (firstIsAttacker) {
      attackerHp = firstHp
    } else {
      defenderHp = firstHp
    }

    log.push({
      attacker: second.displayName,
      damage: dmg2.damage,
      critical: dmg2.critical,
      hp_remaining: { attacker: attackerHp, defender: defenderHp },
    })
  }

  const winnerId = attackerHp > 0 ? attacker.characterId : defender.characterId
  return { winnerId, log }
}

function calculateDamage(
  attacker: FighterStats,
  defender: FighterStats
): { damage: number; critical: boolean } {
  // Base damage = (strength * 1.5 + weapon_bonus) * random(0.8, 1.2)
  const randomMultiplier = 0.8 + Math.random() * 0.4
  let baseDamage = (attacker.strength * 1.5 + attacker.weaponBonus) * randomMultiplier

  // Mage bonus: intelligence * 0.8 added to damage
  if (attacker.characterClass === 'mage') {
    baseDamage += attacker.intelligence * 0.8
  }

  // Critical hit: luck% chance for 2x damage
  const critical = Math.random() * 100 < attacker.luck
  if (critical) {
    baseDamage *= 2
  }

  // Defense = defender_constitution * 0.5 + armor_bonus
  const defense = defender.constitution * 0.5 + defender.armorBonus

  const finalDamage = Math.max(1, Math.floor(baseDamage - defense))
  return { damage: finalDamage, critical }
}

export async function getArenaOpponents() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: myRanking } = await supabase
    .from('arena_rankings')
    .select('honor_points')
    .eq('character_id', character.id)
    .single()

  const myHonor = myRanking?.honor_points ?? 1000

  // Get 3 random opponents within +/- 200 honor points
  const { data: opponents, error } = await supabase
    .from('arena_rankings')
    .select('*, characters(*, profiles(*))')
    .neq('character_id', character.id)
    .gte('honor_points', myHonor - 200)
    .lte('honor_points', myHonor + 200)
    .limit(10)

  if (error) return { error: error.message }

  // Shuffle and pick 3
  const shuffled = (opponents || []).sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 3)

  return { data: selected }
}

export async function fight(defenderId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  // Get attacker data
  const { data: attackerChar } = await supabase
    .from('characters')
    .select('*, profiles(*)')
    .eq('profile_id', session.user.id)
    .single()

  if (!attackerChar) return { error: 'Character not found' }

  // Get defender data
  const { data: defenderChar } = await supabase
    .from('characters')
    .select('*, profiles(*)')
    .eq('id', defenderId)
    .single()

  if (!defenderChar) return { error: 'Opponent not found' }

  if (attackerChar.id === defenderId) return { error: 'Cannot fight yourself' }

  // Get equipped items for both
  const [attackerEquip, defenderEquip] = await Promise.all([
    supabase
      .from('inventory')
      .select('*, items(*)')
      .eq('character_id', attackerChar.id)
      .eq('equipped', true),
    supabase
      .from('inventory')
      .select('*, items(*)')
      .eq('character_id', defenderId)
      .eq('equipped', true),
  ])

  const attackerProfile = attackerChar.profiles as NonNullable<typeof attackerChar.profiles>
  const defenderProfile = defenderChar.profiles as NonNullable<typeof defenderChar.profiles>

  const attackerStats = calculateEffectiveStats(
    attackerChar,
    attackerProfile,
    (attackerEquip.data || []) as Array<{ items: { stat_bonuses: Json } | null }>
  )
  const defenderStats = calculateEffectiveStats(
    defenderChar,
    defenderProfile,
    (defenderEquip.data || []) as Array<{ items: { stat_bonuses: Json } | null }>
  )

  const result = simulateFight(attackerStats, defenderStats)
  const attackerWon = result.winnerId === attackerChar.id
  const honorChange = attackerWon ? 25 : -15

  // Record fight
  const { error: fightError } = await supabase.from('arena_fights').insert({
    attacker_id: attackerChar.id,
    defender_id: defenderId,
    winner_id: result.winnerId,
    fight_log: result.log as unknown as Json,
    honor_gained: honorChange,
  })

  if (fightError) return { error: fightError.message }

  // Update attacker ranking
  const { data: attackerRanking } = await supabase
    .from('arena_rankings')
    .select('*')
    .eq('character_id', attackerChar.id)
    .single()

  if (attackerRanking) {
    await supabase
      .from('arena_rankings')
      .update({
        honor_points: Math.max(0, attackerRanking.honor_points + honorChange),
        wins: attackerRanking.wins + (attackerWon ? 1 : 0),
        losses: attackerRanking.losses + (attackerWon ? 0 : 1),
      })
      .eq('character_id', attackerChar.id)
  }

  // Update defender ranking
  const { data: defenderRanking } = await supabase
    .from('arena_rankings')
    .select('*')
    .eq('character_id', defenderId)
    .single()

  if (defenderRanking) {
    const defenderHonorChange = attackerWon ? -15 : 25
    await supabase
      .from('arena_rankings')
      .update({
        honor_points: Math.max(0, defenderRanking.honor_points + defenderHonorChange),
        wins: defenderRanking.wins + (attackerWon ? 0 : 1),
        losses: defenderRanking.losses + (attackerWon ? 1 : 0),
      })
      .eq('character_id', defenderId)
  }

  // Gold reward for winner
  if (attackerWon) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gold')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ gold: profile.gold + 50 })
        .eq('id', session.user.id)
    }
  }

  return {
    data: {
      winner_id: result.winnerId,
      attacker_won: attackerWon,
      honor_change: honorChange,
      gold_reward: attackerWon ? 50 : 0,
      fight_log: result.log,
    },
  }
}

export async function getArenaRanking(limit: number = 10) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('arena_rankings')
    .select('*, characters(*, profiles(display_name, class, level))')
    .order('honor_points', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  return { data }
}

export async function getFightHistory(limit: number = 10) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data, error } = await supabase
    .from('arena_fights')
    .select('*, characters!arena_fights_attacker_id_fkey(profiles(display_name)), defender:characters!arena_fights_defender_id_fkey(profiles(display_name))')
    .or(`attacker_id.eq.${character.id},defender_id.eq.${character.id}`)
    .order('fought_at', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  return { data }
}
