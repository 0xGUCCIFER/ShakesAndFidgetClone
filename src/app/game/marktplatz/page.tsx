'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { ItemCard, GoldDisplay, Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { ArrowLeftRight, Filter, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Item, ItemRarity, ItemSlot, InventoryItem } from '@/lib/store/types'

type MarketTab = 'browse' | 'my-offers'

interface TradeOffer {
  id: string
  seller_id: string
  seller_name: string
  item: Item
  price_gold: number
  price_gems: number | null
  status: string
  created_at: string
}

export default function MarktplatzPage() {
  const character = useGameStore((s) => s.character)
  const inventory = useGameStore((s) => s.inventory)
  const updateCharacter = useGameStore((s) => s.updateCharacter)
  const addInventoryItem = useGameStore((s) => s.addInventoryItem)

  const [tab, setTab] = useState<MarketTab>('browse')
  const [offers, setOffers] = useState<TradeOffer[]>([])
  const [myOffers, setMyOffers] = useState<TradeOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<TradeOffer | null>(null)
  const [showSellModal, setShowSellModal] = useState(false)
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [slotFilter, setSlotFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'price' | 'rarity' | 'newest'>('newest')

  const mapOffer = useCallback((offer: Record<string, unknown>): TradeOffer => {
    const raw = offer.item as Record<string, unknown>
    const stats = (raw?.stat_bonuses ?? {}) as Record<string, number>
    return {
      id: offer.id as string,
      seller_id: offer.seller_id as string,
      seller_name: 'Unknown',
      item: {
        id: raw?.id as string ?? '',
        name: raw?.name as string ?? '?',
        slot: raw?.slot as ItemSlot ?? 'weapon',
        rarity: raw?.rarity as ItemRarity ?? 'common',
        level_req: raw?.level_required as number ?? 1,
        class_req: null,
        stats: {
          strength: stats.strength,
          dexterity: stats.dexterity,
          intelligence: stats.intelligence,
          constitution: stats.constitution,
          luck: stats.luck,
        },
        icon: (raw?.icon_name as string) ?? '?',
        sell_price: 0,
        buy_price: offer.price_gold as number,
      },
      price_gold: offer.price_gold as number,
      price_gems: offer.price_gems as number | null,
      status: offer.status as string,
      created_at: offer.created_at as string,
    }
  }, [])

  const loadOffers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('trade_offers')
      .select('*, item:items(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) {
      setOffers(data.map((o) => mapOffer(o as unknown as Record<string, unknown>)))
    }
    setLoading(false)
  }, [mapOffer])

  const loadMyOffers = useCallback(async () => {
    if (!character) return
    const supabase = createClient()
    const { data } = await supabase
      .from('trade_offers')
      .select('*, item:items(*)')
      .eq('seller_id', character.id)
      .order('created_at', { ascending: false })

    if (data) {
      setMyOffers(data.map((o) => mapOffer(o as unknown as Record<string, unknown>)))
    }
  }, [character, mapOffer])

  useEffect(() => {
    loadOffers()
    loadMyOffers()
  }, [loadOffers, loadMyOffers])

  async function buyOffer(offer: TradeOffer) {
    if (!character) return
    if (character.gold < offer.price_gold) {
      showToast('error', 'Nicht genug Gold!')
      return
    }

    const supabase = createClient()

    // Update offer status
    const { error } = await supabase
      .from('trade_offers')
      .update({ status: 'sold' })
      .eq('id', offer.id)
      .eq('status', 'active')

    if (error) {
      showToast('error', 'Kauf fehlgeschlagen.')
      return
    }

    // Deduct gold
    await supabase
      .from('profiles')
      .update({ gold: character.gold - offer.price_gold })
      .eq('id', character.user_id)

    // Add to inventory
    const { data: invData } = await supabase
      .from('inventory')
      .insert({ character_id: character.id, item_id: offer.item.id })
      .select('*')
      .single()

    // Record history
    await supabase.from('trade_history').insert({
      trade_offer_id: offer.id,
      buyer_id: character.id,
    })

    updateCharacter({ gold: character.gold - offer.price_gold })
    if (invData) {
      addInventoryItem({
        id: invData.id,
        character_id: invData.character_id,
        item: offer.item,
        equipped: false,
        slot_index: 0,
      })
    }

    showToast('success', `${offer.item.name} gekauft!`)
    setSelectedOffer(null)
    loadOffers()
  }

  async function cancelOffer(offerId: string) {
    const supabase = createClient()
    await supabase.from('trade_offers').update({ status: 'cancelled' }).eq('id', offerId)
    showToast('success', 'Angebot zurueckgezogen.')
    loadMyOffers()
  }

  async function createListing() {
    if (!character || !sellItem || !sellPrice) return
    const price = parseInt(sellPrice)
    if (isNaN(price) || price <= 0) {
      showToast('error', 'Ungueltiger Preis.')
      return
    }

    const supabase = createClient()

    // Remove from inventory
    await supabase.from('inventory').delete().eq('id', sellItem.id)

    // Create listing
    await supabase.from('trade_offers').insert({
      seller_id: character.id,
      item_id: sellItem.item.id,
      price_gold: price,
    })

    showToast('success', `${sellItem.item.name} zum Verkauf angeboten!`)
    setShowSellModal(false)
    setSellItem(null)
    setSellPrice('')
    loadOffers()
    loadMyOffers()
  }

  const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }

  let filteredOffers = offers.filter((o) => o.seller_id !== character?.id)
  if (slotFilter !== 'all') filteredOffers = filteredOffers.filter((o) => o.item.slot === slotFilter)
  if (rarityFilter !== 'all') filteredOffers = filteredOffers.filter((o) => o.item.rarity === rarityFilter)

  if (sortBy === 'price') filteredOffers.sort((a, b) => a.price_gold - b.price_gold)
  else if (sortBy === 'rarity') filteredOffers.sort((a, b) => (rarityOrder[b.item.rarity] ?? 0) - (rarityOrder[a.item.rarity] ?? 0))

  const unequippedItems = inventory.filter((i) => !i.equipped)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-light flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" /> Marktplatz
        </h1>
        <Button size="sm" onClick={() => setShowSellModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Verkaufen
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bg-light">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
            tab === 'browse' ? 'text-primary-light border-b-2 border-primary' : 'text-text-muted hover:text-parchment'
          }`}
        >
          Marktplatz
        </button>
        <button
          onClick={() => setTab('my-offers')}
          className={`px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
            tab === 'my-offers' ? 'text-primary-light border-b-2 border-primary' : 'text-text-muted hover:text-parchment'
          }`}
        >
          Meine Angebote
        </button>
      </div>

      {tab === 'browse' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="px-2 py-1 rounded bg-bg-darkest border border-bg-light text-parchment text-xs focus:outline-none"
            >
              <option value="all">Alle Slots</option>
              {['weapon', 'shield', 'head', 'chest', 'legs', 'boots', 'ring', 'amulet'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="px-2 py-1 rounded bg-bg-darkest border border-bg-light text-parchment text-xs focus:outline-none"
            >
              <option value="all">Alle Raritaeten</option>
              {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'rarity' | 'newest')}
              className="px-2 py-1 rounded bg-bg-darkest border border-bg-light text-parchment text-xs focus:outline-none"
            >
              <option value="newest">Neueste</option>
              <option value="price">Preis</option>
              <option value="rarity">Seltenheit</option>
            </select>
          </div>

          {/* Offers Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="fantasy-card p-4 animate-pulse h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
                  className="fantasy-card p-4 cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div className="flex justify-center mb-3">
                    <ItemCard item={offer.item} />
                  </div>
                  <p className="text-sm text-parchment font-semibold text-center truncate">{offer.item.name}</p>
                  <p className="text-[10px] text-text-muted text-center uppercase">{offer.item.slot} - {offer.item.rarity}</p>
                  <div className="flex justify-center mt-2">
                    <GoldDisplay amount={offer.price_gold} type="gold" />
                  </div>
                </div>
              ))}
              {filteredOffers.length === 0 && (
                <p className="col-span-full text-center text-text-muted py-8">Keine Angebote gefunden.</p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'my-offers' && (
        <div className="space-y-3">
          {myOffers.length === 0 && (
            <p className="text-center text-text-muted py-8">Du hast keine aktiven Angebote.</p>
          )}
          {myOffers.map((offer) => (
            <div key={offer.id} className="fantasy-card p-4 flex items-center gap-4">
              <ItemCard item={offer.item} />
              <div className="flex-1">
                <p className="text-sm text-parchment font-semibold">{offer.item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <GoldDisplay amount={offer.price_gold} type="gold" />
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    offer.status === 'active'
                      ? 'bg-stamina/20 text-stamina'
                      : offer.status === 'sold'
                      ? 'bg-primary/20 text-primary-light'
                      : 'bg-bg-light text-text-muted'
                  }`}>
                    {offer.status === 'active' ? 'Aktiv' : offer.status === 'sold' ? 'Verkauft' : 'Abgebrochen'}
                  </span>
                </div>
              </div>
              {offer.status === 'active' && (
                <Button variant="outline" size="sm" onClick={() => cancelOffer(offer.id)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Buy Modal */}
      <Modal
        open={selectedOffer !== null}
        onClose={() => setSelectedOffer(null)}
        title="Item kaufen"
      >
        {selectedOffer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ItemCard item={selectedOffer.item} />
              <div>
                <p className="text-parchment font-semibold">{selectedOffer.item.name}</p>
                <p className="text-xs text-text-muted uppercase">{selectedOffer.item.slot} - {selectedOffer.item.rarity}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-bg-darkest/50">
              <span className="text-sm text-text-muted">Preis:</span>
              <GoldDisplay amount={selectedOffer.price_gold} type="gold" />
            </div>
            <Button onClick={() => buyOffer(selectedOffer)} className="w-full">
              Kaufen
            </Button>
          </div>
        )}
      </Modal>

      {/* Sell Modal */}
      <Modal
        open={showSellModal}
        onClose={() => { setShowSellModal(false); setSellItem(null) }}
        title="Item verkaufen"
      >
        <div className="space-y-4">
          {!sellItem ? (
            <>
              <p className="text-xs text-text-muted">Waehle ein Item aus deinem Inventar:</p>
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {unequippedItems.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSellItem(inv)}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  >
                    <ItemCard item={inv.item} />
                  </div>
                ))}
                {unequippedItems.length === 0 && (
                  <p className="col-span-4 text-center text-text-muted py-4">Keine Items verfuegbar.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <ItemCard item={sellItem.item} />
                <div>
                  <p className="text-parchment font-semibold">{sellItem.item.name}</p>
                  <button onClick={() => setSellItem(null)} className="text-xs text-accent hover:underline">
                    Anderes Item waehlen
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                  Preis (Gold)
                </label>
                <input
                  type="number"
                  min={1}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <Button onClick={createListing} className="w-full">
                Angebot erstellen
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
