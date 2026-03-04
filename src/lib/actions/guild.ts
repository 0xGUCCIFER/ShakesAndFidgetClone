'use server'

import { createClient } from '@/lib/supabase/server'

export async function createGuild(name: string, description: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  // Get character
  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Check not already in a guild
  const { data: existingMembership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('character_id', character.id)
    .single()

  if (existingMembership) return { error: 'Already in a guild' }

  // Check gold (500 to create)
  const { data: profile } = await supabase
    .from('profiles')
    .select('gold')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.gold < 500) return { error: 'Not enough gold (500 required)' }

  // Deduct gold
  const { error: goldError } = await supabase
    .from('profiles')
    .update({ gold: profile.gold - 500 })
    .eq('id', session.user.id)

  if (goldError) return { error: goldError.message }

  // Create guild
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .insert({
      name,
      description,
      leader_id: character.id,
    })
    .select()
    .single()

  if (guildError) return { error: guildError.message }

  // Add creator as leader member
  const { error: memberError } = await supabase
    .from('guild_members')
    .insert({
      guild_id: guild.id,
      character_id: character.id,
      role: 'leader',
    })

  if (memberError) return { error: memberError.message }

  return { data: guild }
}

export async function getGuild(guildId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: guild, error } = await supabase
    .from('guilds')
    .select('*')
    .eq('id', guildId)
    .single()

  if (error) return { error: error.message }

  const { data: members } = await supabase
    .from('guild_members')
    .select('*, characters(*, profiles(display_name, class, level))')
    .eq('guild_id', guildId)
    .order('role', { ascending: true })

  return { data: { ...guild, members: members || [] } }
}

export async function getMyGuild() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('character_id', character.id)
    .single()

  if (!membership) return { data: null }

  const result = await getGuild(membership.guild_id)
  if (result.error) return result

  return { data: { ...result.data, my_role: membership.role } }
}

export async function joinGuild(guildId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Check not already in a guild
  const { data: existingMembership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('character_id', character.id)
    .single()

  if (existingMembership) return { error: 'Already in a guild' }

  // Check guild exists and has space
  const { data: guild } = await supabase
    .from('guilds')
    .select('id, max_members')
    .eq('id', guildId)
    .single()

  if (!guild) return { error: 'Guild not found' }

  const { count } = await supabase
    .from('guild_members')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', guildId)

  if ((count ?? 0) >= guild.max_members) {
    return { error: 'Guild is full' }
  }

  const { error } = await supabase
    .from('guild_members')
    .insert({
      guild_id: guildId,
      character_id: character.id,
      role: 'member',
    })

  if (error) return { error: error.message }

  return { success: true }
}

export async function leaveGuild() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('id, role, guild_id')
    .eq('character_id', character.id)
    .single()

  if (!membership) return { error: 'Not in a guild' }

  if (membership.role === 'leader') {
    return { error: 'Leaders must transfer leadership or disband the guild first' }
  }

  const { error } = await supabase
    .from('guild_members')
    .delete()
    .eq('id', membership.id)

  if (error) return { error: error.message }

  return { success: true }
}

export async function getGuildChat(guildId: string, limit: number = 50) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('guild_chat')
    .select('*, characters(profiles(display_name))')
    .eq('guild_id', guildId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  return { data: (data || []).reverse() }
}

export async function sendGuildMessage(message: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  if (!message.trim()) return { error: 'Message cannot be empty' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('character_id', character.id)
    .single()

  if (!membership) return { error: 'Not in a guild' }

  const { data: chatMessage, error } = await supabase
    .from('guild_chat')
    .insert({
      guild_id: membership.guild_id,
      character_id: character.id,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  return { data: chatMessage }
}

export async function searchGuilds(query: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('guilds')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20)

  if (error) return { error: error.message }

  return { data }
}

export async function listGuilds() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('guilds')
    .select('*')
    .order('level', { ascending: false })
    .limit(50)

  if (error) return { error: error.message }

  return { data }
}
