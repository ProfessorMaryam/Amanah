"use client"

import { useState } from "react"
import Link from "next/link"
import { useChildPet } from "@/lib/child-pet-context"
import { STORE_ITEMS, type AccessorySlot } from "@/lib/child-pet-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Toast ──────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState("")
  const [visible, setVisible] = useState(false)
  let timer: ReturnType<typeof setTimeout>
  function show(m: string) {
    setMsg(m); setVisible(true)
    clearTimeout(timer)
    timer = setTimeout(() => setVisible(false), 2500)
  }
  return { msg, visible, show }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function StorePage() {
  const pet = useChildPet()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<AccessorySlot>("hat")

  const items = STORE_ITEMS.filter(i => i.slot === activeTab)

  if (!pet.mounted) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 flex flex-col gap-5">

      {/* Back */}
      <Link href="/dashboard/child-view" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Pet Store</h1>
          <p className="text-sm text-muted-foreground">Dress up your pet!</p>
        </div>
      </div>

      {/* Coins display */}
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 shadow text-2xl">🪙</div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Your Coins</p>
              <p className="text-3xl font-extrabold text-amber-600">{pet.coins}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-right max-w-[140px]">Earn 100 coins for every 1 BHD you save!</p>
        </CardContent>
      </Card>

      {/* Tab selector */}
      <div className="flex gap-2">
        {(["hat", "outfit", "toy"] as AccessorySlot[]).map(slot => (
          <button
            key={slot}
            onClick={() => setActiveTab(slot)}
            className={cn(
              "flex-1 rounded-2xl py-3 text-sm font-bold capitalize transition-all",
              activeTab === slot ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {slot === "hat" ? "🎩 Hats" : slot === "outfit" ? "👗 Outfits" : "🎮 Toys"}
          </button>
        ))}
      </div>

      {/* Currently equipped in this slot */}
      {pet.equipped[activeTab] && (
        <div className="flex items-center justify-between rounded-2xl bg-violet-50 border-2 border-violet-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{STORE_ITEMS.find(i => i.id === pet.equipped[activeTab])?.emoji}</span>
            <span className="text-sm font-bold text-violet-700">
              {STORE_ITEMS.find(i => i.id === pet.equipped[activeTab])?.name} equipped
            </span>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => { pet.unequipSlot(activeTab); toast.show("Item removed!") }}>
            Remove
          </Button>
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const owned = pet.ownedItems.includes(item.id)
          const isEquipped = pet.equipped[item.slot] === item.id
          const canAfford = pet.coins >= item.cost

          return (
            <Card
              key={item.id}
              className={cn(
                "border-2 shadow-sm overflow-hidden transition-all duration-150",
                isEquipped  ? "border-violet-400 bg-violet-50"
                : owned     ? "border-green-300 bg-green-50"
                : canAfford ? "border-border hover:border-primary/40 hover:shadow-md"
                : "border-border opacity-60"
              )}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <span className="text-5xl">{item.emoji}</span>
                <div>
                  <p className="font-extrabold text-primary text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">🪙 {item.cost}</div>
                {isEquipped ? (
                  <span className="rounded-full bg-violet-500 text-white text-xs font-bold px-3 py-1">✓ Equipped</span>
                ) : owned ? (
                  <Button size="sm" className="h-8 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-full"
                    onClick={() => { pet.equipItem(item.id); toast.show(`${item.name} equipped! ✨`) }}>
                    Equip
                  </Button>
                ) : (
                  <Button size="sm" disabled={!canAfford}
                    className={cn("h-8 text-xs font-bold rounded-full", !canAfford && "opacity-50 cursor-not-allowed")}
                    onClick={() => {
                      if (pet.buyItem(item.id)) toast.show(`${item.name} purchased! 🛍️`)
                      else toast.show("Not enough coins! Keep saving! 💪")
                    }}>
                    {canAfford ? "Buy" : "Need more coins"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Toast */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-primary text-primary-foreground px-5 py-3 shadow-xl text-sm font-bold transition-all duration-300",
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {toast.msg}
      </div>

    </div>
  )
}
