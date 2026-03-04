'use server'

import { createClient } from '@/lib/supabase/server'

export async function getInventory() {
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
    .from('inventory')
    .select('*, items(*)')
    .eq('character_id', character.id)
    .order('equipped', { ascending: false })

  if (error) return { error: error.message }

  return { data }
}

export async function equipItem(inventoryId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Get the item to equip
  const { data: invItem } = await supabase
    .from('inventory')
    .select('*, items(*)')
    .eq('id', inventoryId)
    .eq('character_id', character.id)
    .single()

  if (!invItem) return { error: 'Item not found in inventory' }
  if (invItem.equipped) return { error: 'Item already equipped' }

  const item = invItem.items as NonNullable<typeof invItem.items>

  // Check level requirement
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.level < item.level_required) {
    return { error: 'Level too low to equip this item' }
  }

  // Unequip current item in same slot (the DB trigger also prevents duplicates)
  const { data: currentEquipped } = await supabase
    .from('inventory')
    .select('id, items!inner(slot)')
    .eq('character_id', character.id)
    .eq('equipped', true)

  const sameSlotItem = currentEquipped?.find((inv) => {
    const equipItem = inv.items as unknown as { slot: string }
    return equipItem?.slot === item.slot
  })

  if (sameSlotItem) {
    await supabase
      .from('inventory')
      .update({ equipped: false })
      .eq('id', sameSlotItem.id)
  }

  // Equip new item
  const { error } = await supabase
    .from('inventory')
    .update({ equipped: true })
    .eq('id', inventoryId)

  if (error) return { error: error.message }

  return { success: true }
}

export async function unequipItem(inventoryId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: invItem } = await supabase
    .from('inventory')
    .select('id, equipped')
    .eq('id', inventoryId)
    .eq('character_id', character.id)
    .single()

  if (!invItem) return { error: 'Item not found in inventory' }
  if (!invItem.equipped) return { error: 'Item is not equipped' }

  const { error } = await supabase
    .from('inventory')
    .update({ equipped: false })
    .eq('id', inventoryId)

  if (error) return { error: error.message }

  return { success: true }
}

export async function getEquippedItems() {
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
    .from('inventory')
    .select('*, items(*)')
    .eq('character_id', character.id)
    .eq('equipped', true)

  if (error) return { error: error.message }

  return { data }
}
