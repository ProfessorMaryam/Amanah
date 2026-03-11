"use client"

import { useApp } from "@/lib/app-context"
import { ChildPetProvider, useChildPet } from "@/lib/child-pet-context"
import { ChildSidebar } from "@/components/child-sidebar"
import { getPetStage } from "@/components/child-pet-sprite"
import { usePathname } from "next/navigation"

function ChildLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, personalGoals } = useApp()
  const pathname = usePathname()
  const pet = useChildPet()

  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)
  const petStage = pet.petType ? getPetStage(totalSaved) : 1

  const activeSection =
    pathname.endsWith("/pet")   ? "pet"   :
    pathname.endsWith("/goals") ? "goals" :
    pathname.endsWith("/store") ? "store" : "home"

  return (
    <div className="flex min-h-screen bg-background">
      <ChildSidebar
        userName={user.name}
        petName={pet.petName}
        petType={pet.petType}
        petStage={petStage}
        petHappiness={pet.happiness}
        coins={pet.coins}
        personalGoals={personalGoals}
        totalSaved={totalSaved}
        activeSection={activeSection}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-amanah-cream via-violet-50/30 to-white">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function ChildViewLayout({ children }: { children: React.ReactNode }) {
  const { personalGoals } = useApp()
  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)

  return (
    <ChildPetProvider totalSavedBHD={totalSaved}>
      <ChildLayoutShell>{children}</ChildLayoutShell>
    </ChildPetProvider>
  )
}
