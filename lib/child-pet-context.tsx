"use client"

// Wraps all child-view sub-pages so pet state is shared across routes
// without re-initialising on navigation.

import { createContext, useContext, type ReactNode } from "react"
import { useChildPetStore } from "@/lib/child-pet-store"
import type { ChildPetType } from "@/components/child-pet-sprite"
import type { AccessorySlot } from "@/lib/child-pet-store"

type PetStore = ReturnType<typeof useChildPetStore>

const ChildPetContext = createContext<PetStore | null>(null)

export function ChildPetProvider({
  children,
  totalSavedBHD,
}: {
  children: ReactNode
  totalSavedBHD: number
}) {
  const store = useChildPetStore(totalSavedBHD)
  return <ChildPetContext.Provider value={store}>{children}</ChildPetContext.Provider>
}

export function useChildPet(): PetStore {
  const ctx = useContext(ChildPetContext)
  if (!ctx) throw new Error("useChildPet must be used within ChildPetProvider")
  return ctx
}
