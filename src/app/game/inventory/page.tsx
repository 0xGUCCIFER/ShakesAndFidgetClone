'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { ItemCard, Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Backpack, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, Item, ItemSlot, ItemRarity } from '@/lib/store/types'

export default function InventoryPage() {
  const character = useGameStore((s) => s.character)
  const inventory = useGameStore((s) => s.inventory)
  const setInventory = useGameStore((s) => s.setInventory)

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [slotFilter, setSlotFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [toggling, setToggling] = useState(false)

  let filteredInventory = [...inventory]
  if (slotFilter !== 'all') filteredInventory = filteredInventory.filter((i) => i.item.slot === slotFilter)
  if (rarityFilter !== 'all') filteredInventory = filteredInventory.filter((i) => i.item.rarity === rarityFilter)

  // Sort: equipped first, then by rarity
  const rarityOrder: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }
  filteredInventory.sort((a, b) => {
    if (a.equipped !== b.equipped) return a.equipped ? -1 : 1
    return (rarityOrder[b.item.rarity] ?? 0) - (rarityOrder[a.item.rarity] ?? 0)
  })

  async function toggleEquip(inv: InventoryItem) {
    if (!character || toggling) return
    setToggling(true)

    const supabase = createClient()
    const newEquipped = !inv.equipped

    if (newEquipped) {
      // Unequip existing item in same slot
      const existing = inventory.find((i) => i.equipped && i.item.slot === inv.item.slot && i.id !== inv.id)
      if (existing) {
        await supabase.from('inventory').update({ equipped: false }).eq('id', existing.id)
      }
    }

    const { error } = await supabase
      .from('inventory')
      .update({ equipped: newEquipped })
      .eq('id', inv.id)

    if (error) {
      showToast('error', 'Failed to change equipment.')
      setToggling(false)
      return
    }

    // Update local state
    setInventory(
      inventory.map((i) => {
        if (i.id === inv.id) return { ...i, equipped: newEquipped }
        if (newEquipped && i.equipped && i.item.slot === inv.item.slot && i.id !== inv.id) {
          return { ...i, equipped: false }
        }
        return i
      })
    )

    setSelectedItem(null)
    showToast('success', newEquipped ? `${inv.item.name} equipped!` : `${inv.item.name} unequipped.`)
    setToggling(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-primary-light flex items-center gap-2">
        <Backpack className="w-5 h-5" /> Inventory
        <span className="text-sm text-text-muted font-normal">({inventory.length} Items)</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={slotFilter}
          onChange={(e) => setSlotFilter(e.target.value)}
          className="px-2 py-1 rounded bg-bg-darkest border border-bg-light text-parchment text-xs focus:outline-none"
        >
          <option value="all">All Slots</option>
          {['weapon', 'shield', 'head', 'chest', 'legs', 'boots', 'ring', 'amulet'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="px-2 py-1 rounded bg-bg-darkest border border-bg-light text-parchment text-xs focus:outline-none"
        >
          <option value="all">All Rarities</option>
          {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredInventory.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setSelectedItem(inv)}
            className={`relative cursor-pointer transition-transform hover:scale-105 ${
              inv.equipped ? 'ring-2 ring-primary rounded' : ''
            }`}
          >
            <ItemCard item={inv.item} />
            {inv.equipped && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-bg-darkest font-bold">
                E
              </span>
            )}
          </div>
        ))}
        {filteredInventory.length === 0 && (
          <p className="col-span-full text-center text-text-muted py-8">No items found.</p>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.item.name}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ItemCard item={selectedItem.item} />
              <div>
                <p className={`text-sm font-semibold text-rarity-${selectedItem.item.rarity}`}>
                  {selectedItem.item.rarity.charAt(0).toUpperCase() + selectedItem.item.rarity.slice(1)}
                </p>
                <p className="text-xs text-text-muted uppercase">{selectedItem.item.slot} - Lvl {selectedItem.item.level_req}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1">
              {Object.entries(selectedItem.item.stats)
                .filter(([, v]) => v !== undefined && v > 0)
                .map(([stat, val]) => (
                  <p key={stat} className="text-sm text-stamina">+{val} {stat.replace('_', ' ')}</p>
                ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => toggleEquip(selectedItem)}
                disabled={toggling}
                className="flex-1"
              >
                {selectedItem.equipped ? 'Unequip' : 'Equip'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedItem(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
