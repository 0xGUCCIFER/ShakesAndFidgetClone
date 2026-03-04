'use server'

import { createClient } from '@/lib/supabase/server'

// XP threshold for level up: level * 100 * 1.5
function xpForLevel(level: number): number {
  return Math.floor(level * 100 * 1.5)
}

export async function getAvailableQuests() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', session.user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .lte('min_level', profile.level)
    .order('min_level', { ascending: true })

  if (error) return { error: error.message }

  return { data }
}

export async function startQuest(questId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id, stamina')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Check no active quest
  const { data: activeQuest } = await supabase
    .from('active_quests')
    .select('id')
    .eq('character_id', character.id)
    .limit(1)
    .single()

  if (activeQuest) return { error: 'You already have an active quest' }

  // Get quest details
  const { data: quest } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .single()

  if (!quest) return { error: 'Quest not found' }

  // Check stamina
  if (character.stamina < quest.stamina_cost) {
    return { error: 'Not enough stamina' }
  }

  // Check level requirement
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.level < quest.min_level) {
    return { error: 'Level too low for this quest' }
  }

  const now = new Date()
  const completesAt = new Date(now.getTime() + quest.duration_seconds * 1000)

  // Deduct stamina
  const { error: staminaError } = await supabase
    .from('characters')
    .update({ stamina: character.stamina - quest.stamina_cost })
    .eq('id', character.id)

  if (staminaError) return { error: staminaError.message }

  // Create active quest
  const { data: newQuest, error } = await supabase
    .from('active_quests')
    .insert({
      character_id: character.id,
      quest_id: questId,
      started_at: now.toISOString(),
      completes_at: completesAt.toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  return { data: newQuest }
}

export async function completeQuest() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: activeQuest } = await supabase
    .from('active_quests')
    .select('*, quests(*)')
    .eq('character_id', character.id)
    .single()

  if (!activeQuest) return { error: 'No active quest' }

  // Validate time has passed
  const now = new Date()
  const completesAt = new Date(activeQuest.completes_at)
  if (now < completesAt) {
    return { error: 'Quest not yet complete' }
  }

  const quest = activeQuest.quests as NonNullable<typeof activeQuest.quests>

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  // Award XP and gold
  let newXp = profile.xp + quest.xp_reward
  let newLevel = profile.level
  let newGold = profile.gold + quest.gold_reward
  let leveledUp = false
  let statPointsAwarded = 0

  // Check for level up (possibly multiple levels)
  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel)
    newLevel++
    leveledUp = true
    statPointsAwarded += 5
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      gold: newGold,
    })
    .eq('id', session.user.id)

  if (profileError) return { error: profileError.message }

  // Roll for item drop
  let droppedItem = null
  if (Math.random() < quest.item_drop_chance) {
    // Get a random item appropriate for the level
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .lte('level_required', newLevel)
      .order('level_required', { ascending: false })
      .limit(10)

    if (items && items.length > 0) {
      const randomItem = items[Math.floor(Math.random() * items.length)]
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .insert({
          character_id: character.id,
          item_id: randomItem.id,
          equipped: false,
          quantity: 1,
        })
        .select('*, items(*)')
        .single()

      droppedItem = inventoryItem
    }
  }

  // Delete active quest
  await supabase
    .from('active_quests')
    .delete()
    .eq('id', activeQuest.id)

  return {
    data: {
      xp_gained: quest.xp_reward,
      gold_gained: quest.gold_reward,
      leveled_up: leveledUp,
      new_level: newLevel,
      stat_points_awarded: statPointsAwarded,
      dropped_item: droppedItem,
    },
  }
}

export async function getActiveQuest() {
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
    .from('active_quests')
    .select('*, quests(*)')
    .eq('character_id', character.id)
    .single()

  if (error && error.code !== 'PGRST116') return { error: error.message }

  if (!data) return { data: null }

  const now = new Date()
  const completesAt = new Date(data.completes_at)
  const timeRemaining = Math.max(0, completesAt.getTime() - now.getTime())

  return {
    data: {
      ...data,
      time_remaining_ms: timeRemaining,
      is_complete: timeRemaining === 0,
    },
  }
}
