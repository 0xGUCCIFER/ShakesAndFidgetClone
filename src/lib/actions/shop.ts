'use server'

import { createClient } from '@/lib/supabase/server'

export async function getShopItems() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('shop_items')
    .select('*, items(*)')
    .order('is_featured', { ascending: false })

  if (error) return { error: error.message }

  return { data }
}

export async function buyItem(shopItemId: string, currency: 'gold' | 'gems') {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  // Get shop item
  const { data: shopItem } = await supabase
    .from('shop_items')
    .select('*, items(*)')
    .eq('id', shopItemId)
    .single()

  if (!shopItem) return { error: 'Shop item not found' }

  // Check availability
  if (shopItem.available_until && new Date(shopItem.available_until) < new Date()) {
    return { error: 'Item is no longer available' }
  }

  const price = currency === 'gold' ? shopItem.price_gold : shopItem.price_gems
  if (!price) return { error: `Item cannot be purchased with ${currency}` }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('gold, gems')
    .eq('id', session.user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  // Check funds
  const currentFunds = currency === 'gold' ? profile.gold : profile.gems
  if (currentFunds < price) {
    return { error: `Not enough ${currency}` }
  }

  // Get character
  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Deduct currency
  const updateData = currency === 'gold'
    ? { gold: profile.gold - price }
    : { gems: profile.gems - price }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', session.user.id)

  if (updateError) return { error: updateError.message }

  // Add to inventory
  const { data: inventoryItem, error: invError } = await supabase
    .from('inventory')
    .insert({
      character_id: character.id,
      item_id: shopItem.item_id,
      equipped: false,
      quantity: 1,
    })
    .select('*, items(*)')
    .single()

  if (invError) return { error: invError.message }

  return { data: inventoryItem }
}

export async function getFeaturedItems() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('shop_items')
    .select('*, items(*)')
    .eq('is_featured', true)

  if (error) return { error: error.message }

  return { data }
}
