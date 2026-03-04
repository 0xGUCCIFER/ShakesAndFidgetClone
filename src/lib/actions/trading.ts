'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTradeOffer(
  inventoryId: string,
  priceGold: number,
  priceGems?: number
) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  // Verify ownership and not equipped
  const { data: invItem } = await supabase
    .from('inventory')
    .select('id, item_id, equipped')
    .eq('id', inventoryId)
    .eq('character_id', character.id)
    .single()

  if (!invItem) return { error: 'Item not found in inventory' }
  if (invItem.equipped) return { error: 'Cannot sell equipped items' }

  if (priceGold <= 0) return { error: 'Price must be positive' }

  // Remove from inventory
  const { error: deleteError } = await supabase
    .from('inventory')
    .delete()
    .eq('id', inventoryId)

  if (deleteError) return { error: deleteError.message }

  // Create trade offer
  const { data: offer, error } = await supabase
    .from('trade_offers')
    .insert({
      seller_id: character.id,
      item_id: invItem.item_id,
      price_gold: priceGold,
      price_gems: priceGems || null,
      status: 'active',
    })
    .select('*, items(*)')
    .single()

  if (error) return { error: error.message }

  return { data: offer }
}

export async function cancelTradeOffer(offerId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: offer } = await supabase
    .from('trade_offers')
    .select('*')
    .eq('id', offerId)
    .eq('seller_id', character.id)
    .eq('status', 'active')
    .single()

  if (!offer) return { error: 'Offer not found or not yours' }

  // Return item to inventory
  const { error: invError } = await supabase
    .from('inventory')
    .insert({
      character_id: character.id,
      item_id: offer.item_id,
      equipped: false,
      quantity: 1,
    })

  if (invError) return { error: invError.message }

  // Cancel offer
  const { error } = await supabase
    .from('trade_offers')
    .update({ status: 'cancelled' })
    .eq('id', offerId)

  if (error) return { error: error.message }

  return { success: true }
}

export async function buyTradeOffer(offerId: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('profile_id', session.user.id)
    .single()

  if (!character) return { error: 'Character not found' }

  const { data: offer } = await supabase
    .from('trade_offers')
    .select('*')
    .eq('id', offerId)
    .eq('status', 'active')
    .single()

  if (!offer) return { error: 'Offer not found or no longer available' }
  if (offer.seller_id === character.id) return { error: 'Cannot buy your own offer' }

  // Check buyer funds
  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('gold, gems')
    .eq('id', session.user.id)
    .single()

  if (!buyerProfile) return { error: 'Profile not found' }
  if (buyerProfile.gold < offer.price_gold) return { error: 'Not enough gold' }

  // Get seller profile
  const { data: sellerChar } = await supabase
    .from('characters')
    .select('profile_id')
    .eq('id', offer.seller_id)
    .single()

  if (!sellerChar) return { error: 'Seller not found' }

  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('gold')
    .eq('id', sellerChar.profile_id)
    .single()

  if (!sellerProfile) return { error: 'Seller profile not found' }

  // Deduct gold from buyer
  const { error: buyerError } = await supabase
    .from('profiles')
    .update({ gold: buyerProfile.gold - offer.price_gold })
    .eq('id', session.user.id)

  if (buyerError) return { error: buyerError.message }

  // Add gold to seller
  await supabase
    .from('profiles')
    .update({ gold: sellerProfile.gold + offer.price_gold })
    .eq('id', sellerChar.profile_id)

  // Transfer item to buyer
  const { error: invError } = await supabase
    .from('inventory')
    .insert({
      character_id: character.id,
      item_id: offer.item_id,
      equipped: false,
      quantity: 1,
    })

  if (invError) return { error: invError.message }

  // Mark offer as sold
  await supabase
    .from('trade_offers')
    .update({ status: 'sold' })
    .eq('id', offerId)

  // Record trade history
  await supabase
    .from('trade_history')
    .insert({
      trade_offer_id: offerId,
      buyer_id: character.id,
    })

  return { success: true }
}

export async function getTradeOffers(filters?: {
  slot?: string
  rarity?: string
  minPrice?: number
  maxPrice?: number
}) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  let query = supabase
    .from('trade_offers')
    .select('*, items(*), characters!trade_offers_seller_id_fkey(profiles(display_name))')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters?.minPrice) query = query.gte('price_gold', filters.minPrice)
  if (filters?.maxPrice) query = query.lte('price_gold', filters.maxPrice)

  const { data, error } = await query.limit(50)
  if (error) return { error: error.message }

  // Client-side filter for item properties (slot, rarity)
  let filtered = data || []
  if (filters?.slot) {
    filtered = filtered.filter((o) => {
      const item = o.items as { slot?: string } | null
      return item?.slot === filters.slot
    })
  }
  if (filters?.rarity) {
    filtered = filtered.filter((o) => {
      const item = o.items as { rarity?: string } | null
      return item?.rarity === filters.rarity
    })
  }

  return { data: filtered }
}

export async function getMyOffers() {
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
    .from('trade_offers')
    .select('*, items(*)')
    .eq('seller_id', character.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  return { data }
}

export async function getTradeHistory() {
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
    .from('trade_history')
    .select('*, trade_offers(*, items(*))')
    .eq('buyer_id', character.id)
    .order('completed_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }

  return { data }
}
