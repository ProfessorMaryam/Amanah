"use client"

// Local-storage backed pet state for the child game.
// Tracks: chosen pet type, pet name, happiness, last interaction timestamps,
// coins (1 coin = 0.01 BHD saved), owned store items, equipped accessories.

import { useState, useEffect, useCallback } from "react"
import type { ChildPetType } from "@/components/child-pet-sprite"

export type AccessorySlot = "hat" | "outfit" | "toy"

export interface StoreItem {
  id: string
  name: string
  emoji: string
  slot: AccessorySlot
  cost: number // coins
  description: string
}

export const STORE_ITEMS: StoreItem[] = [
  // Hats
  { id: "crown",       name: "Royal Crown",     emoji: "👑", slot: "hat",    cost: 30,  description: "For royalty only!" },
  { id: "wizard-hat",  name: "Wizard Hat",      emoji: "🧙", slot: "hat",    cost: 25,  description: "Magic is real!" },
  { id: "party-hat",   name: "Party Hat",       emoji: "🎉", slot: "hat",    cost: 15,  description: "Every day is a party!" },
  { id: "cowboy",      name: "Cowboy Hat",      emoji: "🤠", slot: "hat",    cost: 20,  description: "Yeehaw!" },
  { id: "flower",      name: "Flower Crown",    emoji: "🌸", slot: "hat",    cost: 18,  description: "Fresh and pretty!" },
  // Outfits
  { id: "cape",        name: "Hero Cape",       emoji: "🦸", slot: "outfit", cost: 40,  description: "Save the day!" },
  { id: "scarf",       name: "Cozy Scarf",      emoji: "🧣", slot: "outfit", cost: 20,  description: "Stay warm!" },
  { id: "bow-tie",     name: "Fancy Bow Tie",   emoji: "🎀", slot: "outfit", cost: 25,  description: "Very fancy!" },
  { id: "jacket",      name: "Cool Jacket",     emoji: "🧥", slot: "outfit", cost: 35,  description: "Looking sharp!" },
  // Toys
  { id: "ball",        name: "Bouncy Ball",     emoji: "🔮", slot: "toy",    cost: 12,  description: "So fun to play with!" },
  { id: "book",        name: "Magic Book",      emoji: "📖", slot: "toy",    cost: 15,  description: "Learn new spells!" },
  { id: "guitar",      name: "Mini Guitar",     emoji: "🎸", slot: "toy",    cost: 20,  description: "Rock on!" },
  { id: "kite",        name: "Rainbow Kite",    emoji: "🪁", slot: "toy",    cost: 18,  description: "Fly high!" },
]

export interface ChildPetState {
  petType: ChildPetType | null
  petName: string
  happiness: number          // 0–100
  lastFed: number            // timestamp ms
  lastPlayed: number         // timestamp ms
  lastPetted: number         // timestamp ms
  coins: number              // current spendable balance
  coinsSpent: number         // lifetime coins spent on items
  ownedItems: string[]       // item ids
  equipped: Record<AccessorySlot, string | null>
  setupDone: boolean
}

const DEFAULT_STATE: ChildPetState = {
  petType: null,
  petName: "",
  happiness: 80,
  lastFed: 0,
  lastPlayed: 0,
  lastPetted: 0,
  coins: 0,
  coinsSpent: 0,
  ownedItems: [],
  equipped: { hat: null, outfit: null, toy: null },
  setupDone: false,
}

const STORAGE_KEY = "amanah_child_pet_v1"

function load(): ChildPetState {
  if (typeof window === "undefined") return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STATE
  }
}

function save(state: ChildPetState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const FEED_COOLDOWN_MS   = 10_000   // 10s demo cooldown (real: hours)
const PLAY_COOLDOWN_MS   = 10_000
const PET_COOLDOWN_MS    = 5_000
const HAPPINESS_DECAY_MS = 30 * 60 * 1000 // every 30 min -1 happiness

export function useChildPetStore(totalSavedBHD: number) {
  const [state, setState] = useState<ChildPetState>(DEFAULT_STATE)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = load()

    // Decay happiness based on time since last load
    const decayMins = Math.floor((Date.now() - stored.lastPetted) / HAPPINESS_DECAY_MS)
    const decayed = Math.max(0, stored.happiness - decayMins)

    // 5 coins per 1 BHD saved. Deduct lifetime spent so deleting a goal correctly reduces balance.
    const earned = Math.floor(totalSavedBHD * 5)
    const coins = Math.max(0, earned - (stored.coinsSpent ?? 0))

    setState({ ...stored, happiness: decayed, coins })
    setMounted(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync coins whenever totalSavedBHD changes (goal added, deleted, or contributed to)
  useEffect(() => {
    if (!mounted) return
    const earned = Math.floor(totalSavedBHD * 5)
    setState((prev) => {
      const coins = Math.max(0, earned - (prev.coinsSpent ?? 0))
      const next = { ...prev, coins }
      save(next)
      return next
    })
  }, [totalSavedBHD, mounted])

  function update(partial: Partial<ChildPetState>) {
    setState((prev) => {
      const next = { ...prev, ...partial }
      save(next)
      return next
    })
  }

  const choosePet = useCallback((type: ChildPetType, name: string) => {
    update({ petType: type, petName: name, setupDone: true, happiness: 80 })
  }, [])

  const feedPet = useCallback(() => {
    if (Date.now() - state.lastFed < FEED_COOLDOWN_MS) return false
    update({ happiness: Math.min(100, state.happiness + 12), lastFed: Date.now() })
    return true
  }, [state.happiness, state.lastFed])

  const playWithPet = useCallback(() => {
    if (Date.now() - state.lastPlayed < PLAY_COOLDOWN_MS) return false
    update({ happiness: Math.min(100, state.happiness + 15), lastPlayed: Date.now() })
    return true
  }, [state.happiness, state.lastPlayed])

  const petThePet = useCallback(() => {
    if (Date.now() - state.lastPetted < PET_COOLDOWN_MS) return false
    update({ happiness: Math.min(100, state.happiness + 5), lastPetted: Date.now() })
    return true
  }, [state.happiness, state.lastPetted])

  const buyItem = useCallback((itemId: string) => {
    const item = STORE_ITEMS.find((i) => i.id === itemId)
    if (!item || state.ownedItems.includes(itemId)) return false
    if (state.coins < item.cost) return false
    update({
      coins: state.coins - item.cost,
      coinsSpent: (state.coinsSpent ?? 0) + item.cost,
      ownedItems: [...state.ownedItems, itemId],
    })
    return true
  }, [state.coins, state.ownedItems])

  const equipItem = useCallback((itemId: string) => {
    const item = STORE_ITEMS.find((i) => i.id === itemId)
    if (!item || !state.ownedItems.includes(itemId)) return
    update({ equipped: { ...state.equipped, [item.slot]: itemId } })
  }, [state.equipped, state.ownedItems])

  const unequipSlot = useCallback((slot: AccessorySlot) => {
    update({ equipped: { ...state.equipped, [slot]: null } })
  }, [state.equipped])

  const cooldowns = {
    feed: Math.max(0, FEED_COOLDOWN_MS - (Date.now() - state.lastFed)),
    play: Math.max(0, PLAY_COOLDOWN_MS - (Date.now() - state.lastPlayed)),
    pet:  Math.max(0, PET_COOLDOWN_MS  - (Date.now() - state.lastPetted)),
  }

  return {
    ...state,
    mounted,
    choosePet,
    feedPet,
    playWithPet,
    petThePet,
    buyItem,
    equipItem,
    unequipSlot,
    cooldowns,
  }
}
