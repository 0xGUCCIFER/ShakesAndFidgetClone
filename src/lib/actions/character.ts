'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCharacter() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profileError) return { error: profileError.message }

  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', session.user.id)
    .single()

  if (charError) return { error: charError.message }

  const { data: equipped } = await supabase
    .from('inventory')
    .select('*, items(*)')
    .eq('character_id', character.id)
    .eq('equipped', true)

  return {
    data: {
      ...character,
      profile,
      equipped_items: equipped || [],
    },
  }
}

export async function getCharacterById(characterId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character, error } = await supabase
    .from('characters')
    .select('*, profiles(*)')
    .eq('id', characterId)
    .single()

  if (error) return { error: error.message }

  const { data: equipped } = await supabase
    .from('inventory')
    .select('*, items(*)')
    .eq('character_id', characterId)
    .eq('equipped', true)

  return {
    data: {
      ...character,
      equipped_items: equipped || [],
    },
  }
}

export async function allocateStatPoints(stats: {
  str?: number
  dex?: number
  int?: number
  con?: number
  lck?: number
}) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('level, xp')
    .eq('id', session.user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Calculate available stat points: 5 per level above 1
  // Total spent = sum of all stats minus starting stats (base ~50 total depending on class)
  const totalRequested = (stats.str || 0) + (stats.dex || 0) + (stats.int || 0) + (stats.con || 0) + (stats.lck || 0)

  if (totalRequested <= 0) return { error: 'No stat points to allocate' }

  // Simple validation: each value must be non-negative
  if (Object.values(stats).some(v => v !== undefined && v < 0)) {
    return { error: 'Stat points cannot be negative' }
  }

  const { error: updateError } = await supabase
    .from('characters')
    .update({
      strength: character.strength + (stats.str || 0),
      dexterity: character.dexterity + (stats.dex || 0),
      intelligence: character.intelligence + (stats.int || 0),
      constitution: character.constitution + (stats.con || 0),
      luck: character.luck + (stats.lck || 0),
      max_hp: character.max_hp + (stats.con || 0) * 10,
    })
    .eq('id', character.id)

  if (updateError) return { error: updateError.message }

  return { success: true }
}

export async function getLeaderboard(limit: number = 10) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, class, level, xp')
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  return { data }
}
