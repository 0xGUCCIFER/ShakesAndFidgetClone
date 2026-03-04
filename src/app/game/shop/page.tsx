'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { ItemCard, GoldDisplay, Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Item, ItemRarity, ItemSlot } from '@/lib/store/types'

type ShopTab = 'weapon' | 'armor' | 'accessories' | 'featured'

interface ShopItem {
  id: string
  item: Item
  price_gold: number | null
  price_gems: number | null
  is_featured: boolean
}

export default function ShopPage() {
  const character = useGameStore((s) => s.character)
  const updateCharacter = useGameStore((s) => s.updateCharacter)
  const addInventoryItem = useGameStore((s) => s.addInventoryItem)

  const [tab, setTab] = useState<ShopTab>('featured')
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [buying, setBuying] = useState(false)

  const loadShop = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('shop_items')
      .select('*, item:items(*)')

    if (data) {
      setShopItems(
        data.map((si) => {
          const raw = si.item as unknown as Record<string, unknown>
          const stats = (raw.stat_bonuses ?? {}) as Record<string, number>
          return {
            id: si.id,
            item: {
              id: raw.id as string,
              name: raw.name as string,
              slot: raw.slot as ItemSlot,
              rarity: raw.rarity as ItemRarity,
              level_req: raw.level_required as number,
              class_req: null,
              stats: {
                strength: stats.strength,
                dexterity: stats.dexterity,
                intelligence: stats.intelligence,
                constitution: stats.constitution,
                luck: stats.luck,
                damage_min: stats.damage_min,
                damage_max: stats.damage_max,
                armor: stats.armor,
              },
              icon: (raw.icon_name as string) ?? '?',
              sell_price: 0,
              buy_price: si.price_gold ?? 0,
            },
            price_gold: si.price_gold,
            price_gems: si.price_gems,
            is_featured: si.is_featured,
          }
        })
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadShop()
  }, [loadShop])

  async function buyItem(shopItem: ShopItem, currency: 'gold' | 'gems') {
    if (!character || buying) return
    setBuying(true)

    const price = currency === 'gold' ? shopItem.price_gold : shopItem.price_gems
    if (!price) {
      setBuying(false)
      return
    }

    const balance = currency === 'gold' ? character.gold : character.gems
    if (balance < price) {
      showToast('error', `Not enough ${currency === 'gold' ? 'gold' : 'gems'}!`)
      setBuying(false)
      return
    }

    const supabase = createClient()

    // Deduct currency
    const updateField = currency === 'gold' ? { gold: character.gold - price } : { gems: character.gems - price }
    await supabase.from('profiles').update(updateField).eq('id', character.user_id)

    // Add to inventory
    const { data: invData } = await supabase
      .from('inventory')
      .insert({
        character_id: character.id,
        item_id: shopItem.item.id,
      })
      .select('*')
      .single()

    if (invData) {
      updateCharacter(updateField)
      addInventoryItem({
        id: invData.id,
        character_id: invData.character_id,
        item: shopItem.item,
        equipped: false,
        slot_index: 0,
      })
      showToast('success', `${shopItem.item.name} purchased!`)
    }

    setBuying(false)
    setSelectedItem(null)
  }

  const weaponSlots: ItemSlot[] = ['weapon']
  const armorSlots: ItemSlot[] = ['head', 'chest', 'legs', 'boots', 'shield']
  const accessorySlots: ItemSlot[] = ['ring', 'amulet']

  const filteredItems = shopItems.filter((si) => {
    if (tab === 'featured') return si.is_featured
    if (tab === 'weapon') return weaponSlots.includes(si.item.slot as ItemSlot)
    if (tab === 'armor') return armorSlots.includes(si.item.slot as ItemSlot)
    if (tab === 'accessories') return accessorySlots.includes(si.item.slot as ItemSlot)
    return true
  })

  const tabs: { value: ShopTab; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'weapon', label: 'Weapons' },
    { value: 'armor', label: 'Armor' },
    { value: 'accessories', label: 'Accessories' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-light flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Shop
        </h1>
        {character && (
          <div className="flex items-center gap-4">
            <GoldDisplay amount={character.gold} type="gold" />
            <GoldDisplay amount={character.gems} type="gems" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bg-light">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
              tab === t.value
                ? 'text-primary-light border-b-2 border-primary'
                : 'text-text-muted hover:text-parchment'
            }`}
          >
            {t.value === 'featured' && <Sparkles className="w-3.5 h-3.5 inline mr-1" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="fantasy-card p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((si) => (
            <div
              key={si.id}
              onClick={() => setSelectedItem(si)}
              className="fantasy-card p-4 cursor-pointer hover:border-primary/50 transition-all"
            >
              <div className="flex justify-center mb-3">
                <ItemCard item={si.item} />
              </div>
              <p className="text-sm text-parchment font-semibold text-center truncate">{si.item.name}</p>
              <p className="text-[10px] text-text-muted text-center uppercase mt-0.5">
                {si.item.slot} - Lvl {si.item.level_req}
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                {si.price_gold && <GoldDisplay amount={si.price_gold} type="gold" />}
                {si.price_gems && <GoldDisplay amount={si.price_gems} type="gems" />}
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p className="col-span-full text-center text-text-muted py-8">No items in this category.</p>
          )}
        </div>
      )}

      {/* Buy Modal */}
      <Modal
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title="Buy Item"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ItemCard item={selectedItem.item} />
              <div>
                <p className="text-parchment font-semibold">{selectedItem.item.name}</p>
                <p className="text-xs text-text-muted uppercase">{selectedItem.item.slot} - {selectedItem.item.rarity}</p>
              </div>
            </div>

            {/* Stats */}
            {Object.entries(selectedItem.item.stats)
              .filter(([, v]) => v !== undefined && v > 0)
              .map(([stat, val]) => (
                <p key={stat} className="text-sm text-stamina">+{val} {stat.replace('_', ' ')}</p>
              ))}

            <div className="flex gap-2">
              {selectedItem.price_gold && (
                <Button
                  onClick={() => buyItem(selectedItem, 'gold')}
                  disabled={buying}
                  className="flex-1"
                >
                  {selectedItem.price_gold} Gold
                </Button>
              )}
              {selectedItem.price_gems && (
                <Button
                  variant="secondary"
                  onClick={() => buyItem(selectedItem, 'gems')}
                  disabled={buying}
                  className="flex-1"
                >
                  {selectedItem.price_gems} Gems
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
