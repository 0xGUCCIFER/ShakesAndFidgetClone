'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { CharacterAvatar, ProgressBar, StatBlock, ItemCard, Modal, Button } from '@/components/ui'
import { Sword, Shield, Brain, Heart, Clover, Crown, Shirt, Footprints, CircleDot, Gem } from 'lucide-react'
import type { InventoryItem, ItemSlot } from '@/lib/store/types'

const equipmentSlots: { slot: ItemSlot; label: string; icon: typeof Sword; position: string }[] = [
  { slot: 'head', label: 'Head', icon: Crown, position: 'col-start-2 row-start-1' },
  { slot: 'amulet', label: 'Amulet', icon: Gem, position: 'col-start-3 row-start-1' },
  { slot: 'chest', label: 'Chest', icon: Shirt, position: 'col-start-2 row-start-2' },
  { slot: 'weapon', label: 'Weapon', icon: Sword, position: 'col-start-1 row-start-2' },
  { slot: 'shield', label: 'Shield', icon: Shield, position: 'col-start-3 row-start-2' },
  { slot: 'legs', label: 'Legs', icon: Shirt, position: 'col-start-1 row-start-3' },
  { slot: 'boots', label: 'Boots', icon: Footprints, position: 'col-start-2 row-start-3' },
  { slot: 'ring', label: 'Ring', icon: CircleDot, position: 'col-start-3 row-start-3' },
]

export default function CharacterPage() {
  const character = useGameStore((s) => s.character)
  const inventory = useGameStore((s) => s.inventory)
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null)

  if (!character) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading character...</p>
      </div>
    )
  }

  const equippedItems = inventory.filter((i) => i.equipped)
  const getEquippedItem = (slot: ItemSlot) =>
    equippedItems.find((i) => i.item.slot === slot)

  const getAvailableItems = (slot: ItemSlot) =>
    inventory.filter((i) => !i.equipped && i.item.slot === slot)

  // Calculate stat bonuses from equipment
  const bonuses = equippedItems.reduce(
    (acc, inv) => {
      const s = inv.item.stats
      return {
        strength: acc.strength + (s.strength ?? 0),
        dexterity: acc.dexterity + (s.dexterity ?? 0),
        intelligence: acc.intelligence + (s.intelligence ?? 0),
        constitution: acc.constitution + (s.constitution ?? 0),
        luck: acc.luck + (s.luck ?? 0),
      }
    },
    { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, luck: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fantasy-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <CharacterAvatar
            characterClass={character.class}
            level={character.level}
            name={character.name}
            size="lg"
          />
          <div className="flex-1 w-full space-y-3">
            <ProgressBar
              value={character.hp}
              max={character.max_hp}
              color="hp"
              label="HP"
            />
            <ProgressBar
              value={character.stamina}
              max={character.max_stamina}
              color="stamina"
              label="Stamina"
            />
            <ProgressBar
              value={character.xp}
              max={character.xp_to_next}
              color="xp"
              label={`Level ${character.level} XP`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="fantasy-card p-5">
          <h2 className="font-display text-sm font-semibold text-primary-light uppercase tracking-wider mb-4">
            Attributes
          </h2>
          <div className="space-y-2">
            <StatBlock icon={<Sword className="w-4 h-4" />} label="STR" value={character.strength} bonus={bonuses.strength} />
            <StatBlock icon={<Shield className="w-4 h-4" />} label="DEX" value={character.dexterity} bonus={bonuses.dexterity} />
            <StatBlock icon={<Brain className="w-4 h-4" />} label="INT" value={character.intelligence} bonus={bonuses.intelligence} />
            <StatBlock icon={<Heart className="w-4 h-4" />} label="CON" value={character.constitution} bonus={bonuses.constitution} />
            <StatBlock icon={<Clover className="w-4 h-4" />} label="LCK" value={character.luck} bonus={bonuses.luck} />
          </div>
        </div>

        {/* Equipment */}
        <div className="fantasy-card p-5">
          <h2 className="font-display text-sm font-semibold text-primary-light uppercase tracking-wider mb-4">
            Equipment
          </h2>
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {equipmentSlots.map((es) => {
              const equipped = getEquippedItem(es.slot)
              const Icon = es.icon
              return (
                <button
                  key={es.slot}
                  onClick={() => setSelectedSlot(es.slot)}
                  className={`${es.position} w-16 h-16 mx-auto flex flex-col items-center justify-center rounded border-2 transition-all hover:border-primary ${
                    equipped
                      ? `border-rarity-${equipped.item.rarity} glow-${equipped.item.rarity} bg-bg-dark`
                      : 'border-bg-light border-dashed bg-bg-darkest/50 hover:bg-bg-dark'
                  }`}
                >
                  {equipped ? (
                    <span className="text-xl">{equipped.item.icon}</span>
                  ) : (
                    <Icon className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-[8px] text-text-muted mt-0.5">{es.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Equipment Modal */}
      <Modal
        open={selectedSlot !== null}
        onClose={() => setSelectedSlot(null)}
        title={`${selectedSlot ? equipmentSlots.find((s) => s.slot === selectedSlot)?.label ?? selectedSlot : ''} - Equipment`}
      >
        {selectedSlot && (
          <div className="space-y-3">
            {getEquippedItem(selectedSlot) && (
              <div className="p-3 rounded bg-bg-darkest border border-primary/30">
                <p className="text-xs text-text-muted mb-2">Currently equipped:</p>
                <div className="flex items-center gap-3">
                  <ItemCard item={getEquippedItem(selectedSlot)!.item} />
                  <div>
                    <p className="text-sm text-parchment font-semibold">{getEquippedItem(selectedSlot)!.item.name}</p>
                    <Button variant="secondary" size="sm" className="mt-1">
                      Unequip
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-text-muted">Available items:</p>
            {getAvailableItems(selectedSlot).length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No items available for this slot.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {getAvailableItems(selectedSlot).map((inv) => (
                  <ItemCard key={inv.id} item={inv.item} />
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
