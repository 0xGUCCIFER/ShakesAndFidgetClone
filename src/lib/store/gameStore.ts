import { create } from 'zustand'
import type { Character, InventoryItem, ActiveQuest } from './types'

interface GameState {
  character: Character | null
  inventory: InventoryItem[]
  activeQuest: ActiveQuest | null
  setCharacter: (c: Character) => void
  updateCharacter: (partial: Partial<Character>) => void
  setInventory: (items: InventoryItem[]) => void
  addInventoryItem: (item: InventoryItem) => void
  removeInventoryItem: (id: string) => void
  setActiveQuest: (q: ActiveQuest | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  character: null,
  inventory: [],
  activeQuest: null,

  setCharacter: (character) => set({ character }),

  updateCharacter: (partial) =>
    set((state) => ({
      character: state.character ? { ...state.character, ...partial } : null,
    })),

  setInventory: (inventory) => set({ inventory }),

  addInventoryItem: (item) =>
    set((state) => ({ inventory: [...state.inventory, item] })),

  removeInventoryItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  setActiveQuest: (activeQuest) => set({ activeQuest }),
}))
