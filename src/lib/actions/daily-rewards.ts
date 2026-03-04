'use server'

import { createClient } from '@/lib/supabase/server'
import { getRewardForDay } from '@/lib/utils/daily-reward-tiers'

export async function getDailyRewardStatus() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'No character found' }

  const { data: reward } = await supabase
    .from('daily_rewards')
    .select('*')
    .eq('character_id', character.id)
    .single()

  if (!reward) {
    return {
      data: {
        canClaim: true,
        streak: 0,
        nextDay: 1,
        lastClaimed: null,
      },
    }
  }

  const lastClaimed = reward.last_claimed ? new Date(reward.last_claimed) : null
  const now = new Date()

  let canClaim = true
  let streak = reward.streak_count

  if (lastClaimed) {
    const lastClaimedDate = new Date(lastClaimed.getFullYear(), lastClaimed.getMonth(), lastClaimed.getDate())
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.floor((todayDate.getTime() - lastClaimedDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      canClaim = false
    } else if (diffDays > 1) {
      // Streak broken
      streak = 0
    }
  }

  const nextDay = canClaim ? Math.min((streak % 7) + 1, 7) : (streak % 7) || 7

  return {
    data: {
      canClaim,
      streak,
      nextDay,
      lastClaimed: reward.last_claimed,
    },
  }
}

export async function claimDailyReward() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'No character found' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gold, gems')
    .eq('id', session.user.id)
    .single()

  if (!profile) return { error: 'No profile found' }

  // Get or create daily reward record
  const { data: existing } = await supabase
    .from('daily_rewards')
    .select('*')
    .eq('character_id', character.id)
    .single()

  const now = new Date()
  let streak = 0

  if (existing) {
    const lastClaimed = existing.last_claimed ? new Date(existing.last_claimed) : null
    if (lastClaimed) {
      const lastClaimedDate = new Date(lastClaimed.getFullYear(), lastClaimed.getMonth(), lastClaimed.getDate())
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffDays = Math.floor((todayDate.getTime() - lastClaimedDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return { error: 'Already claimed today' }
      } else if (diffDays === 1) {
        streak = existing.streak_count
      }
      // diffDays > 1 means streak broken, reset to 0
    }
  }

  const newStreak = streak + 1
  const day = ((newStreak - 1) % 7) + 1
  const reward = getRewardForDay(day)

  // Upsert daily reward record
  if (existing) {
    await supabase
      .from('daily_rewards')
      .update({ last_claimed: now.toISOString(), streak_count: newStreak })
      .eq('character_id', character.id)
  } else {
    await supabase
      .from('daily_rewards')
      .insert({ character_id: character.id, last_claimed: now.toISOString(), streak_count: newStreak })
  }

  // Update profile gold/gems
  await supabase
    .from('profiles')
    .update({
      gold: profile.gold + reward.gold,
      gems: profile.gems + reward.gems,
    })
    .eq('id', session.user.id)

  return {
    data: {
      gold: reward.gold,
      gems: reward.gems,
      day,
      streak: newStreak,
    },
  }
}
